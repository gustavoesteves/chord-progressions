import { ProgressionAlgorithm } from '../../types';
import { TonalityService } from '../../tonality/tonality.service';
import { Injectable } from '@angular/core';
import { Chord } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class InvertedTriadProgressionAlgorithm implements ProgressionAlgorithm {
  name = 'Encadeamento com tríades invertidas';
  private progressionLength: number = 0;

  constructor(private tonalityService: TonalityService) {}

  private hasCommonNote(chord1: string, chord2: string, tonality: string): boolean {
    const chord1Data = this.tonalityService.getChordForDegree(chord1.split('/')[0], tonality, 'maior');
    const chord2Data = this.tonalityService.getChordForDegree(chord2.split('/')[0], tonality, 'maior');
    let chordNotes1 = Chord.get(chord1Data.chord).notes.slice(0, 3);
    let chordNotes2 = Chord.get(chord2Data.chord).notes.slice(0, 3);

    // Ajustar notas para inversões
    const inversion1 = chord1.split('/')[1];
    const inversion2 = chord2.split('/')[1];
    if (inversion1 === '1') {
      chordNotes1 = [chordNotes1[1], chordNotes1[2], chordNotes1[0]]; // Primeira inversão
    } else if (inversion1 === '2') {
      chordNotes1 = [chordNotes1[2], chordNotes1[0], chordNotes1[1]]; // Segunda inversão
    }
    if (inversion2 === '1') {
      chordNotes2 = [chordNotes2[1], chordNotes2[2], chordNotes2[0]]; // Primeira inversão
    } else if (inversion2 === '2') {
      chordNotes2 = [chordNotes2[2], chordNotes2[0], chordNotes2[1]]; // Segunda inversão
    }

    const commonNotes = chordNotes1.some(note => chordNotes2.includes(note));
    if (!commonNotes) {
      console.log(
        `No common notes between ${chord1} (${chordNotes1}) and ${chord2} (${chordNotes2})`
      );
    }
    return commonNotes;
  }

  private isValidProgression(progression: string[], nextChord: string, tonality: string): boolean {
    if (!progression || progression.length === 0) return true;

    const lastChord = progression[progression.length - 1];
    const [lastDegree, lastInversion] = lastChord.split('/');
    const [nextDegree, nextInversion] = nextChord.split('/');

    // Permitir o último acorde ser I
    if (progression.length === this.progressionLength - 1 && nextDegree === 'I') {
      return true;
    }

    // Evitar repetição de acordes, exceto para I no final
    const existingChord = progression.find(chord => chord === nextChord);
    if (existingChord) {
      console.log(`Repetição detectada: ${nextChord} já existe em ${progression}`);
      return false;
    }

    // Verificar notas comuns considerando inversões
    if (!this.hasCommonNote(lastChord, nextChord, tonality)) {
      return false;
    }

    // Regras específicas para vii*
    if (lastDegree === 'vii*') {
      const isValid = nextDegree === 'iii';
      if (!isValid) console.log(`vii* deve ser seguido por iii, mas encontrou ${nextChord}`);
      return isValid;
    }
    if (nextDegree === 'vii*' && !['ii', 'IV'].includes(lastDegree)) {
      console.log(`vii* deve ser precedido por ii ou IV, mas foi precedido por ${lastChord}`);
      return false;
    }

    // Restrições para inversões
    if (nextInversion === '2' && lastInversion) {
      console.log(
        `Segunda inversão ${nextChord} não pode ser precedida por acorde com inversão ${lastChord}`
      );
      return false;
    }
    if (lastInversion === '2' && nextInversion === '2') {
      console.log(
        `Segunda inversão ${lastChord} não pode ser seguida por outra segunda inversão ${nextChord}`
      );
      return false;
    }

    return true;
  }

  private *generateProgressionsRecursive(
    currentProgression: string[],
    remainingChords: string[],
    targetLength: number,
    tonality: string,
    maxInversions: number,
    currentInversions: number
  ): Generator<string[], void, undefined> {
    if (currentProgression.length === targetLength - 2) {
      const possibleVChords = remainingChords.filter(chord => chord.startsWith('V'));
      for (const vChord of possibleVChords) {
        if (this.isValidProgression(currentProgression, vChord, tonality)) {
          const newProgression = [...currentProgression, vChord];
          if (this.isValidProgression(newProgression, 'I', tonality)) {
            yield [...newProgression, 'I'];
          }
        }
      }
      return;
    }

    const lastChord = currentProgression[currentProgression.length - 1];
    if (lastChord.startsWith('vii*')) {
      const iiiChords = remainingChords.filter(chord => chord.startsWith('iii'));
      for (const iiiChord of iiiChords) {
        if (this.isValidProgression(currentProgression, iiiChord, tonality)) {
          const newProgression = [...currentProgression, iiiChord];
          const newRemaining = remainingChords.filter(chord => chord !== iiiChord);
          const newInversions = currentInversions + (iiiChord.includes('/') ? 1 : 0);
          if (newInversions <= maxInversions) {
            yield* this.generateProgressionsRecursive(
              newProgression,
              newRemaining,
              targetLength,
              tonality,
              maxInversions,
              newInversions
            );
          }
        }
      }
      return;
    }

    for (const nextChord of remainingChords) {
      if (currentProgression.length === 0 && nextChord !== 'I') continue;
      if (currentProgression.length === 1 && nextChord.startsWith('I')) continue;
      if (this.isValidProgression(currentProgression, nextChord, tonality)) {
        const newProgression = [...currentProgression, nextChord];
        const newRemaining = remainingChords.filter(chord => chord !== nextChord);
        const newInversions = currentInversions + (nextChord.includes('/') ? 1 : 0);
        if (newInversions <= maxInversions) {
          yield* this.generateProgressionsRecursive(
            newProgression,
            newRemaining,
            targetLength,
            tonality,
            maxInversions,
            newInversions
          );
        }
      }
    }
  }

  *generateProgressions(
    tonality: string,
    progressionLength: number
  ): Generator<
    { roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] },
    void,
    undefined
  > {
    this.progressionLength = progressionLength;
    const allChords: string[] = [];
    const degrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii*'];
    degrees.forEach(degree => {
      allChords.push(degree);
      allChords.push(`${degree}/1`);
      allChords.push(`${degree}/2`);
    });

    const maxInversions = 1;
    const progressions = this.generateProgressionsRecursive(
      ['I'],
      allChords,
      progressionLength,
      tonality,
      maxInversions,
      0
    );

    for (const progression of progressions) {
      const roman = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        let romanWithInversion = data.roman;
        if (inversion === '1') romanWithInversion += '6';
        if (inversion === '2') romanWithInversion += '6/4';
        return romanWithInversion;
      });
      const transposed = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        const baseChord = data.chord;
        if (inversion === '1') {
          const chordNotes = Chord.get(baseChord).notes.slice(0, 3);
          const thirdNote = chordNotes[1];
          return `${baseChord}/${thirdNote}`;
        } else if (inversion === '2') {
          const chordNotes = Chord.get(baseChord).notes.slice(0, 3);
          const fifthNote = chordNotes[2];
          return `${baseChord}/${fifthNote}`;
        }
        return baseChord;
      });
      const notes = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        let chordNotes = data.notes; // Ex.: [G, B, D, G] para V
        if (inversion === '1') {
          chordNotes = [chordNotes[1], chordNotes[2], chordNotes[0], chordNotes[0]]; // [B, D, G, G] para V6
        } else if (inversion === '2') {
          chordNotes = [chordNotes[2], chordNotes[0], chordNotes[1], chordNotes[2]]; // [D, G, B, D] para V6/4
        }
        return chordNotes;
      });
      const functions = progression.map(chord => {
        const [degree] = chord.split('/');
        const functionMap: { [key: string]: string } = {
          I: 'T',
          ii: 'SD',
          iii: 'T',
          IV: 'SD',
          V: 'D',
          vi: 'T',
          'vii*': 'D'
        };
        return [functionMap[degree] || 'T'];
      });
      yield {
        roman,
        transposed,
        notes,
        functions
      };
    }
  }
}