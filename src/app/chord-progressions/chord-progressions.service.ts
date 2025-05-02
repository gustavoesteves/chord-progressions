import { Injectable } from '@angular/core';
import { ProgressionAlgorithm } from './progression-algorithm.interface';
import { TonalTriadProgressionAlgorithm } from './harmony-exercises/tonal-triad-progression-algorithm';
import { InvertedTriadProgressionAlgorithm } from './harmony-exercises/inverted-triad-progression-algorithm';

@Injectable({
  providedIn: 'root'
})
export class ChordProgressionsService {
  private algorithms: ProgressionAlgorithm[] = [];

  constructor(
    tonalTriadAlgorithm: TonalTriadProgressionAlgorithm,
    invertedTriadAlgorithm: InvertedTriadProgressionAlgorithm
  ) {
    this.algorithms = [tonalTriadAlgorithm, invertedTriadAlgorithm];
  }

  getAvailableAlgorithms(): string[] {
    return this.algorithms.map(algorithm => algorithm.name);
  }

  getProgressionsGenerator(tonality: string, algorithmName: string, progressionLength: number): Generator<{ roman: string[], transposed: string[], notes: string[][] }, void, undefined> {
    const algorithm = this.algorithms.find(alg => alg.name === algorithmName);
    if (!algorithm) {
      console.error(`Algorithm ${algorithmName} not found.`);
      return (function*() {})();
    }

    const progressions = algorithm.generateProgressions(tonality, progressionLength);
    if (Array.isArray(progressions)) {
      return (function*() {
        for (const progression of progressions) {
          yield progression;
        }
      })();
    } else {
      return progressions;
    }
  }
}