import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { PROGRESSION_ALGORITHMS } from './types';
import { TonalTriadProgressionAlgorithm } from './chord-progressions/progression-algorithms/tonal-triad-progression-algorithm';
import { InvertedTriadProgressionAlgorithm } from './chord-progressions/progression-algorithms/inverted-triad-progression-algorithm';
import { DiatonicSeventhsAlgorithm } from './chord-progressions/progression-algorithms/diatonic-sevenths-algorithm';
import { SecondaryDominantsAlgorithm } from './chord-progressions/progression-algorithms/secondary-dominants-algorithm';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    {
      provide: PROGRESSION_ALGORITHMS,
      useClass: TonalTriadProgressionAlgorithm,
      multi: true
    },
    {
      provide: PROGRESSION_ALGORITHMS,
      useClass: InvertedTriadProgressionAlgorithm,
      multi: true
    },
    {
      provide: PROGRESSION_ALGORITHMS,
      useClass: DiatonicSeventhsAlgorithm,
      multi: true
    },
    {
      provide: PROGRESSION_ALGORITHMS,
      useClass: SecondaryDominantsAlgorithm,
      multi: true
    }
  ]
};
