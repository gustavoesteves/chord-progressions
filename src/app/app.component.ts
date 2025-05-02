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
import { VoiceLeadingService } from './chord-progressions/voice-leading/voice-leading.service';

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
  selectedAlgorithm: string = 'Encadeamento das tríades tonais';
  selectedFormation: string = 'piano';
  progressionLength: number = 4;
  generateClicked: boolean = false;
  progressions: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] }[] = [];
  currentProgression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] } | null = null;
  currentProgressionIndex: number = 0;
  progressionGenerator: Generator<{ roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] }, void, undefined> | null = null;
  formations: string[] = ['piano', 'violão', 'quarteto de cordas', 'quarteto vocal'];
  algorithmIndex: number = 0;

  constructor(
    private chordProgressionsService: ChordProgressionsService,
    private voiceLeadingService: VoiceLeadingService
  ) {
    this.updateAlgorithmIndex();
  }

  onKeyChange(tonality: string): void {
    this.selectedTonality = tonality;
    this.generateClicked = false;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    this.progressionGenerator = null;
  }

  onAlgorithmChange(algorithm: string): void {
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
      this.currentProgression = { ...this.currentProgression };
    }
  }

  onGenerate(): void {
    this.generateClicked = true;
    this.progressions = [];
    this.currentProgression = null;
    this.currentProgressionIndex = 0;
    this.progressionGenerator = this.chordProgressionsService.getProgressionsGenerator(
      this.selectedTonality,
      this.selectedAlgorithm,
      this.progressionLength
    );
    this.loadNextProgression();
  }

  loadNextProgression(): void {
    if (!this.progressionGenerator) return;
    const next = this.progressionGenerator.next();
    if (!next.done && next.value) {
      this.progressions.push(next.value);
      this.currentProgressionIndex = this.progressions.length - 1;
      this.currentProgression = next.value;
    }
  }

  loadPreviousProgression(): void {
    if (this.currentProgressionIndex <= 0) return;
    this.currentProgressionIndex--;
    this.currentProgression = this.progressions[this.currentProgressionIndex];
  }

  private updateAlgorithmIndex(): void {
    const algorithms = this.chordProgressionsService.getAvailableAlgorithms();
    this.algorithmIndex = algorithms.indexOf(this.selectedAlgorithm);
  }
}