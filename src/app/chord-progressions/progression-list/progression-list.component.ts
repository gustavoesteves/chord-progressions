import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progression-list',
  templateUrl: './progression-list.component.html',
  styleUrls: ['./progression-list.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ProgressionListComponent {
  @Input() progressions: { roman: string[], transposed: string[] }[] = [];

  formatProgression(progression: string[]): string {
    return progression
      .filter(chord => chord && chord.trim() !== '')
      .join(' -> ');
  }
}