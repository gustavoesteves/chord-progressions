import { Injectable } from '@angular/core';
import { VoiceLeadingAlgorithm } from './voice-leading-algorithm';

@Injectable({
  providedIn: 'root'
})
export class VoiceLeadingService {
  constructor(private voiceLeadingAlgorithm: VoiceLeadingAlgorithm) {}

  applyVoiceLeading(progression: {
    roman: string[];
    transposed: string[];
    notes: string[][];
    functions: string[][];
  }): { soprano: string; contralto: string; tenor: string; baixo: string }[] {
    return this.voiceLeadingAlgorithm.applyVoiceLeading(progression);
  }
}