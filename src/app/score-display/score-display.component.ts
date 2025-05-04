import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenSheetMusicDisplay, IOSMDOptions, AlignRestOption } from 'opensheetmusicdisplay';
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
      autoResize: false, // Evita redimensionamento automático para maior controle
      backend: 'svg',
      drawTitle: false,
      drawPartNames: false,
      drawingParameters: 'default', // Prioriza clareza para acordes
      renderSingleHorizontalStaffline: false, // Garante múltiplas pautas para piano
      disableCursor: true, // Evita cursor interativo
      alignRests: AlignRestOption.Auto, // Alinha pausas e notas em múltiplas vozes
      autoBeam: false, // Evita vigas automáticas
      followCursor: false, // Desativa acompanhamento de cursor
      newSystemFromXML: true, // Força novo sistema para cada XML carregado
      newPageFromXML: true // Força nova página para cada XML carregado
    };

    try {
      if (!this.osmd) {
        this.osmd = new OpenSheetMusicDisplay(this.osmdContainer.nativeElement, options);
        console.log('OSMD initialized successfully:', this.osmd);
        // Ajustes finos via EngravingRules
        this.osmd.EngravingRules.MinNoteDistance = 3.0; // Aumenta distância mínima entre notas
        this.osmd.EngravingRules.DisplacedNoteMargin = 0.3; // Ajusta margem para notas desalinhadas
        this.osmd.EngravingRules.CompactMode = false; // Desativa compactação para clareza
        this.osmd.EngravingRules.VoiceSpacingMultiplierVexflow = 1.2; // Aumenta espaçamento entre vozes
        this.osmd.EngravingRules.VoiceSpacingAddendVexflow = 0.5; // Adiciona margem extra entre vozes
      }

      if (this.progression && this.formation && this.osmd) {
        console.log('Generating MusicXML...');
        const musicXml = await this.musicXmlService.generateMusicXml(this.progression, this.formation);
        console.log('MusicXML generated:', musicXml);

        if (musicXml) {
          // Limpar o estado do OSMD antes de carregar novo XML
          this.osmd.clear();
          await this.osmd.load(musicXml);
          console.log('MusicXML loaded into OSMD');
          this.osmd.render();
          // Contar compassos no MusicXML para depuração
          const measureCount = (musicXml.match(/<measure/g) || []).length;
          console.log('Partitura renderizada com sucesso. Compassos no MusicXML:', measureCount);
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