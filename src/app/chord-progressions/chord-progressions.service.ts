import { Injectable, Inject, Optional } from '@angular/core';
import { ProgressionAlgorithm, PROGRESSION_ALGORITHMS, VoiceLeadingRules } from '../types';
import { VoiceLeadingAlgorithm } from './voice-leading/voice-leading-algorithm';

@Injectable({
  providedIn: 'root'
})
export class ChordProgressionsService {
  private algorithms: ProgressionAlgorithm[];

  constructor(
    @Optional() @Inject(PROGRESSION_ALGORITHMS) injectedAlgorithms: ProgressionAlgorithm[] | null,
    private voiceLeadingAlgorithm: VoiceLeadingAlgorithm
  ) {
    this.algorithms = injectedAlgorithms || [];
  }

  applyVoiceLeading(progression: {
    roman: string[];
    transposed: string[];
    notes: string[][];
    functions: string[][];
  }, rules?: VoiceLeadingRules): { soprano: string; contralto: string; tenor: string; baixo: string }[] {
    return this.voiceLeadingAlgorithm.applyVoiceLeading(progression, undefined, false, rules);
  }

  getAvailableAlgorithms(): ProgressionAlgorithm[] {
    return this.algorithms;
  }

  getProgressionsGenerator(
    tonality: string,
    progressionLength: number,
    algorithm: ProgressionAlgorithm,
    rules?: VoiceLeadingRules
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
      return this.generateFromArray(progressions, rules);
    } else {
      return this.generateFromIterator(progressions, rules);
    }
  }

  private *generateFromArray(
    progressions: { roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] }[],
    rules?: VoiceLeadingRules
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
      const voices = this.applyVoiceLeading(progression, rules);
      yield {
        roman: progression.roman,
        transposed: progression.transposed,
        notes: progression.notes,
        voices
      };
    }
  }

  private *generateFromIterator(
    progressions: Iterator<{ roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] }>,
    rules?: VoiceLeadingRules
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
      const voices = this.applyVoiceLeading(progression, rules);
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