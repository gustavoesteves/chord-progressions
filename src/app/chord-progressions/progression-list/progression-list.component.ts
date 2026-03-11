import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-progression-list',
  templateUrl: './progression-list.component.html',
  styleUrls: ['./progression-list.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule]
})
export class ProgressionListComponent {
  @Input() progressions: { roman: string[], transposed: string[], notes: string[][] }[] = [];
  @Input() currentPlayingIndex: number | null = null;
  displayedColumns: string[] = ['roman', 'transposed'];

  formatProgression(progression: string[]): string {
    return progression
      .filter(chord => chord && chord.trim() !== '')
      .join(' -> ');
  }
}