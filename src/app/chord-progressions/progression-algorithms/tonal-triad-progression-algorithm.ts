import { ProgressionAlgorithm } from '../progression-algorithm.interface';
import { TonalityService } from '../../tonality/tonality.service';
import { Injectable } from '@angular/core';
import { Chord } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class TonalTriadProgressionAlgorithm implements ProgressionAlgorithm {
  name = 'Encadeamento das triades tonais';

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
    const [lastDegree] = lastChord.split('/');
    const [nextDegree] = nextChord.split('/');

    const isLastChord = progression.length === this.targetLength - 1 && nextChord === "I";
    if (!isLastChord) {
      const chordWithoutInversion = progression.map(chord => chord.split('/')[0]);
      if (nextDegree !== "I" && chordWithoutInversion.slice(1).includes(nextDegree)) {
        const existingChord = progression.find(chord => {
          const [degree, inversion] = chord.split('/');
          return degree === nextDegree && inversion === undefined;
        });
        if (existingChord) {
          console.log(`Repetição detectada: ${nextChord} já existe em ${progression}`);
          return false;
        }
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

    return true;
  }

  private targetLength: number = 0;

  private generateProgressionsRecursive(
    currentProgression: string[],
    remainingChords: string[],
    targetLength: number,
    tonality: string
  ): string[][] {
    if (currentProgression.length === targetLength - 2) {
      const allProgressions: string[][] = [];
      if (remainingChords.includes("V") && this.isValidProgression(currentProgression, "V", tonality)) {
        const newProgression = [...currentProgression, "V"];
        if (this.isValidProgression(newProgression, "I", tonality)) {
          allProgressions.push([...newProgression, "I"]);
        }
      }
      return allProgressions;
    }

    const allProgressions: string[][] = [];
    const lastChord = currentProgression[currentProgression.length - 1];
    if (lastChord === "vii*") {
      if (remainingChords.includes("iii")) {
        const newProgression = [...currentProgression, "iii"];
        const newRemaining = remainingChords.filter(chord => chord !== "iii");
        allProgressions.push(...this.generateProgressionsRecursive(newProgression, newRemaining, targetLength, tonality));
      }
      return allProgressions;
    }

    for (const nextChord of remainingChords) {
      if (currentProgression.length === 0 && nextChord !== "I") continue;
      if (this.isValidProgression(currentProgression, nextChord, tonality)) {
        const newProgression = [...currentProgression, nextChord];
        const newRemaining = remainingChords.filter(chord => chord !== nextChord);
        allProgressions.push(...this.generateProgressionsRecursive(newProgression, newRemaining, targetLength, tonality));
      }
    }
    return allProgressions;
  }

  generateProgressions(tonality: string, progressionLength: number): { roman: string[], transposed: string[], notes: string[][] }[] {
    this.targetLength = progressionLength;
    const allChords = ["ii", "iii", "IV", "V", "vi", "vii*"];
    const allProgressions = this.generateProgressionsRecursive(["I"], allChords, progressionLength, tonality);

    return allProgressions.map(progression => {
      const roman = progression.map(degree => {
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        return data.roman;
      });
      const transposed = progression.map(degree => {
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        return data.chord;
      });
      const notes = progression.map(degree => {
        const data = this.tonalityService.getChordForDegree(degree, tonality, 'maior');
        return data.notes;
      });
      console.log(`Roman: ${roman.join(' -> ')}, Transposed: ${transposed.join(' -> ')}, Notes: ${notes.map(n => n.join('-')).join(' -> ')}`);
      return {
        roman,
        transposed,
        notes
      };
    });
  }
}