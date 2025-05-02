import { Injectable } from '@angular/core';
import { VoiceLeadingAlgorithm } from './voice-leading-algorithm';
import { VoiceLeadingAlgorithmInterface } from './voice-leading-algorithm.interface';

@Injectable({
  providedIn: 'root'
})
export class VoiceLeadingService {
  constructor(private voiceLeadingAlgorithm: VoiceLeadingAlgorithm) {}

  applyVoiceLeading(progression: { roman: string[], transposed: string[], notes: string[][] }): { soprano: string, contralto: string, tenor: string, baixo: string }[] {
    return this.voiceLeadingAlgorithm.applyVoiceLeading(progression);
  }
}