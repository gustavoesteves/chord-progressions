import { Injectable } from '@angular/core';
import { ProgressionAlgorithm } from '../types';
import { TonalTriadProgressionAlgorithm } from './progression-algorithms/tonal-triad-progression-algorithm';
import { InvertedTriadProgressionAlgorithm } from './progression-algorithms/inverted-triad-progression-algorithm';
import { VoiceLeadingService } from './voice-leading/voice-leading.service';

@Injectable({
  providedIn: 'root'
})
export class ChordProgressionsService {
  private algorithms: ProgressionAlgorithm[];

  constructor(
    tonalTriadAlgorithm: TonalTriadProgressionAlgorithm,
    invertedTriadAlgorithm: InvertedTriadProgressionAlgorithm,
    private voiceLeadingService: VoiceLeadingService
  ) {
    this.algorithms = [tonalTriadAlgorithm, invertedTriadAlgorithm];
  }

  getAvailableAlgorithms(): ProgressionAlgorithm[] {
    return this.algorithms;
  }

  getProgressionsGenerator(
    tonality: string,
    progressionLength: number,
    algorithm: ProgressionAlgorithm
  ): Generator<
    {
      roman: string[];
      transposed: string[];
      notes: string[][];
      voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
    },
    void,
    undefined
  > {
    const progressions = algorithm.generateProgressions(tonality, progressionLength);
    if (Array.isArray(progressions)) {
      return this.generateFromArray(progressions);
    } else {
      return this.generateFromIterator(progressions);
    }
  }

  private *generateFromArray(
    progressions: { roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] }[]
  ): Generator<
    {
      roman: string[];
      transposed: string[];
      notes: string[][];
      voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
    },
    void,
    undefined
  > {
    for (const progression of progressions) {
      const voices = this.voiceLeadingService.applyVoiceLeading(progression);
      yield {
        roman: progression.roman,
        transposed: progression.transposed,
        notes: progression.notes,
        voices
      };
    }
  }

  private *generateFromIterator(
    progressions: Iterator<{ roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] }>
  ): Generator<
    {
      roman: string[];
      transposed: string[];
      notes: string[][];
      voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
    },
    void,
    undefined
  > {
    let next = progressions.next();
    while (!next.done) {
      const progression = next.value;
      const voices = this.voiceLeadingService.applyVoiceLeading(progression);
      yield {
        roman: progression.roman,
        transposed: progression.transposed,
        notes: progression.notes,
        voices
      };
      next = progressions.next();
    }
  }
}