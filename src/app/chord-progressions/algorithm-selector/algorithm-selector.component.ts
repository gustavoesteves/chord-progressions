import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChordProgressionsService } from '../chord-progressions.service';
import { ProgressionAlgorithm } from '../../types';

@Component({
  selector: 'app-algorithm-selector',
  templateUrl: './algorithm-selector.component.html',
  styleUrls: ['./algorithm-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AlgorithmSelectorComponent implements OnInit {
  availableAlgorithms: ProgressionAlgorithm[] = [];
  selectedAlgorithm: ProgressionAlgorithm | null = null;
  @Output() algorithmChanged = new EventEmitter<ProgressionAlgorithm>();

  constructor(private chordProgressionsService: ChordProgressionsService) {}

  ngOnInit(): void {
    this.availableAlgorithms = this.chordProgressionsService.getAvailableAlgorithms();
    if (this.availableAlgorithms.length > 0) {
      this.selectedAlgorithm = this.availableAlgorithms[0];
      this.algorithmChanged.emit(this.selectedAlgorithm);
    }
  }

  onAlgorithmChange(): void {
    if (this.selectedAlgorithm) {
      this.algorithmChanged.emit(this.selectedAlgorithm);
    }
  }
}