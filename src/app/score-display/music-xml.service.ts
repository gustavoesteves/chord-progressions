import { Injectable } from '@angular/core';
import { create } from 'xmlbuilder2';

@Injectable({
  providedIn: 'root'
})
export class MusicXmlService {
  async generateMusicXml(
    progression: {
      roman: string[];
      transposed: string[];
      notes: string[][];
      voices?: { soprano: string; contralto: string; tenor: string; baixo: string }[];
    },
    formation: string
  ): Promise<string> {
    console.log('Gerando MusicXML para progressão:', progression, 'formação:', formation);

    if (!progression.voices) {
      console.error('Progressão não contém vozes');
      return '';
    }

    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    try {
      const xml = create({ version: '1.0', encoding: 'UTF-8', standalone: 'yes' })
        .ele('score-partwise', { version: '4.0' })
        .ele('work')
        .ele('work-title')
        .txt('Chord Progression')
        .up()
        .up()
        .ele('identification')
        .ele('creator', { type: 'composer' })
        .txt('')
        .up()
        .ele('encoding')
        .ele('software')
        .txt('Chord Progressions App')
        .up()
        .ele('encoding-date')
        .txt(new Date().toISOString().split('T')[0])
        .up()
        .up()
        .up()
        .ele('part-list')
        .ele('score-part', { id: 'P1' })
        .ele('part-name')
        .txt(formation === 'piano' ? 'Piano' : 'Ensemble')
        .up()
        .up()
        .up()
        .ele('part', { id: 'P1' });

      progression.voices.forEach((voice, index) => {
        const { soprano, contralto, tenor, baixo } = voice;
        const romanNumeral = progression.roman[index];
        const chordName = progression.transposed[index];

        const measure = xml.ele('measure', { number: (index + 1).toString() });

        if (index === 0) {
          measure
            .ele('attributes')
            .ele('divisions')
            .txt('1')
            .up()
            .ele('key')
            .ele('fifths')
            .txt('0')
            .up()
            .up()
            .ele('time')
            .ele('beats')
            .txt('4')
            .up()
            .ele('beat-type')
            .txt('4')
            .up()
            .up()
            .ele('staves')
            .txt('2')
            .up()
            .ele('clef', { number: '1' })
            .ele('sign')
            .txt('G')
            .up()
            .ele('line')
            .txt('2')
            .up()
            .up()
            .ele('clef', { number: '2' })
            .ele('sign')
            .txt('F')
            .up()
            .ele('line')
            .txt('4')
            .up()
            .up()
            .up();
        }

        measure
          .ele('direction', { placement: 'above' })
          .ele('direction-type')
          .ele('words')
          .txt(romanNumeral)
          .up()
          .up()
          .up()
          .ele('direction', { placement: 'below' })
          .ele('direction-type')
          .ele('words')
          .txt(chordName)
          .up()
          .up()
          .up();

        const validateNote = (note: string): { step: string; octave: string; alter?: number } | null => {
          const match = note.match(/([A-G]#?|\w+)\/(\d+)/);
          if (!match || !noteNames.includes(match[1])) {
            console.warn(`Nota inválida: ${note}`);
            return null;
          }
          const [_, step, octave] = match;
          const alter = step.length > 1 ? (step[1] === '#' ? 1 : -1) : 0;
          return { step: step[0], octave, alter };
        };

        const voicesOrder = [soprano, contralto, tenor, baixo];

        if (formation === 'piano') {
          const trebleNotes = [voicesOrder[0], voicesOrder[1]];
          trebleNotes.forEach((note, noteIndex) => {
            const validatedNote = validateNote(note);
            if (!validatedNote) return;
            const noteEle = measure.ele('note');
            if (noteIndex > 0) {
              noteEle.ele('chord').up();
            }
            const pitchEle = noteEle.ele('pitch');
            pitchEle.ele('step').txt(validatedNote.step).up();
            pitchEle.ele('octave').txt(validatedNote.octave).up();
            if (validatedNote.alter !== undefined && validatedNote.alter !== 0) {
              pitchEle.ele('alter').txt(validatedNote.alter.toString()).up();
            }
            noteEle.ele('duration').txt('4').up();
            noteEle.ele('voice').txt('1').up();
            noteEle.ele('type').txt('whole').up();
            noteEle.ele('staff').txt('1').up();
          });

          measure.ele('backup').ele('duration').txt('4').up().up();

          const bassNotes = [voicesOrder[2], voicesOrder[3]];
          bassNotes.forEach((note, noteIndex) => {
            const validatedNote = validateNote(note);
            if (!validatedNote) return;
            const noteEle = measure.ele('note');
            if (noteIndex > 0) {
              noteEle.ele('chord').up();
            }
            const pitchEle = noteEle.ele('pitch');
            pitchEle.ele('step').txt(validatedNote.step).up();
            pitchEle.ele('octave').txt(validatedNote.octave).up();
            if (validatedNote.alter !== undefined && validatedNote.alter !== 0) {
              pitchEle.ele('alter').txt(validatedNote.alter.toString()).up();
            }
            noteEle.ele('duration').txt('4').up();
            noteEle.ele('voice').txt('1').up();
            noteEle.ele('type').txt('whole').up();
            noteEle.ele('staff').txt('2').up();
          });
        } else {
          voicesOrder.forEach((note, voiceIndex) => {
            const validatedNote = validateNote(note);
            if (!validatedNote) return;
            const noteEle = measure.ele('note');
            const pitchEle = noteEle.ele('pitch');
            pitchEle.ele('step').txt(validatedNote.step).up();
            pitchEle.ele('octave').txt(validatedNote.octave).up();
            if (validatedNote.alter !== undefined && validatedNote.alter !== 0) {
              pitchEle.ele('alter').txt(validatedNote.alter.toString()).up();
            }
            noteEle.ele('duration').txt('4').up();
            noteEle.ele('voice').txt((voiceIndex + 1).toString()).up();
            noteEle.ele('type').txt('whole').up();
            noteEle.ele('staff').txt((voiceIndex + 1).toString()).up();
          });
        }
      });

      const musicXml = xml.end({ prettyPrint: true });
      console.log('MusicXML gerado:', musicXml);
      return musicXml;
    } catch (error) {
      console.error('Erro ao gerar MusicXML:', error);
      throw error;
    }
  }
}