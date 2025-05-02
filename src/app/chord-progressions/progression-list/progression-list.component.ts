import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-progression-list',
  templateUrl: './progression-list.component.html',
  styleUrls: ['./progression-list.component.scss'],
  standalone: true,
  imports: [MatCardModule, MatTableModule]
})
export class ProgressionListComponent {
  @Input() progressions: { roman: string[], transposed: string[], notes: string[][] }[] = [];
  displayedColumns: string[] = ['roman', 'transposed'];

  formatProgression(progression: string[]): string {
    return progression
      .filter(chord => chord && chord.trim() !== '')
      .join(' -> ');
  }
}