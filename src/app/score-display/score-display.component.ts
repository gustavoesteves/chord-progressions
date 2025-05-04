import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenSheetMusicDisplay, IOSMDOptions } from 'opensheetmusicdisplay';
import { MusicXmlService } from './music-xml.service';
import { Formation } from '../types';

@Component({
  selector: 'app-score-display',
  template: `
    <div #osmdContainer class="osmd-container"></div>
  `,
  styles: [`
    .osmd-container {
      width: 100%;
      height: auto;
      margin-top: 20px;
    }
  `],
  imports: [CommonModule],
  standalone: true
})
export class ScoreDisplayComponent implements AfterViewInit, OnChanges {
  @ViewChild('osmdContainer', { static: false }) osmdContainer!: ElementRef;
  @Input() progression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] } | null = null;
  @Input() formation: Formation | null = null;
  private osmd: OpenSheetMusicDisplay | null = null;

  constructor(private musicXmlService: MusicXmlService) {}

  async ngAfterViewInit(): Promise<void> {
    console.log('ScoreDisplayComponent initialized with progression:', this.progression, 'formation:', this.formation);
    await this.setupOsmd();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes['progression'] && this.osmd) {
      console.log('Progression changed:', this.progression);
      await this.setupOsmd();
    }
  }

  private async setupOsmd(): Promise<void> {
    console.log('Setting up OSMD...');
    const options: IOSMDOptions = {
      autoResize: true,
      backend: 'svg',
      drawTitle: false,
      drawPartNames: false
    };

    try {
      if (!this.osmd) {
        this.osmd = new OpenSheetMusicDisplay(this.osmdContainer.nativeElement, options);
        console.log('OSMD initialized successfully:', this.osmd);
      }

      if (this.progression && this.formation && this.osmd) {
        console.log('Generating MusicXML...');
        const musicXml = await this.musicXmlService.generateMusicXml(this.progression, this.formation);
        console.log('MusicXML generated:', musicXml);

        if (musicXml) {
          await this.osmd.load(musicXml);
          console.log('MusicXML loaded into OSMD');
          this.osmd.render();
          console.log('Partitura renderizada com sucesso');
        } else {
          console.error('MusicXML não gerado');
        }
      } else {
        console.error('Progression, formation ou OSMD não disponível:', { progression: this.progression, formation: this.formation, osmd: this.osmd });
      }
    } catch (error) {
      console.error('Erro ao renderizar a partitura:', error);
    }
  }
}