import { Injectable } from '@angular/core';
import { create } from 'xmlbuilder2';

@Injectable({
  providedIn: 'root'
})
export class MusicXmlService {
  async generateMusicXml(progression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] }, formation: string): Promise<string> {
    console.log('Gerando MusicXML para progressão:', progression, 'formação:', formation);

    if (!progression.voices) {
      console.error('Progressão não contém vozes');
      return '';
    }

    try {
      // Criar o documento MusicXML usando xmlbuilder2
      const xml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'yes' })
        .ele('score-partwise', { version: '4.0' })
          .ele('work')
            .ele('work-title').txt('Chord Progression').up()
          .up()
          .ele('identification')
            .ele('creator', { type: 'composer' }).txt('').up()
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
      progression.voices.forEach((voice, index) => {
        const { soprano, contralto, tenor, baixo } = voice;
        const romanNumeral = progression.roman[index];
        const chordName = progression.transposed[index];

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
            .ele('words').txt(romanNumeral).up()
          .up()
        .up()
        .ele('direction', { placement: 'below' })
          .ele('direction-type')
            .ele('words').txt(chordName).up()
          .up()
        .up();

        // Função para converter uma nota (ex.: "C/4") em elementos MusicXML
        const noteToMusicXML = (note: string, voiceNum: number, staff: number, isChord: boolean) => {
          const [pitch, octave] = note.split('/');
          const step = pitch[0]; // Ex.: C
          const alter = pitch.length > 1 ? (pitch[1] === '#' ? 1 : -1) : 0; // Alteração (sharp ou flat)

          const noteEle = measure.ele('note');
          if (isChord) {
            noteEle.ele('chord');
          }
          const pitchEle = noteEle.ele('pitch');
          pitchEle.ele('step').txt(step);
          pitchEle.ele('octave').txt(octave);
          if (alter !== 0) {
            pitchEle.ele('alter').txt(alter.toString());
          }
          noteEle.ele('duration').txt('4');
          noteEle.ele('voice').txt(voiceNum.toString());
          noteEle.ele('type').txt('whole');
          noteEle.ele('staff').txt(staff.toString());
        };

        // Usar a ordem das vozes fornecida pelo VoiceLeadingAlgorithm
        const voicesOrder = [soprano, contralto, tenor, baixo];

        // Adicionar as vozes ao compasso
        if (formation === 'piano') {
          // Staff 1 (clave de sol): Soprano e Contralto
          noteToMusicXML(voicesOrder[0], 1, 1, false); // Soprano (primeira nota do acorde)
          noteToMusicXML(voicesOrder[1], 1, 1, true);  // Contralto (parte do mesmo acorde)

          // Usar <backup> para voltar ao início do compasso
          measure.ele('backup')
            .ele('duration').txt('4').up()
          .up();

          // Staff 2 (clave de fá): Tenor e Baixo
          // Usar o mesmo valor de voice para garantir alinhamento temporal
          noteToMusicXML(voicesOrder[2], 1, 2, false); // Tenor (primeira nota do acorde no staff 2)
          noteToMusicXML(voicesOrder[3], 1, 2, true);  // Baixo (parte do mesmo acorde)
        } else if (formation === 'quarteto vocal') {
          noteToMusicXML(voicesOrder[0], 1, 1, false);
          noteToMusicXML(voicesOrder[1], 2, 2, false);
          noteToMusicXML(voicesOrder[2], 3, 3, false);
          noteToMusicXML(voicesOrder[3], 4, 4, false);
        } else {
          noteToMusicXML(voicesOrder[0], 1, 1, false);
          noteToMusicXML(voicesOrder[1], 2, 2, false);
          noteToMusicXML(voicesOrder[2], 3, 3, false);
          noteToMusicXML(voicesOrder[3], 4, 4, false);
        }
      });

      // Finalizar o documento XML e retornar como string
      const musicXml = xml.end({ prettyPrint: true });
      console.log('MusicXML gerado:', musicXml);
      return musicXml;
    } catch (error) {
      console.error('Erro ao gerar MusicXML:', error);
      throw error;
    }
  }
}