import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProgressionListComponent } from './chord-progressions/progression-list/progression-list.component';
import { ScoreDisplayComponent } from './score-display/score-display.component';
import { MusicXmlExportComponent } from './score-display/music-xml-export.component';
import { TonalitySelectorComponent } from './tonality/tonality-selector/tonality-selector.component';
import { ChordProgressionsService } from './chord-progressions/chord-progressions.service';
import { VoiceLeadingAlgorithm } from './chord-progressions/voice-leading/voice-leading-algorithm';
import { AudioPlaybackService } from './audio-playback.service';
import { ProgressionAlgorithm, Formation, VoiceLeadingRules } from './types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    ProgressionListComponent,
    ScoreDisplayComponent,
    MusicXmlExportComponent,
    TonalitySelectorComponent
  ],
  standalone: true
})
export class AppComponent {
  selectedTonality: string = 'C';
  selectedAlgorithm: ProgressionAlgorithm | null = null;
  
  // Grouped Algorithms
  groupedAlgorithms: {
    domain: string;
    modes: {
      mode: string;
      algorithms: ProgressionAlgorithm[];
    }[];
  }[] = [];
  
  // Sidebar state
  isSidenavOpen: boolean = true;
  isSettingsOpen: boolean = false;
  selectedFormation: string = 'Quarteto Vocal';
  progressionLength: number = 4;
  generateClicked: boolean = false;
  progressions: {
    roman: string[];
    transposed: string[];
    notes: string[][];
    functions?: string[][];
    voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
  }[] = [];
  currentProgression: {
    roman: string[];
    transposed: string[];
    notes: string[][];
    functions?: string[][];
    voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
  } | null = null;
  currentProgressionIndex: number = 0;
  progressionGenerator: Generator<
    {
      roman: string[];
      transposed: string[];
      notes: string[][];
      functions?: string[][];
      voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
    },
    void,
    undefined
  > | null = null;
  formations: Formation[] = [
    {
      name: 'Piano',
      tessituras: {
        soprano: { min: 67, max: 84, clef: 'G', staff: 1 }, // G4 a C6
        contralto: { min: 60, max: 79, clef: 'G', staff: 1 }, // C4 a G5
        tenor: { min: 55, max: 72, clef: 'F', staff: 2 }, // G3 a C5
        baixo: { min: 36, max: 67, clef: 'F', staff: 2 } // C2 a G4
      }
    },
    {
      name: 'Violão',
      tessituras: {
        soprano: { min: 64, max: 88, clef: 'G', staff: 1 }, // E4 a E6 (escrito, soa E3 a E5)
        contralto: { min: 60, max: 84, clef: 'G', staff: 1 }, // C4 a C6 (escrito, soa C3 a C5)
        tenor: { min: 55, max: 79, clef: 'G', staff: 1 }, // G3 a G5 (escrito, soa G2 a G4)
        baixo: { min: 52, max: 76, clef: 'G', staff: 1 } // E3 a E5 (escrito, soa E2 a E4)
      }
    },
    {
      name: 'Quarteto de Cordas',
      tessituras: {
        soprano: { min: 55, max: 88, clef: 'G', staff: 1 }, // G3 a E6
        contralto: { min: 55, max: 83, clef: 'G', staff: 2 }, // G3 a B5
        tenor: { min: 48, max: 76, clef: 'C', staff: 3 }, // C3 a E5
        baixo: { min: 36, max: 67, clef: 'F', staff: 4 } // C2 a G4
      }
    },
    {
      name: 'Quarteto Vocal',
      tessituras: {
        soprano: { min: 60, max: 79, clef: 'G', staff: 1 }, // C4 a G5
        contralto: { min: 55, max: 74, clef: 'G', staff: 2 }, // G3 a D5
        tenor: { min: 48, max: 67, clef: 'G', staff: 3 }, // C3 a G4
        baixo: { min: 40, max: 60, clef: 'F', staff: 4 } // E2 a C4
      }
    }
  ];
  algorithmIndex: number = 0;

  // Audio Playback State
  bpm: number = 80;
  isLooping: boolean = false;
  isPlaying: boolean = false;
  currentPlayingIndex: number | null = null;

  // Voice Leading Rules State (Schoenberg Lab)
  voiceLeadingRules: VoiceLeadingRules = {
    penalizeParallelFifths: true,
    penalizeParallelOctaves: true,
    penalizeVoiceCrossing: true,
    maxLeapInterval: 12,
    resolveSevenths: false,
    resolveLeadingTone: false
  };

  constructor(
    private chordProgressionsService: ChordProgressionsService,
    private voiceLeadingService: VoiceLeadingAlgorithm,
    private audioPlaybackService: AudioPlaybackService
  ) {
    this.groupAlgorithms();
    
    // Auto-select the first available algorithm if none is selected
    if (this.groupedAlgorithms.length > 0 && this.groupedAlgorithms[0].modes.length > 0 && this.groupedAlgorithms[0].modes[0].algorithms.length > 0) {
      this.selectedAlgorithm = this.groupedAlgorithms[0].modes[0].algorithms[0];
      this.updateAlgorithmIndex();
    }
    
    // Supscribe to Audio Playback State
    this.audioPlaybackService.bpm$.subscribe(val => this.bpm = val);
    this.audioPlaybackService.isLooping$.subscribe(val => this.isLooping = val);
    this.audioPlaybackService.isPlaying$.subscribe(val => this.isPlaying = val);
    this.audioPlaybackService.currentIndex$.subscribe(val => this.currentPlayingIndex = val);
  }

  get currentFormation(): Formation | null {
    return this.formations.find(f => f.name === this.selectedFormation) || null;
  }

  onKeyChange(tonality: string): void {
    this.selectedTonality = tonality;
    this.generateClicked = false;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    this.progressionGenerator = null;
    this.audioPlaybackService.stop();
  }

  onAlgorithmChange(algorithm: ProgressionAlgorithm): void {
    this.selectedAlgorithm = algorithm;
    this.updateAlgorithmIndex();
    this.generateClicked = false;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    this.progressionGenerator = null;
    this.audioPlaybackService.stop();
  }

  onFormationChange(): void {
    if (this.currentProgression) {
      const inputProgression = {
        roman: this.currentProgression.roman,
        transposed: this.currentProgression.transposed,
        notes: this.currentProgression.notes,
        functions: this.currentProgression.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras, false, this.voiceLeadingRules);
      this.progressions[this.currentProgressionIndex] = {
        ...this.currentProgression,
        voices
      };
      this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
    }
  }

  onGenerate(): void {
    this.generateClicked = true;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    if (!this.selectedAlgorithm) return;

    this.progressionGenerator = this.chordProgressionsService.getProgressionsGenerator(
      this.selectedTonality,
      this.progressionLength,
      this.selectedAlgorithm,
      this.voiceLeadingRules
    );
    this.loadNextProgression();
  }

  loadNextProgression(): void {
    this.audioPlaybackService.stop();
    if (!this.progressionGenerator) return;
    const next = this.progressionGenerator.next();
    if (!next.done && next.value) {
      const inputProgression = {
        roman: next.value.roman,
        transposed: next.value.transposed,
        notes: next.value.notes,
        functions: next.value.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras, false, this.voiceLeadingRules);
      console.log('New progression voices:', JSON.stringify(voices));
      const progression = {
        ...inputProgression,
        voices
      };
      this.progressions.push(progression);
      this.currentProgressionIndex = this.progressions.length - 1;
      this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
    }
  }

  loadPreviousProgression(): void {
    this.audioPlaybackService.stop();
    if (this.currentProgressionIndex <= 0) return;
    this.currentProgressionIndex--;
    this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
  }

  regenerateVoiceLeading(): void {
    this.audioPlaybackService.stop();
    if (this.currentProgression) {
      console.log('Previous voices:', JSON.stringify(this.currentProgression.voices));
      const inputProgression = {
        roman: this.currentProgression.roman,
        transposed: this.currentProgression.transposed,
        notes: this.currentProgression.notes,
        functions: this.currentProgression.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras, true, this.voiceLeadingRules);
      console.log('Regenerated voices:', JSON.stringify(voices));
      this.progressions[this.currentProgressionIndex] = {
        ...this.currentProgression,
        voices
      };
      this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
    }
  }

  playCurrentProgression(): void {
    if (this.currentProgression && this.currentProgression.voices) {
      this.audioPlaybackService.playProgression(this.currentProgression.voices);
    }
  }

  stopCurrentProgression(): void {
    this.audioPlaybackService.stop();
  }

  onBpmChange(): void {
    this.audioPlaybackService.setBpm(this.bpm);
  }

  onLoopToggle(): void {
    this.audioPlaybackService.setLoop(this.isLooping);
  }

  private groupAlgorithms(): void {
    const algos = this.chordProgressionsService.getAvailableAlgorithms();
    const domainMap = new Map<string, Map<string, ProgressionAlgorithm[]>>();
    
    algos.forEach(alg => {
      if (!domainMap.has(alg.domain)) {
        domainMap.set(alg.domain, new Map());
      }
      const modeMap = domainMap.get(alg.domain)!;
      if (!modeMap.has(alg.mode)) {
        modeMap.set(alg.mode, []);
      }
      modeMap.get(alg.mode)!.push(alg);
    });

    this.groupedAlgorithms = Array.from(domainMap.entries()).map(([domain, modeMap]) => ({
      domain,
      modes: Array.from(modeMap.entries()).map(([mode, algorithms]) => ({
        mode,
        algorithms
      }))
    }));
  }

  private updateAlgorithmIndex(): void {
    const algorithms = this.chordProgressionsService.getAvailableAlgorithms();
    this.algorithmIndex = algorithms.findIndex(alg => alg === this.selectedAlgorithm);
    if (this.algorithmIndex === -1 && algorithms.length > 0) {
      this.selectedAlgorithm = algorithms[0];
      this.algorithmIndex = 0;
    }
    
    // Auto-apply algorithm default rules if any exist
    if (this.selectedAlgorithm && this.selectedAlgorithm.defaultRules) {
       this.voiceLeadingRules = { ...this.voiceLeadingRules, ...this.selectedAlgorithm.defaultRules };
    }
  }

  getActiveRulesDescriptions(): { text: string; active: boolean }[] {
    return [
      {
        text: 'Proibir 5as e 8as Paralelas',
        active: this.voiceLeadingRules.penalizeParallelFifths && this.voiceLeadingRules.penalizeParallelOctaves
      },
      {
        text: 'Proibir Cruzamento de Vozes',
        active: this.voiceLeadingRules.penalizeVoiceCrossing
      },
      {
        text: 'Resolver Sétimas Descendo',
        active: this.voiceLeadingRules.resolveSevenths
      },
      {
        text: 'Resolver Sensível Subindo',
        active: this.voiceLeadingRules.resolveLeadingTone
      },
      {
        text: `Salto Máximo: ${this.voiceLeadingRules.maxLeapInterval} semitons`,
        active: true // Always an active rule
      }
    ];
  }
}