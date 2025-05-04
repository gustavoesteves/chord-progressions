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

  // Ajusta a nota para caber na tessitura, priorizando o range
  private adjustNoteToTessitura(note: string, tessitura: { min: number; max: number }, prevMidi?: number): string {
    const pitchClass = Note.pitchClass(note);
    const possibleNotes = this.getPossibleNotes(pitchClass, tessitura);

    if (possibleNotes.length === 0) {
      console.warn(`Nota ${note} não pôde ser ajustada para tessitura ${tessitura.min}-${tessitura.max}`);
      const closestMidi = this.noteToMidi(note) < tessitura.min ? tessitura.min : tessitura.max;
      return this.midiToNote(closestMidi, pitchClass);
    }

    // Prioriza a tessitura, escolhendo a nota mais próxima do prevMidi dentro da tessitura
    if (prevMidi !== undefined) {
      return possibleNotes.reduce((prev, curr) => {
        return Math.abs(curr.midi - prevMidi) < Math.abs(prev.midi - prevMidi) ? curr : prev;
      }, possibleNotes[0]).note;
    }

    // Sem prevMidi, usa a nota mais próxima do MIDI original
    const midi = this.noteToMidi(note);
    return possibleNotes.reduce((prev, curr) => {
      return Math.abs(curr.midi - midi) < Math.abs(prev.midi - midi) ? curr : prev;
    }, possibleNotes[0]).note;
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
      let midiVoices = voiceKeys.map(v => this.noteToMidi(adjustedVoices[v]));

      for (let i = 1; i < midiVoices.length; i++) {
        if (midiVoices[i] <= midiVoices[i - 1]) {
          const voice = voiceKeys[i];
          const tessitura = tessituras[voice];
          const prevMidi = midiVoices[i - 1];
          let newMidi = prevMidi + 1;

          if (newMidi < tessitura.min) {
            newMidi = tessitura.min;
          } else if (newMidi > tessitura.max) {
            console.warn(`Não foi possível evitar cruzamento para ${voice} sem ultrapassar tessitura`);
            newMidi = tessitura.max;
          }

          const originalPitchClass = Note.pitchClass(voices[voice]);
          adjustedVoices[voice] = this.midiToNote(newMidi, originalPitchClass);
          midiVoices[i] = this.noteToMidi(adjustedVoices[voice]);
        }
      }

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
      const chordNotes = progressionNotes[index];
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

      // Inicializa current com propriedades vazias para satisfazer a interface Voices
      generateCombinations(
        { soprano: '', contralto: '', tenor: '', baixo: '' },
        0,
        new Set(),
        prevMidi
      );

      const bestCombination = combinations.reduce(
        (prev, curr) => (curr.cost < prev.cost ? curr : prev),
        combinations[0] || { voices: voices, cost: Infinity }
      );

      optimizedResult.push(bestCombination.voices);
      prevVoices = bestCombination.voices;
    });

    return optimizedResult;
  }

  applyVoiceLeading(
    progression: { roman: string[], transposed: string[], notes: string[][] },
    tessituras?: Tessituras
  ): Voices[] {
    const result: Voices[] = [];
    const defaultTessituras: Tessituras = {
      soprano: { min: 60, max: 79, clef: 'G', staff: 1 },
      contralto: { min: 55, max: 74, clef: 'G', staff: 1 },
      tenor: { min: 48, max: 67, clef: 'F', staff: 2 },
      baixo: { min: 40, max: 60, clef: 'F', staff: 2 }
    };
    const usedTessituras = tessituras || defaultTessituras;

    if (!progression.notes || progression.notes.length === 0) {
      console.warn('Progressão vazia ou inválida');
      return result;
    }

    // Processa o primeiro acorde
    let prevVoices = this.initializeFirstChord(progression.notes[0]);
    result.push(prevVoices);

    // Processa acordes subsequentes
    for (let i = 1; i < progression.notes.length; i++) {
      const currVoices = this.assignVoices(progression.notes[i], progression.notes[i - 1], prevVoices);
      result.push(currVoices);
      prevVoices = currVoices;
    }

    // Aplica tessituras inicialmente
    const tessituraAdjustedResult = this.applyTessiturasToResult(result, usedTessituras);

    // Otimiza os trajetos para minimizar saltos
    return this.optimizeVoicePaths(tessituraAdjustedResult, usedTessituras, progression.notes);
  }

  // Inicializa o primeiro acorde
  private initializeFirstChord(chord: string[]): Voices {
    const voices: Voices = {
      soprano: '',
      contralto: '',
      tenor: '',
      baixo: ''
    };

    voices['baixo'] = chord[0];
    const remainingNotes = chord.slice(1);
    voices['tenor'] = remainingNotes[0] || '';
    voices['contralto'] = remainingNotes[1] || '';
    voices['soprano'] = remainingNotes[2] || '';

    return voices;
  }

  // Atribui vozes para acordes subsequentes
  private assignVoices(currChord: string[], prevChord: string[], prevVoices: Voices): Voices {
    const voices: Voices = {
      soprano: '',
      contralto: '',
      tenor: '',
      baixo: ''
    };

    voices['baixo'] = currChord[0];
    const prevNotes = prevChord.slice(1);
    const currNotes = currChord.slice(1);
    const commonNotes = currNotes.filter(note => prevNotes.includes(note));

    const prevVoiceMap: { [key: string]: string } = {
      soprano: prevVoices['soprano'],
      contralto: prevVoices['contralto'],
      tenor: prevVoices['tenor']
    };

    const assignedNotes = new Set<string>();
    const voiceAssignments: { [key: string]: string } = {};

    for (const note of commonNotes) {
      const prevVoice = Object.keys(prevVoiceMap).find(v => prevVoiceMap[v] === note);
      if (prevVoice && !assignedNotes.has(note)) {
        voiceAssignments[prevVoice] = note;
        assignedNotes.add(note);
      }
    }

    const remainingVoices = ['soprano', 'contralto', 'tenor'].filter(v => !voiceAssignments[v]);
    const remainingNotes = currNotes.filter(note => !assignedNotes.has(note));

    for (let i = 0; i < remainingVoices.length; i++) {
      const voice = remainingVoices[i];
      const note = remainingNotes[i];
      if (note) {
        voiceAssignments[voice] = note;
        assignedNotes.add(note);
      }
    }

    voices['soprano'] = voiceAssignments['soprano'] || (currNotes.length > 0 ? currNotes[0] : '');
    voices['contralto'] = voiceAssignments['contralto'] || (currNotes.length > 1 ? currNotes[1] : '');
    voices['tenor'] = voiceAssignments['tenor'] || (currNotes.length > 2 ? currNotes[2] : '');

    return voices;
  }
}