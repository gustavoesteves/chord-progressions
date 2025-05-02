import { Injectable } from '@angular/core';
import { Scale, Key, RomanNumeral, Chord } from '@tonaljs/tonal';

@Injectable({
  providedIn: 'root'
})
export class TonalityService {
  private tonalities: string[] = [
    'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
  ];

  getAvailableTonalities(): string[] {
    return this.tonalities;
  }

  getNotesForTonality(tonality: string, mode: string): string[] {
    const modeName = mode === 'maior' ? 'major' : 'harmonic minor';
    const scaleName = `${tonality} ${modeName}`;
    const scale = Scale.get(scaleName);
    console.log(`Notes for ${scaleName}:`, scale.notes);
    return scale.notes;
  }

  private getDegreeIndex(degree: string): number {
    const degreeLower = degree.toLowerCase().replace('*', '').replace('°', '');
    const roman = RomanNumeral.get(degreeLower);
    if (!roman || !roman.name) {
      console.log(`Invalid degree: ${degreeLower}`);
      return -1;
    }

    const romanNumeral = roman.name.toLowerCase().replace('°', '');
    const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii'];
    const degreeIndex = romanNumerals.indexOf(romanNumeral);
    if (degreeIndex === -1) {
      console.log(`Invalid degree index for ${degreeLower}: ${degreeIndex}`);
      return -1;
    }
    return degreeIndex;
  }

  getChordForDegree(degree: string, tonality: string, mode: string): { chord: string, roman: string, notes: string[] } {
    const degreeIndex = this.getDegreeIndex(degree);
    if (degreeIndex === -1) {
      return { chord: degree, roman: degree, notes: [] };
    }

    let chords: readonly string[];
    let romanBase: string;
    if (mode === 'maior') {
      const key = Key.majorKey(tonality);
      chords = key.chords.map(chord => {
        if (chord.endsWith('maj7')) return chord.replace('maj7', '');
        if (chord.endsWith('m7')) return chord.replace('m7', 'm');
        if (chord.endsWith('dim7')) return chord.replace('dim7', 'dim');
        if (chord.endsWith('7')) return chord.replace('7', '');
        return chord;
      });
      romanBase = degreeIndex === 0 ? 'I' :
                  degreeIndex === 3 ? 'IV' :
                  degreeIndex === 4 ? 'V' :
                  degreeIndex === 6 ? 'vii°' :
                  `ii${degreeIndex + 1}`; // ii, iii, vi
    } else {
      const scaleNotes = Scale.get(`${tonality} harmonic minor`).notes;
      const chordTypes = ['m', 'dim', '', 'm', '', '', 'dim'];
      chords = scaleNotes.map((note: string, index: number) => {
        const type = chordTypes[index];
        return `${note}${type}`;
      });
      romanBase = degreeIndex === 0 ? 'i' :
                  degreeIndex === 1 ? 'ii°' :
                  degreeIndex === 2 ? 'III' :
                  degreeIndex === 3 ? 'iv' :
                  degreeIndex === 4 ? 'V' :
                  degreeIndex === 5 ? 'VI' :
                  'vii°';
    }

    const chord = chords[degreeIndex];
    const roman = romanBase;
    const baseNotes = Chord.get(chord).notes.slice(0, 3); // Pegar apenas as 3 primeiras notas (tríade)
    const notes = [
      `${baseNotes[0]}/3`, // Fundamental na oitava 3
      `${baseNotes[1]}/4`, // Terça na oitava 4
      `${baseNotes[2]}/4`, // Quinta na oitava 4
      `${baseNotes[0]}/4`  // Fundamental duplicada na oitava 4
    ];

    console.log(`Chord for degree ${degree} in ${tonality} ${mode}: ${chord}, Roman: ${roman}, Notes: ${notes}`);
    return { chord, roman, notes };
  }
}