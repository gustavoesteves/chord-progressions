import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MusicXmlService } from './music-xml.service';
import { Formation } from '../types';

@Component({
  selector: 'app-music-xml-export',
  template: `
    <button mat-raised-button class="nav-button" (click)="exportToMusicXML()">
      Export to MusicXML
    </button>
  `,
  styles: [],
  imports: [
    CommonModule,
    MatButtonModule
  ],
  standalone: true
})
export class MusicXmlExportComponent {
  @Input() progression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] } | null = null;
  @Input() formation: Formation | null = null;
  @Input() algorithmIndex: number = 0;

  constructor(private musicXmlService: MusicXmlService) {}

  async exportToMusicXML(): Promise<void> {
    if (!this.progression || !this.formation) return;

    const musicXml = await this.musicXmlService.generateMusicXml(this.progression, this.formation);
    if (!musicXml) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':').join('-');
    const fileName = `${this.algorithmIndex}-${dateStr}_${timeStr}.xml`;

    const blob = new Blob([musicXml], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}