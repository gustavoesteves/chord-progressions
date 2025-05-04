import { Injectable } from '@angular/core';
import { VoiceLeadingAlgorithmInterface, Voices, Tessituras } from '../../types';
import { Note } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class VoiceLeadingAlgorithm implements VoiceLeadingAlgorithmInterface {
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

  // Ajusta a nota para caber na tessitura, priorizando o caminho mais curto
  private adjustNoteToTessitura(note: string, tessitura: { min: number; max: number }, prevMidi?: number): string {
    const pitchClass = Note.pitchClass(note);
    const possibleNotes = this.getPossibleNotes(pitchClass, tessitura);

    if (possibleNotes.length === 0) {
      console.warn(`Nota ${note} não pôde ser ajustada para tessitura ${tessitura.min}-${tessitura.max}`);
      const closestMidi = this.noteToMidi(note) < tessitura.min ? tessitura.min : tessitura.max;
      return this.midiToNote(closestMidi, pitchClass);
    }

    if (prevMidi !== undefined) {
      // Escolhe a nota com o menor salto melódico
      return possibleNotes.reduce((prev, curr) => {
        return Math.abs(curr.midi - prevMidi) < Math.abs(prev.midi - prevMidi) ? curr : prev;
      }, possibleNotes[0]).note;
    }

    // Se não houver nota anterior, escolhe a nota mais próxima do MIDI médio da tessitura
    const midi = this.noteToMidi(note);
    return possibleNotes.reduce((prev, curr) => {
      return Math.abs(curr.midi - midi) < Math.abs(prev.midi - midi) ? curr : prev;
    }, possibleNotes[0]).note;
  }

  // Gera combinações válidas de atribuições de vozes com classes de pitch
  private generateValidCombinations(
    progressionNotes: string[][],
    maxCombinations: number = 10
  ): Voices[][] {
    const validCombinations: Voices[][] = [];
    const combinationSet = new Set<string>(); // Para evitar duplicatas
    const voiceKeys = ['baixo', 'tenor', 'contralto', 'soprano'] as const;

    const generateForChord = (
      chordIndex: number,
      prevVoices: Voices | null,
      currentCombination: Voices[]
    ) => {
      if (chordIndex >= progressionNotes.length) {
        // Verifica unicidade da combinação
        const combinationStr = JSON.stringify(currentCombination);
        if (!combinationSet.has(combinationStr)) {
          validCombinations.push([...currentCombination]);
          combinationSet.add(combinationStr);
          console.log(`Combinação ${validCombinations.length} gerada: ${combinationStr}`);
        }
        return validCombinations.length >= maxCombinations;
      }

      const chordNotes = progressionNotes[chordIndex].map(note => Note.pitchClass(note));
      console.log(`Gerando combinações para acorde ${chordIndex + 1}: ${chordNotes}`);

      // Identifica notas comuns com o acorde anterior
      const commonNotes = prevVoices
        ? chordNotes.filter(note => progressionNotes[chordIndex - 1].map(n => Note.pitchClass(n)).includes(note))
        : [];

      // Gera todas as permutações válidas para as vozes não-baixo
      const nonBassNotes = chordNotes.slice(1); // Notas disponíveis para tenor, contralto, soprano
      const generatePermutations = (notes: string[], current: string[], result: string[][]) => {
        if (current.length === voiceKeys.length - 1) {
          // Verifica se a permutação contém todas as notas necessárias
          const requiredNotes = nonBassNotes;
          if (requiredNotes.every(note => current.includes(note))) {
            result.push([...current]);
          }
          return;
        }

        for (const note of notes) {
          const newNotes = notes.filter((n, i) => n !== note || i !== notes.indexOf(note));
          current.push(note);
          generatePermutations(newNotes, current, result);
          current.pop();
        }
      };

      const permutations: string[][] = [];
      generatePermutations(nonBassNotes, [], permutations);

      for (const perm of permutations) {
        const voices: Voices = {
          baixo: chordNotes[0], // Baixo fixo
          tenor: perm[0],
          contralto: perm[1],
          soprano: perm[2]
        };

        // Prioriza notas comuns se disponíveis
        let isValid = true;
        if (prevVoices) {
          for (const voice of voiceKeys.slice(1)) {
            if (commonNotes.includes(prevVoices[voice]) && prevVoices[voice] !== voices[voice]) {
              // Permite a combinação apenas se a nota comum não for prioritária ou se for mantida
              if (!commonNotes.includes(voices[voice])) {
                isValid = false;
                break;
              }
            }
          }
        }

        if (isValid) {
          currentCombination.push(voices);
          if (generateForChord(chordIndex + 1, voices, currentCombination)) {
            return true;
          }
          currentCombination.pop();
        }
      }

      return false;
    };

    generateForChord(0, null, []);
    if (validCombinations.length === 0) {
      console.warn(`Nenhuma combinação válida gerada para progressão: ${JSON.stringify(progressionNotes)}`);
    }
    return validCombinations;
  }

  // Aplica tessituras e previne cruzamento de vozes em todo o result
  private applyTessiturasToResult(result: Voices[], tessituras: Tessituras): Voices[] {
    const adjustedResult: Voices[] = [];
    let prevVoices: Voices | null = null;

    result.forEach(voices => {
      const adjustedVoices: Voices = {
        soprano: '',
        contralto: '',
        tenor: '',
        baixo: ''
      };

      const prevMidi = prevVoices
        ? {
            baixo: this.noteToMidi(prevVoices['baixo']),
            tenor: this.noteToMidi(prevVoices['tenor']),
            contralto: this.noteToMidi(prevVoices['contralto']),
            soprano: this.noteToMidi(prevVoices['soprano'])
          }
        : undefined;

      adjustedVoices['baixo'] = this.adjustNoteToTessitura(voices['baixo'], tessituras.baixo, prevMidi?.baixo);
      adjustedVoices['tenor'] = this.adjustNoteToTessitura(voices['tenor'], tessituras.tenor, prevMidi?.tenor);
      adjustedVoices['contralto'] = this.adjustNoteToTessitura(voices['contralto'], tessituras.contralto, prevMidi?.contralto);
      adjustedVoices['soprano'] = this.adjustNoteToTessitura(voices['soprano'], tessituras.soprano, prevMidi?.soprano);

      const voiceKeys = ['baixo', 'tenor', 'contralto', 'soprano'] as const;
      let midiValues = voiceKeys.map(v => this.noteToMidi(adjustedVoices[v]));

      // Previne cruzamento de vozes
      for (let i = 1; i < midiValues.length; i++) {
        if (midiValues[i] <= midiValues[i - 1]) {
          const voice = voiceKeys[i];
          const tessitura = tessituras[voice];
          const prevMidi = midiValues[i - 1];
          let newMidi = prevMidi + 1;

          if (newMidi < tessitura.min) {
            newMidi = tessitura.min;
          } else if (newMidi > tessitura.max) {
            console.warn(`Não foi possível evitar cruzamento para ${voice} sem ultrapassar tessitura`);
            newMidi = tessitura.max;
          }

          const originalPitchClass = Note.pitchClass(voices[voice]);
          adjustedVoices[voice] = this.midiToNote(newMidi, originalPitchClass);
          midiValues[i] = this.noteToMidi(adjustedVoices[voice]);
        }
      }

      // Verifica se as notas estão dentro das tessituras
      for (const voice of voiceKeys) {
        const midi = this.noteToMidi(adjustedVoices[voice]);
        const tessitura = tessituras[voice];
        if (midi < tessitura.min || midi > tessitura.max) {
          adjustedVoices[voice] = this.adjustNoteToTessitura(voices[voice], tessitura, prevMidi ? prevMidi[voice] : undefined);
        }
      }

      adjustedResult.push(adjustedVoices);
      prevVoices = adjustedVoices;
    });

    return adjustedResult;
  }

  // Otimiza os trajetos das vozes para minimizar saltos
  private optimizeVoicePaths(result: Voices[], tessituras: Tessituras, progressionNotes: string[][]): Voices[] {
    const optimizedResult: Voices[] = [];
    let prevVoices: Voices | null = null;

    result.forEach((voices, index) => {
      const chordNotes = progressionNotes[index].map(note => Note.pitchClass(note));
      const voiceKeys = ['baixo', 'tenor', 'contralto', 'soprano'] as const;

      const possibleNotesByVoice = voiceKeys.map((voice, i) => ({
        voice,
        notes: this.getPossibleNotes(Note.pitchClass(voices[voice]), tessituras[voice])
      }));

      const combinations: { voices: Voices; cost: number }[] = [];
      const generateCombinations = (
        current: Voices,
        voiceIndex: number,
        usedNotes: Set<string>,
        prevMidi: { [key: string]: number } | undefined
      ) => {
        if (voiceIndex >= voiceKeys.length) {
          const midiValues = voiceKeys.map(v => this.noteToMidi(current[v]));
          if (
            midiValues[0] < midiValues[1] &&
            midiValues[1] < midiValues[2] &&
            midiValues[2] < midiValues[3]
          ) {
            let cost = 0;
            if (prevMidi) {
              voiceKeys.forEach(v => {
                const currMidi = this.noteToMidi(current[v]);
                cost += Math.abs(currMidi - prevMidi[v]);
              });
            }
            combinations.push({ voices: { ...current }, cost });
          }
          return;
        }

        const voice = voiceKeys[voiceIndex];
        const possibleNotes = possibleNotesByVoice[voiceIndex].notes.filter(
          note => !usedNotes.has(note.note)
        );

        possibleNotes.forEach(({ note }) => {
          current[voice] = note;
          usedNotes.add(note);
          generateCombinations(current, voiceIndex + 1, usedNotes, prevMidi);
          usedNotes.delete(note);
        });
      };

      const prevMidi = prevVoices
        ? {
            baixo: this.noteToMidi(prevVoices['baixo']),
            tenor: this.noteToMidi(prevVoices['tenor']),
            contralto: this.noteToMidi(prevVoices['contralto']),
            soprano: this.noteToMidi(prevVoices['soprano'])
          }
        : undefined;

      generateCombinations(
        { soprano: '', contralto: '', tenor: '', baixo: '' },
        0,
        new Set(),
        prevMidi
      );

      if (combinations.length === 0) {
        optimizedResult.push(voices);
        prevVoices = voices;
        return;
      }

      const bestCombination = combinations.reduce(
        (prev, curr) => (curr.cost < prev.cost ? curr : prev),
        combinations[0]
      );

      optimizedResult.push(bestCombination.voices);
      prevVoices = bestCombination.voices;
    });

    return optimizedResult;
  }

  applyVoiceLeading(
    progression: { roman: string[], transposed: string[], notes: string[][] },
    tessituras?: Tessituras,
    regenerate: boolean = false
  ): Voices[] {
    const result: Voices[] = [];
    const defaultTessituras: Tessituras = {
      soprano: { min: 60, max: 79, clef: 'G', staff: 1 },
      contralto: { min: 55, max: 74, clef: 'G', staff: 2 },
      tenor: { min: 48, max: 67, clef: 'G', staff: 3 },
      baixo: { min: 40, max: 60, clef: 'F', staff: 4 }
    };
    const usedTessituras = tessituras || defaultTessituras;

    if (!progression.notes || progression.notes.length === 0) {
      console.warn('Progressão vazia ou inválida');
      return result;
    }

    // Gera combinações válidas com classes de pitch
    const validCombinations = this.generateValidCombinations(progression.notes);
    if (validCombinations.length === 0) {
      console.warn(`Nenhuma combinação válida gerada para progressão: ${JSON.stringify(progression.notes)}`);
      // Fallback para uma atribuição simples
      const fallbackResult: Voices[] = [];
      progression.notes.forEach((chord: string[]) => {
        const voices: Voices = {
          baixo: chord[0],
          tenor: chord[1] || chord[0],
          contralto: chord[2] || chord[0],
          soprano: chord[3] || chord[0]
        };
        fallbackResult.push(voices);
      });
      const tessituraAdjusted = this.applyTessiturasToResult(fallbackResult, usedTessituras);
      return this.optimizeVoicePaths(tessituraAdjusted, usedTessituras, progression.notes);
    }

    // Escolhe uma combinação aleatoriamente se regenerate for true
    const selectedCombination = regenerate
      ? validCombinations[Math.floor(Math.random() * validCombinations.length)]
      : validCombinations[0];

    // Aplica tessituras e otimização para garantir qualidade
    const tessituraAdjustedResult = this.applyTessiturasToResult(selectedCombination, usedTessituras);
    return this.optimizeVoicePaths(tessituraAdjustedResult, usedTessituras, progression.notes);
  }
}