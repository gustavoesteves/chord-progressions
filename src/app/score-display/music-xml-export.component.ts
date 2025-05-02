import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { create } from 'xmlbuilder2';

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
  @Input() formation: string = 'piano';
  @Input() algorithmIndex: number = 0; // Índice do algoritmo

  exportToMusicXML(): void {
    if (!this.progression || !this.progression.voices) return;

    const musicXML = this.generateMusicXML(this.progression, this.formation);

    // Gerar o nome do arquivo com índice do algoritmo, data e hora
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).split('/').join('-');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).split(':').join('-');
    const fileName = `${this.algorithmIndex}-${dateStr}_${timeStr}.xml`;

    // Criar um blob e iniciar o download
    const blob = new Blob([musicXML], { type: 'application/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private generateMusicXML(progression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] }, formation: string): string {
    const { voices, roman, transposed } = progression;

    // Se voices for undefined, retornar um XML vazio
    if (!voices) {
      return '';
    }

    // Criar o documento MusicXML usando xmlbuilder2
    const xml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'yes' })
      .ele('score-partwise', { version: '4.0' })
        .ele('work')
          .ele('work-title').txt('Chord Progression').up()
        .up()
        .ele('identification')
          .ele('creator', { type: 'composer' }).txt('Chord Progressions App').up()
          .ele('encoding')
            .ele('software').txt('Chord Progressions App').up()
            .ele('encoding-date').txt(new Date().toISOString().split('T')[0]).up()
          .up()
        .up()
        .ele('part-list')
          .ele('score-part', { id: 'P1' })
            .ele('part-name').txt('Piano').up()
          .up()
        .up()
        .ele('part', { id: 'P1' });

    // Para cada compasso (cada acorde na progressão)
    voices.forEach((voice, index) => {
      const { soprano, contralto, tenor, baixo } = voice;

      // Função para converter uma nota (ex.: "C/4") em elementos MusicXML
      const noteToMusicXML = (note: string, voiceNum: number, duration: number) => {
        const [pitch, octave] = note.split('/');
        const step = pitch[0]; // Ex.: C
        const alter = pitch.length > 1 ? (pitch[1] === '#' ? 1 : -1) : 0; // Alteração (sharp ou flat)

        return {
          pitch: {
            step,
            ...(alter !== 0 && { alter }),
            octave
          },
          duration,
          voice: voiceNum,
          type: 'whole'
        };
      };

      // Definir as vozes para cada formação
      const sopranoXML = noteToMusicXML(soprano, 1, 4);
      const contraltoXML = noteToMusicXML(contralto, 2, 4);
      const tenorXML = noteToMusicXML(tenor, 3, 4);
      const baixoXML = noteToMusicXML(baixo, 4, 4);

      // Estrutura do compasso
      const measure = xml.ele('measure', { number: (index + 1).toString() });

      // Incluir atributos (clave e fórmula de compasso) apenas no primeiro compasso
      if (index === 0) {
        measure.ele('attributes')
          .ele('divisions').txt('1').up()
          .ele('key')
            .ele('fifths').txt('0').up()
          .up()
          .ele('time')
            .ele('beats').txt('4').up()
            .ele('beat-type').txt('4').up()
          .up()
          .ele('staves').txt('2').up()
          .ele('clef', { number: '1' })
            .ele('sign').txt('G').up()
            .ele('line').txt('2').up()
          .up()
          .ele('clef', { number: '2' })
            .ele('sign').txt('F').up()
            .ele('line').txt('4').up()
          .up()
        .up();
      }

      // Adicionar direções (Roman Numerals e Chords)
      measure.ele('direction', { placement: 'above' })
        .ele('direction-type')
          .ele('words').txt(roman[index]).up()
        .up()
      .up()
      .ele('direction', { placement: 'below' })
        .ele('direction-type')
          .ele('words').txt(transposed[index]).up()
        .up()
      .up();

      // Adicionar as vozes ao compasso
      if (formation === 'piano') {
        measure.ele('staff-details', { number: '1' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(sopranoXML.pitch).up()
          .ele('duration').txt(sopranoXML.duration.toString()).up()
          .ele('voice').txt(sopranoXML.voice.toString()).up()
          .ele('type').txt(sopranoXML.type).up()
        .up()
        .ele('note')
          .ele(contraltoXML.pitch).up()
          .ele('duration').txt(contraltoXML.duration.toString()).up()
          .ele('voice').txt(contraltoXML.voice.toString()).up()
          .ele('type').txt(contraltoXML.type).up()
        .up()
        .ele('staff-details', { number: '2' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(tenorXML.pitch).up()
          .ele('duration').txt(tenorXML.duration.toString()).up()
          .ele('voice').txt(tenorXML.voice.toString()).up()
          .ele('type').txt(tenorXML.type).up()
        .up()
        .ele('note')
          .ele(baixoXML.pitch).up()
          .ele('duration').txt(baixoXML.duration.toString()).up()
          .ele('voice').txt(baixoXML.voice.toString()).up()
          .ele('type').txt(baixoXML.type).up()
        .up();
      } else if (formation === 'quarteto vocal') {
        measure.ele('staff-details', { number: '1' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(sopranoXML.pitch).up()
          .ele('duration').txt(sopranoXML.duration.toString()).up()
          .ele('voice').txt(sopranoXML.voice.toString()).up()
          .ele('type').txt(sopranoXML.type).up()
        .up()
        .ele('staff-details', { number: '2' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(contraltoXML.pitch).up()
          .ele('duration').txt(contraltoXML.duration.toString()).up()
          .ele('voice').txt(contraltoXML.voice.toString()).up()
          .ele('type').txt(contraltoXML.type).up()
        .up()
        .ele('staff-details', { number: '3' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(tenorXML.pitch).up()
          .ele('duration').txt(tenorXML.duration.toString()).up()
          .ele('voice').txt(tenorXML.voice.toString()).up()
          .ele('type').txt(tenorXML.type).up()
        .up()
        .ele('staff-details', { number: '4' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(baixoXML.pitch).up()
          .ele('duration').txt(baixoXML.duration.toString()).up()
          .ele('voice').txt(baixoXML.voice.toString()).up()
          .ele('type').txt(baixoXML.type).up()
        .up();
      } else {
        measure.ele('staff-details', { number: '1' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(sopranoXML.pitch).up()
          .ele('duration').txt(sopranoXML.duration.toString()).up()
          .ele('voice').txt(sopranoXML.voice.toString()).up()
          .ele('type').txt(sopranoXML.type).up()
        .up()
        .ele('staff-details', { number: '2' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(contraltoXML.pitch).up()
          .ele('duration').txt(contraltoXML.duration.toString()).up()
          .ele('voice').txt(contraltoXML.voice.toString()).up()
          .ele('type').txt(contraltoXML.type).up()
        .up()
        .ele('staff-details', { number: '3' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(tenorXML.pitch).up()
          .ele('duration').txt(tenorXML.duration.toString()).up()
          .ele('voice').txt(tenorXML.voice.toString()).up()
          .ele('type').txt(tenorXML.type).up()
        .up()
        .ele('staff-details', { number: '4' })
          .ele('staff-lines').txt('5').up()
        .up()
        .ele('note')
          .ele(baixoXML.pitch).up()
          .ele('duration').txt(baixoXML.duration.toString()).up()
          .ele('voice').txt(baixoXML.voice.toString()).up()
          .ele('type').txt(baixoXML.type).up()
        .up();
      }
    });

    // Finalizar o documento XML
    const xmlString = xml.end({ prettyPrint: true });
    return xmlString;
  }
}