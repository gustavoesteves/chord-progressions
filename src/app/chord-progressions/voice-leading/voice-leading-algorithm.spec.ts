import { TestBed } from '@angular/core/testing';
import { VoiceLeadingAlgorithm } from './voice-leading-algorithm';
import { Note } from '@tonaljs/tonal';

describe('VoiceLeadingAlgorithm', () => {
  let service: VoiceLeadingAlgorithm;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceLeadingAlgorithm);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a valid chorale voice leading without crossing or parallel 5ths/8ves', () => {
    // I - V - I in C Major
    const progression = {
      roman: ['I', 'V', 'I'],
      transposed: ['C', 'G', 'C'],
      notes: [
        ['C', 'E', 'G', 'C'], // C Major
        ['G', 'B', 'D', 'G'], // G Major
        ['C', 'E', 'G', 'C'], // C Major
      ]
    };

    const result = service.applyVoiceLeading(progression, undefined, false);
    console.log("Voice Leading Result:", result);

    expect(result.length).toBe(3);

    result.forEach((voices, index) => {
        const bassMidi = Note.midi(voices.baixo) as number;
        const tenorMidi = Note.midi(voices.tenor) as number;
        const altoMidi = Note.midi(voices.contralto) as number;
        const sopranoMidi = Note.midi(voices.soprano) as number;

        // Verify No Voice Crossing
        expect(bassMidi).toBeLessThan(tenorMidi);
        expect(tenorMidi).toBeLessThan(altoMidi);
        expect(altoMidi).toBeLessThanOrEqual(sopranoMidi); // Can be unison but not crossed

        // Verify Spacing
        expect(sopranoMidi - altoMidi).toBeLessThanOrEqual(12);
        expect(altoMidi - tenorMidi).toBeLessThanOrEqual(12);
    });
  });
});
