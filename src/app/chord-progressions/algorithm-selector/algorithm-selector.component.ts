import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChordProgressionsService } from '../chord-progressions.service';

@Component({
  selector: 'app-algorithm-selector',
  templateUrl: './algorithm-selector.component.html',
  styleUrls: ['./algorithm-selector.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AlgorithmSelectorComponent implements OnInit {
  availableAlgorithms: string[] = [];
  selectedAlgorithm: string = '';
  @Output() algorithmChanged = new EventEmitter<string>();

  constructor(private chordProgressionsService: ChordProgressionsService) {}

  ngOnInit(): void {
    this.availableAlgorithms = this.chordProgressionsService.getAvailableAlgorithms();
    if (this.availableAlgorithms.length > 0) {
      this.selectedAlgorithm = this.availableAlgorithms[0];
      this.algorithmChanged.emit(this.selectedAlgorithm);
    }
  }

  onAlgorithmChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedAlgorithm = target.value;
    this.algorithmChanged.emit(this.selectedAlgorithm);
  }
}