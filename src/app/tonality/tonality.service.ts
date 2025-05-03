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

  getChordForDegree(degree: string, tonality: string, mode: string): { chord: string, roman: string, notes: string[], functions: string[] } {
    const degreeIndex = this.getDegreeIndex(degree);
    if (degreeIndex === -1) {
      return { chord: degree, roman: degree, notes: [], functions: [] };
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
        degreeIndex === 1 ? 'ii' :
          degreeIndex === 2 ? 'iii' :
            degreeIndex === 3 ? 'IV' :
              degreeIndex === 4 ? 'V' :
                degreeIndex === 5 ? 'vi' :
                  degreeIndex === 6 ? 'vii°' :
                    degree;
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
                  degreeIndex === 6 ? 'vii°' :
                    degree;
    }

    const chord = chords[degreeIndex];
    const roman = romanBase;
    const baseNotes = Chord.get(chord).notes.slice(0, 3); // Pegar apenas as 3 primeiras notas (tríade)
    const notes = [
      baseNotes[0], // Fundamental
      baseNotes[1], // Terça
      baseNotes[2], // Quinta
      baseNotes[0]  // Fundamental duplicada
    ];
    const functions = [
      'fundamental',
      'third',
      'fifth',
      'fundamental'
    ];

    console.log(`Chord for degree ${degree} in ${tonality} ${mode}: ${chord}, Roman: ${roman}, Notes: ${notes}, Functions: ${functions}`);
    return { chord, roman, notes, functions };
  }
}