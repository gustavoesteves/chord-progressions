import { Injectable, NgZone } from '@angular/core';
import * as Tone from 'tone';
import { BehaviorSubject, Observable } from 'rxjs';
import { Voices } from './types';

@Injectable({
  providedIn: 'root'
})
export class AudioPlaybackService {
  private synth: Tone.PolySynth;
  
  // State Observables for UI sync
  private _isPlaying = new BehaviorSubject<boolean>(false);
  public isPlaying$: Observable<boolean> = this._isPlaying.asObservable();

  private _currentIndex = new BehaviorSubject<number | null>(null);
  public currentIndex$: Observable<number | null> = this._currentIndex.asObservable();

  private _bpm = new BehaviorSubject<number>(80);
  public bpm$: Observable<number> = this._bpm.asObservable();

  private _isLooping = new BehaviorSubject<boolean>(false);
  public isLooping$: Observable<boolean> = this._isLooping.asObservable();

  private currentPart: Tone.Part | null = null;

  constructor(private ngZone: NgZone) {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 0.2, sustain: 0.8, release: 1 }
    }).toDestination();
    this.synth.volume.value = -8;
  }

  setBpm(bpm: number): void {
    this._bpm.next(bpm);
    Tone.Transport.bpm.value = bpm;
  }

  setLoop(loop: boolean): void {
    this._isLooping.next(loop);
    if (this.currentPart) {
      this.currentPart.loop = loop;
    }
  }

  async playProgression(progression: Voices[]): Promise<void> {
    if (this._isPlaying.value) {
      this.stop();
    }

    await Tone.start();
    Tone.Transport.bpm.value = this._bpm.value;
    
    // Stop and clear transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
    if (this.currentPart) {
      this.currentPart.dispose();
    }

    const durationInSeconds = (60 / this._bpm.value) * 2; // 2 beats per chord (mínima)
    
    // Create events for Tone.Part
    // Structure: { time: seconds, chord: boolean[] }
    const events = progression.map((chordVoices, index) => {
      const notes = [
        chordVoices.baixo,
        chordVoices.tenor,
        chordVoices.contralto,
        chordVoices.soprano
      ].filter(n => n);

      return {
        time: index * durationInSeconds,
        notes: notes,
        index: index
      };
    });

    // Create the part
    this.currentPart = new Tone.Part((time, value) => {
      // Trigger the sound
      this.synth.triggerAttackRelease(value.notes, "2n", time);
      
      // Update the UI index exactly when the note sounds
      Tone.Draw.schedule(() => {
        this.ngZone.run(() => {
          this._currentIndex.next(value.index);
          this._isPlaying.next(true);
        });
      }, time);
    }, events);

    // Setup looping
    this.currentPart.loop = this._isLooping.value;
    this.currentPart.loopEnd = events.length * durationInSeconds;
    this.currentPart.start(0);

    // Handle end of playback if not looping
    Tone.Transport.scheduleOnce((time) => {
      if (!this._isLooping.value) {
        Tone.Draw.schedule(() => {
          this.ngZone.run(() => {
            this.stop();
          });
        }, time);
      }
    }, events.length * durationInSeconds);

    this._isPlaying.next(true);
    Tone.Transport.start();
  }

  stop(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.synth.releaseAll();
    this._isPlaying.next(false);
    this._currentIndex.next(null);
  }
}
