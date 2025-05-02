import { ProgressionAlgorithm } from '../progression-algorithm.interface';
import { TonalityService } from '../../tonality/tonality.service';
import { Injectable } from '@angular/core';
import { Chord } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class InvertedTriadProgressionAlgorithm implements ProgressionAlgorithm {
  name = 'Encadeamento com tríades invertidas';

  constructor(private tonalityService: TonalityService) {}

  private hasCommonNote(chord1: string, chord2: string): boolean {
    const chordNotes1 = Chord.get(chord1).notes.slice(0, 3);
    const chordNotes2 = Chord.get(chord2).notes.slice(0, 3);

    const commonNotes = chordNotes1.some((note: string) => chordNotes2.includes(note));
    if (!commonNotes) {
      console.log(`No common notes between ${chord1} (${chordNotes1}) and ${chord2} (${chordNotes2})`);
    }
    return commonNotes;
  }

  private isValidProgression(progression: string[], nextChord: string, tonality: string): boolean {
    if (!progression || progression.length === 0) return true;

    const lastChord = progression[progression.length - 1];
    const [lastDegree, lastInversion] = lastChord.split('/');
    const [nextDegree, nextInversion] = nextChord.split('/');

    const isLastChord = progression.length === this.progressionLength - 1 && nextChord === "I";
    if (!isLastChord) {
      const existingChord = progression.find(chord => chord === nextChord);
      if (existingChord) {
        console.log(`Repetição detectada: ${nextChord} já existe em ${progression}`);
        return false;
      }
    }

    const lastChordData = this.tonalityService.getChordForDegree(lastDegree, tonality, 'maior');
    const nextChordData = this.tonalityService.getChordForDegree(nextDegree, tonality, 'maior');
    if (!this.hasCommonNote(lastChordData.chord, nextChordData.chord)) {
      return false;
    }

    if (lastDegree === "vii*") {
      const isValid = nextDegree === "iii";
      if (!isValid) console.log(`vii* deve ser seguido por iii, mas encontrou ${nextChord}`);
      return isValid;
    }
    if (nextDegree === "vii*" && !["ii", "IV"].includes(lastDegree)) {
      console.log(`vii* deve ser precedido por ii ou IV, mas foi precedido por ${lastChord}`);
      return false;
    }

    if (nextInversion === "2" && lastInversion) {
      console.log(`Segunda inversão ${nextChord} não pode ser precedida por acorde com inversão ${lastChord}`);
      return false;
    }

    if (lastInversion === "2" && nextInversion === "2") {
      console.log(`Segunda inversão ${lastChord} não pode ser seguida por outra segunda inversão ${nextChord}`);
      return false;
    }

    return true;
  }

  private progressionLength: number = 0;

  private *generateProgressionsRecursive(
    currentProgression: string[],
    remainingChords: string[],
    targetLength: number,
    tonality: string,
    maxInversions: number,
    currentInversions: number
  ): Generator<string[], void, undefined> {
    if (currentProgression.length === targetLength - 2) {
      const possibleVChords = remainingChords.filter(chord => chord.startsWith("V"));
      for (const vChord of possibleVChords) {
        if (this.isValidProgression(currentProgression, vChord, tonality)) {
          const newProgression = [...currentProgression, vChord];
          if (this.isValidProgression(newProgression, "I", tonality)) {
            yield [...newProgression, "I"];
          }
        }
      }
      return;
    }

    const lastChord = currentProgression[currentProgression.length - 1];
    if (lastChord.startsWith("vii*")) {
      const iiiChords = remainingChords.filter(chord => chord.startsWith("iii"));
      for (const iiiChord of iiiChords) {
        if (this.isValidProgression(currentProgression, iiiChord, tonality)) {
          const newProgression = [...currentProgression, iiiChord];
          const newRemaining = remainingChords.filter(chord => chord !== iiiChord);
          const newInversions = currentInversions + (iiiChord.includes('/') ? 1 : 0);
          if (newInversions <= maxInversions) {
            yield* this.generateProgressionsRecursive(newProgression, newRemaining, targetLength, tonality, maxInversions, newInversions);
          }
        }
      }
      return;
    }

    for (const nextChord of remainingChords) {
      if (currentProgression.length === 0 && nextChord !== "I") continue;
      if (currentProgression.length === 1 && nextChord.startsWith("I")) continue;
      if (this.isValidProgression(currentProgression, nextChord, tonality)) {
        const newProgression = [...currentProgression, nextChord];
        const newRemaining = remainingChords.filter(chord => chord !== nextChord);
        const newInversions = currentInversions + (nextChord.includes('/') ? 1 : 0);
        if (newInversions <= maxInversions) {
          yield* this.generateProgressionsRecursive(newProgression, newRemaining, targetLength, tonality, maxInversions, newInversions);
        }
      }
    }
  }

  *generateProgressions(tonality: string, progressionLength: number): Generator<{ roman: string[], transposed: string[], notes: string[][] }, void, undefined> {
    this.progressionLength = progressionLength;
    const allChords: string[] = [];
    const degrees = ["I", "ii", "iii", "IV", "V", "vi", "vii*"];
    degrees.forEach(degree => {
      allChords.push(degree);
      allChords.push(`${degree}/1`);
      allChords.push(`${degree}/2`);
    });

    const maxInversions = 1;
    const progressions = this.generateProgressionsRecursive(["I"], allChords, progressionLength, tonality, maxInversions, 0);

    for (const progression of progressions) {
      const roman = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        let romanWithInversion = data.roman;
        if (inversion === "1") romanWithInversion += "6";
        if (inversion === "2") romanWithInversion += "6/4";
        return romanWithInversion;
      });
      const transposed = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        const baseChord = data.chord;
        if (inversion === "1") {
          const chordNotes = Chord.get(baseChord).notes.slice(0, 3);
          const thirdNote = chordNotes[1];
          return `${baseChord}/${thirdNote}`;
        } else if (inversion === "2") {
          const chordNotes = Chord.get(baseChord).notes.slice(0, 3);
          const fifthNote = chordNotes[2];
          return `${baseChord}/${fifthNote}`;
        }
        return baseChord;
      });
      const notes = progression.map(chord => {
        const [degree, inversion] = chord.split('/');
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        let chordNotes = data.notes;
        if (inversion === "1") {
          // Primeira inversão: reordenar notas (ex.: C-E-G-C → E-G-C-E)
          chordNotes = [chordNotes[1], chordNotes[2], chordNotes[0], chordNotes[1]];
        } else if (inversion === "2") {
          // Segunda inversão: reordenar notas (ex.: C-E-G-C → G-C-E-G)
          chordNotes = [chordNotes[2], chordNotes[0], chordNotes[1], chordNotes[2]];
        }
        return chordNotes;
      });
      console.log(`Roman: ${roman.join(' -> ')}, Transposed: ${transposed.join(' -> ')}, Notes: ${notes.map(n => n.join('-')).join(' -> ')}`);
      yield {
        roman,
        transposed,
        notes
      };
    }
  }
}