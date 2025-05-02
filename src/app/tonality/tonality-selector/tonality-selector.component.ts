import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TonalityService } from '../tonality.service';

@Component({
  selector: 'app-tonality-selector',
  templateUrl: './tonality-selector.component.html',
  styleUrls: ['./tonality-selector.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule]
})
export class TonalitySelectorComponent {
  tonalities: string[] = [];
  selectedTonality: string = 'C';

  @Output() keyChanged = new EventEmitter<string>();

  constructor(private tonalityService: TonalityService) {
    this.tonalities = this.tonalityService.getAvailableTonalities();
  }

  onTonalityChange(): void {
    this.keyChanged.emit(this.selectedTonality);
  }
}