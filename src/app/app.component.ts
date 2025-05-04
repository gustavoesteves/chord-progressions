import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ProgressionListComponent } from './chord-progressions/progression-list/progression-list.component';
import { AlgorithmSelectorComponent } from './chord-progressions/algorithm-selector/algorithm-selector.component';
import { ScoreDisplayComponent } from './score-display/score-display.component';
import { MusicXmlExportComponent } from './score-display/music-xml-export.component';
import { TonalitySelectorComponent } from './tonality/tonality-selector/tonality-selector.component';
import { ChordProgressionsService } from './chord-progressions/chord-progressions.service';
import { VoiceLeadingAlgorithm } from './chord-progressions/voice-leading/voice-leading-algorithm';
import { ProgressionAlgorithm, Formation } from './types';

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
    ProgressionListComponent,
    AlgorithmSelectorComponent,
    ScoreDisplayComponent,
    MusicXmlExportComponent,
    TonalitySelectorComponent
  ],
  standalone: true
})
export class AppComponent {
  selectedTonality: string = 'C';
  selectedAlgorithm: ProgressionAlgorithm | null = null;
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
        soprano: { min: 67, max: 84, clef: 'G', staff: 1 },
        contralto: { min: 60, max: 79, clef: 'G', staff: 1 },
        tenor: { min: 55, max: 72, clef: 'F', staff: 2 },
        baixo: { min: 36, max: 67, clef: 'F', staff: 2 }
      }
    },
    {
      name: 'Violão',
      tessituras: {
        soprano: { min: 55, max: 76, clef: 'G', staff: 1 },
        contralto: { min: 52, max: 72, clef: 'G', staff: 1 },
        tenor: { min: 48, max: 67, clef: 'G', staff: 1 },
        baixo: { min: 40, max: 64, clef: 'G', staff: 1 }
      }
    },
    {
      name: 'Quarteto de Cordas',
      tessituras: {
        soprano: { min: 55, max: 88, clef: 'G', staff: 1 },
        contralto: { min: 55, max: 83, clef: 'G', staff: 2 },
        tenor: { min: 48, max: 76, clef: 'C', staff: 3 },
        baixo: { min: 36, max: 67, clef: 'F', staff: 4 }
      }
    },
    {
      name: 'Quarteto Vocal',
      tessituras: {
        soprano: { min: 60, max: 79, clef: 'G', staff: 1 },
        contralto: { min: 55, max: 74, clef: 'G', staff: 2 },
        tenor: { min: 48, max: 67, clef: 'G', staff: 3 },
        baixo: { min: 40, max: 60, clef: 'F', staff: 4 }
      }
    }
  ];
  algorithmIndex: number = 0;

  constructor(
    private chordProgressionsService: ChordProgressionsService,
    private voiceLeadingService: VoiceLeadingAlgorithm
  ) {
    this.updateAlgorithmIndex();
  }

  // Propriedade computada para obter a formação atual
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
  }

  onAlgorithmChange(algorithm: ProgressionAlgorithm): void {
    this.selectedAlgorithm = algorithm;
    this.updateAlgorithmIndex();
    this.generateClicked = false;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    this.progressionGenerator = null;
  }

  onFormationChange(): void {
    if (this.currentProgression) {
      const inputProgression = {
        roman: this.currentProgression.roman,
        transposed: this.currentProgression.transposed,
        notes: this.currentProgression.notes,
        functions: this.currentProgression.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras);
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
      this.selectedAlgorithm
    );
    this.loadNextProgression();
  }

  loadNextProgression(): void {
    if (!this.progressionGenerator) return;
    const next = this.progressionGenerator.next();
    if (!next.done && next.value) {
      const inputProgression = {
        roman: next.value.roman,
        transposed: next.value.transposed,
        notes: next.value.notes,
        functions: next.value.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras);
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
    if (this.currentProgressionIndex <= 0) return;
    this.currentProgressionIndex--;
    this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
  }

  regenerateVoiceLeading(): void {
    if (this.currentProgression) {
      console.log('Previous voices:', JSON.stringify(this.currentProgression.voices));
      const inputProgression = {
        roman: this.currentProgression.roman,
        transposed: this.currentProgression.transposed,
        notes: this.currentProgression.notes,
        functions: this.currentProgression.functions || []
      };
      const voices = this.voiceLeadingService.applyVoiceLeading(inputProgression, this.currentFormation?.tessituras);
      console.log('Regenerated voices:', JSON.stringify(voices));
      this.progressions[this.currentProgressionIndex] = {
        ...this.currentProgression,
        voices
      };
      this.currentProgression = { ...this.progressions[this.currentProgressionIndex] };
    }
  }

  private updateAlgorithmIndex(): void {
    const algorithms = this.chordProgressionsService.getAvailableAlgorithms();
    this.algorithmIndex = algorithms.findIndex(alg => alg === this.selectedAlgorithm);
    if (this.algorithmIndex === -1 && algorithms.length > 0) {
      this.selectedAlgorithm = algorithms[0];
      this.algorithmIndex = 0;
    }
  }
}