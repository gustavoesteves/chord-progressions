import { Injectable } from '@angular/core';
import { VoiceLeadingAlgorithmInterface, Voices, Tessituras, VoiceLeadingRules } from '../../types';
import { Note } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class VoiceLeadingAlgorithm implements VoiceLeadingAlgorithmInterface {

  public readonly DEFAULT_RULES: VoiceLeadingRules = {
    penalizeParallelFifths: true,
    penalizeParallelOctaves: true,
    penalizeVoiceCrossing: true,
    maxLeapInterval: 12,
    resolveSevenths: false, // Default desativado para acordes simples
    resolveLeadingTone: false
  };

  // Converte nota (ex.: "C") para número MIDI, assumindo uma oitava padrão
  private noteToMidi(note: string, defaultOctave: number = 4): number {
    const normalizedNote = note.match(/\d/) ? note : `${note}${defaultOctave}`;
    const midi = Note.midi(normalizedNote);
    if (!midi) {
      console.warn(`Nota inválida: ${note}, usando C4 como padrão`);
      return 60; // C4
    }
    return midi;
  }

  // Converte número MIDI para nota, preservando a classe de pitch original
  private midiToNote(midi: number, originalPitchClass: string): string {
    const cleanPitchClass = originalPitchClass.replace(/\d+$/, '');
    const noteData = Note.get(cleanPitchClass);
    if (!noteData || !noteData.pc) {
      console.warn(`Classe de pitch inválida: ${cleanPitchClass}, usando C4`);
      return 'C4';
    }
    const possibleNotes = [];
    for (let octave = 0; octave <= 8; octave++) {
      const note = `${cleanPitchClass}${octave}`;
      const noteMidi = Note.midi(note);
      if (noteMidi) {
        possibleNotes.push({ note, midi: noteMidi });
      }
    }
    const closest = possibleNotes.reduce((prev, curr) => {
      return Math.abs(curr.midi - midi) < Math.abs(prev.midi - midi) ? curr : prev;
    }, possibleNotes[0]);
    return closest ? closest.note : Note.fromMidi(midi) || 'C4';
  }

  // Gera todas as notas possíveis para uma voz dentro da tessitura
  private getPossibleNotes(pitchClass: string, tessitura: { min: number; max: number }): { note: string; midi: number }[] {
    const possibleNotes = [];
    for (let octave = 0; octave <= 8; octave++) {
      const note = `${pitchClass}${octave}`;
      const midi = Note.midi(note);
      if (midi && midi >= tessitura.min && midi <= tessitura.max) {
        possibleNotes.push({ note, midi });
      }
    }
    return possibleNotes;
  }

  // Avalia o custo de uma transição entre acordes baseada em regras de coral (Schoenberg)
  private evaluateTransitionCost(
    prevMidi: { [key: string]: number } | null,
    currentMidi: { [key: string]: number },
    prevChordNotes: string[] | null,
    currentChordNotes: string[],
    rules: VoiceLeadingRules
  ): number {
    let cost = 0;
    
    // 1. Regra estrita: Sem cruzamento de vozes (Bass < Tenor < Contralto < Soprano)
    if (
      currentMidi['baixo'] >= currentMidi['tenor'] ||
      currentMidi['tenor'] >= currentMidi['contralto'] ||
      currentMidi['contralto'] >= currentMidi['soprano']
    ) {
      if (rules.penalizeVoiceCrossing) {
        return Infinity; // Combinação inválida se cruzar vozes e regra ativa
      } else {
        cost += 500; // Penaliza muito, mas permite se a regra for desligada
      }
    }

    // 2. Limites de espaçamento (Geralmente no max 1 oitava entre S/C e C/T)
    if (currentMidi['soprano'] - currentMidi['contralto'] > 12) cost += 100;
    if (currentMidi['contralto'] - currentMidi['tenor'] > 12) cost += 100;
    // Tenor e Baixo podem ter mais espaçamento, mas muito grande é ruim
    if (currentMidi['tenor'] - currentMidi['baixo'] > 24) cost += 50;

    if (!prevMidi) return cost; // Se for o primeiro acorde, só avalia spacing e crossing

    const voiceKeys = ['baixo', 'tenor', 'contralto', 'soprano'];
    
    // 3. Regras de paralelismo (5as e 8as)
    for (let i = 0; i < voiceKeys.length; i++) {
      for (let j = i + 1; j < voiceKeys.length; j++) {
        const v1 = voiceKeys[i];
        const v2 = voiceKeys[j];
        
        const prevInterval = prevMidi[v2] - prevMidi[v1];
        const currInterval = currentMidi[v2] - currentMidi[v1];
        
        // Verifica se ambas as vozes se moveram
        const v1Moved = currentMidi[v1] !== prevMidi[v1];
        const v2Moved = currentMidi[v2] !== prevMidi[v2];
        
        if (v1Moved && v2Moved) {
          // Simplificação: Verifica se o intervalo anterior e atual formam uma quinta ou oitava (modulo 12)
          // E se moveram na mesma direção (paralelismo real)
          const dir1 = Math.sign(currentMidi[v1] - prevMidi[v1]);
          const dir2 = Math.sign(currentMidi[v2] - prevMidi[v2]);
          
          if (dir1 === dir2) {
            const isPerfectOctave = (interval: number) => interval % 12 === 0;
            const isPerfectFifth = (interval: number) => interval % 12 === 7;
            
            if (isPerfectOctave(prevInterval) && isPerfectOctave(currInterval)) {
              if (rules.penalizeParallelOctaves) {
                cost += 1000; // Penalidade massiva para 8as paralelas
              } else {
                cost += 50; // Se desligado, penaliza menos
              }
            }
            if (isPerfectFifth(prevInterval) && isPerfectFifth(currInterval)) {
              if (rules.penalizeParallelFifths) {
                cost += 1000; // Penalidade massiva para 5as paralelas
              } else {
                cost += 50; 
              }
            }
          }
        }
      }
    }

    // 3.5 Tratamento de Dissonâncias (Sétima e Sensível)
    if (rules.resolveSevenths && prevChordNotes) {
      // Simplificado: Assumimos que a 4ª nota do array do acorde é a sétima
      if (prevChordNotes.length > 3) {
        const seventhNote = prevChordNotes[3];
        const seventhIndexVoiceOptions = voiceKeys.filter(v => Note.pitchClass(this.midiToNote(prevMidi[v], seventhNote)) === Note.pitchClass(seventhNote));
        if (seventhIndexVoiceOptions.length > 0) {
          const v = seventhIndexVoiceOptions[0]; // A voz que cantou a sétima
          const midiMovement = currentMidi[v] - prevMidi[v];
          // A sétima deve resolver descendo por grau conjunto (aprox -1 a -2 semitons)
          if (midiMovement >= 0 || midiMovement < -2) {
            cost += 400; // Penalidade fortíssima por não resolver a sétima descendo
          }
        }
      }
    }

    if (rules.resolveLeadingTone && prevChordNotes) {
      // Simplificado: Assumimos que a 3ª nota do array (a terça do acorde dominante) é a sensível
      if (prevChordNotes.length > 2) {
        // Precisaríamos saber funcionalmente se é dominante, mas testamos a 3ª como sensível genérica em tétrades
        const thirdNote = prevChordNotes[2];
        const thirdIndexVoiceOptions = voiceKeys.filter(v => Note.pitchClass(this.midiToNote(prevMidi[v], thirdNote)) === Note.pitchClass(thirdNote));
        if (thirdIndexVoiceOptions.length > 0 && prevChordNotes.length > 3) {
          const v = thirdIndexVoiceOptions[0]; // Voz que cantou a terça/sensível
          const midiMovement = currentMidi[v] - prevMidi[v];
          // Sensível resolve subindo (1 a 2 semitons)
          if (midiMovement <= 0 || midiMovement > 2) {
            cost += 400; // Penalidade fortíssima por não resolver a sensível subindo
          }
        }
      }
    }

    // 4. Saltos e movimento de vozes
    // Penaliza saltos maiores. Vozes internas (C, T) devem se mover menos.
    voiceKeys.forEach(v => {
      const leap = Math.abs(currentMidi[v] - prevMidi[v]);
      if (leap === 0) {
        cost -= 10; // Recompensa notas comuns
      } else if (leap <= 2) {
        cost += 1; // Movimento de grau conjunto é muito bom
      } else if (leap <= 4) {
        cost += 5; // Terças são ok
      } else {
        // Saltos maiores
        let penalty = leap * 2;
        if (v === 'contralto' || v === 'tenor') {
          penalty *= 2; // Penalidade extra para saltos grandes em vozes internas
        }
        if (v === 'baixo' && leap <= 12) {
          penalty = Math.floor(penalty / 2); // Baixo pode saltar mais
        }
        
        if (leap > rules.maxLeapInterval) {
           penalty += 200; // Ultrapassou o intervalo máximo estipulado nas regras
        }

        cost += penalty;
      }
    });

    return cost;
  }

  // Gera combinações otimizadas para toda a progressão usando uma busca com função de custo
  private generateOptimizedCombinations(
    progressionNotes: string[][],
    tessituras: Tessituras,
    rules: VoiceLeadingRules,
    maxCombinations: number = 10
  ): Voices[][] {
    const validCombinations: { path: Voices[]; cost: number }[] = [];
    const voiceKeys = ['baixo', 'tenor', 'contralto', 'soprano'] as const;

    const backtrack = (
      chordIndex: number,
      currentPath: Voices[],
      currentCost: number,
      prevMidi: { [key: string]: number } | null
    ) => {
      if (chordIndex >= progressionNotes.length) {
        validCombinations.push({ path: [...currentPath], cost: currentCost });
        // Mantém apenas os top N melhores pra evitar que cresça muito
        validCombinations.sort((a, b) => a.cost - b.cost);
        if (validCombinations.length > maxCombinations * 5) { // Mantém buffer e depois corta
            validCombinations.length = maxCombinations * 5;
        }
        return;
      }

      // Se o custo atual já for muito maior que as opções conhecidas, poda o caminho
      if (validCombinations.length >= maxCombinations && currentCost > validCombinations[maxCombinations - 1].cost + 50) {
          return;
      }

      const chordNotes = progressionNotes[chordIndex].map(note => Note.pitchClass(note));
      const bassNote = chordNotes[0];
      const otherNotes = chordNotes.slice(1);

      // Gerar permutações das notas para as 3 vozes superiores
      const getPermutations = (elements: string[]) => {
        if (elements.length === 1) return [elements];
        return elements.reduce((acc: string[][], el, i) => {
          const rest = [...elements.slice(0, i), ...elements.slice(i + 1)];
          const perms = getPermutations(rest);
          perms.forEach(p => acc.push([el, ...p]));
          return acc;
        }, []);
      };

      const notePermutations = getPermutations(otherNotes);
      // Para cada permutação, vamos testar as opções de oitavas dentro da tessitura
      
      for (const perm of notePermutations) {
          const bassOpts = this.getPossibleNotes(bassNote, tessituras.baixo);
          if (bassOpts.length === 0) continue;
          
          const tenorOpts = this.getPossibleNotes(perm[0], tessituras.tenor);
          const altoOpts = this.getPossibleNotes(perm[1], tessituras.contralto);
          const sopranoOpts = this.getPossibleNotes(perm[2], tessituras.soprano);

          // Testar algumas combinações de oitavas (para não estourar combinatória, pega a com menor salto do anterior ou 2 por voz)
          // Uma melhoria seria testar todas as oitavas válidas.
          
          for (const s of sopranoOpts) {
              for (const a of altoOpts) {
                  for (const t of tenorOpts) {
                      for (const b of bassOpts) {
                          const currentMidi = { baixo: b.midi, tenor: t.midi, contralto: a.midi, soprano: s.midi };
                          
                          const prevChordParams = prevMidi ? progressionNotes[chordIndex - 1] : null;
                          const transitionCost = this.evaluateTransitionCost(prevMidi, currentMidi, prevChordParams, progressionNotes[chordIndex], rules);
                          
                          if (transitionCost < Infinity) {
                              const voices: Voices = { baixo: b.note, tenor: t.note, contralto: a.note, soprano: s.note };
                              currentPath.push(voices);
                              backtrack(chordIndex + 1, currentPath, currentCost + transitionCost, currentMidi);
                              currentPath.pop();
                          }
                      }
                  }
              }
          }
      }
    };

    backtrack(0, [], 0, null);

    // Retorna apenas os top N caminhos
    return validCombinations.sort((a, b) => a.cost - b.cost).slice(0, maxCombinations).map(c => c.path);
  }

  applyVoiceLeading(
    progression: { roman: string[], transposed: string[], notes: string[][] },
    tessituras?: Tessituras,
    regenerate: boolean = false,
    rules?: VoiceLeadingRules
  ): Voices[] {
    const result: Voices[] = [];
    const activeRules = rules || this.DEFAULT_RULES;

    const defaultTessituras: Tessituras = {
      soprano: { min: 60, max: 79, clef: 'G', staff: 1 }, // C4 a G5
      contralto: { min: 55, max: 74, clef: 'G', staff: 2 }, // G3 a D5
      tenor: { min: 48, max: 67, clef: 'G', staff: 3 }, // C3 a G4
      baixo: { min: 40, max: 60, clef: 'F', staff: 4 }  // E2 a C4
    };
    const usedTessituras = tessituras || defaultTessituras;

    if (!progression.notes || progression.notes.length === 0) {
      console.warn('Progressão vazia ou inválida');
      return result;
    }

    // Gera e avalia as combinações diretamente com oitavas e tessituras aplicadas
    const validCombinations = this.generateOptimizedCombinations(progression.notes, usedTessituras, activeRules);
    
    if (validCombinations.length === 0) {
      console.warn(`Nenhuma condução de vozes estrita gerada para: ${JSON.stringify(progression.notes)}`);
      // Retorna uma progressão básica caso as regras estritas não consigam resolver (improvável mas serve de fallback)
      const fallbackResult: Voices[] = [];
      progression.notes.forEach((chord: string[]) => {
        fallbackResult.push({
          baixo: this.midiToNote(this.getPossibleNotes(Note.pitchClass(chord[0]), usedTessituras.baixo)[0]?.midi || 48, chord[0]),
          tenor: this.midiToNote(this.getPossibleNotes(Note.pitchClass(chord[1] || chord[0]), usedTessituras.tenor)[0]?.midi || 55, chord[1] || chord[0]),
          contralto: this.midiToNote(this.getPossibleNotes(Note.pitchClass(chord[2] || chord[0]), usedTessituras.contralto)[0]?.midi || 60, chord[2] || chord[0]),
          soprano: this.midiToNote(this.getPossibleNotes(Note.pitchClass(chord[3] || chord[0]), usedTessituras.soprano)[0]?.midi || 67, chord[3] || chord[0])
        });
      });
      return fallbackResult;
    }

    // Escolhe uma combinação
    let selectedCombination;
    if (regenerate && validCombinations.length > 1) {
       // Escolhe aleatoriamente entre as top opções, favorecendo estatisticamente os melhores
       const randomIndex = Math.floor(Math.random() * Math.min(validCombinations.length, 5)); 
       selectedCombination = validCombinations[randomIndex];
    } else {
       selectedCombination = validCombinations[0];
    }

    return selectedCombination;
  }
}