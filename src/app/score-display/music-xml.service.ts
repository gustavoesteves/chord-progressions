import { Injectable } from '@angular/core';
import { create } from 'xmlbuilder2';
import { Note } from '@tonaljs/tonal';
import { Formation } from '../types';

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
    formation: Formation
  ): Promise<string> {
    console.log('Gerando MusicXML para progressão:', progression, 'formação:', formation);

    if (!progression.voices) {
      console.error('Progressão não contém vozes');
      return '';
    }

    try {
      const staffNumbers = [
        formation.tessituras.soprano.staff,
        formation.tessituras.contralto.staff,
        formation.tessituras.tenor.staff,
        formation.tessituras.baixo.staff
      ];
      const numberOfStaves = Math.max(...staffNumbers);

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
        .txt(formation.name)
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
          const attributes = measure.ele('attributes');
          attributes
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
            .txt(numberOfStaves.toString())
            .up();

          const uniqueStaffs = Array.from(new Set(staffNumbers));
          uniqueStaffs.forEach(staff => {
            const voiceKey = Object.keys(formation.tessituras).find(
              key => formation.tessituras[key as keyof typeof formation.tessituras].staff === staff
            );
            if (voiceKey) {
              const clef = formation.tessituras[voiceKey as keyof typeof formation.tessituras].clef;
              attributes
                .ele('clef', { number: staff.toString() })
                .ele('sign')
                .txt(clef)
                .up()
                .ele('line')
                .txt(clef === 'G' ? '2' : clef === 'F' ? '4' : '3')
                .up()
                .up();

              if (formation.name === 'Violão' && clef === 'G') {
                attributes
                  .ele('staff-details', { number: staff.toString() })
                  .ele('octave-shift', { type: 'down', size: '8' })
                  .up()
                  .up();
              }
            }
          });
          attributes.up();
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

        const validateNote = (note: string): { step: string; octave: number; alter?: number } | null => {
          const noteData = Note.get(note);
          if (!noteData || !noteData.pc || noteData.empty) {
            console.warn(`Nota inválida: ${note}`);
            return null;
          }
          const stepMap = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
          const step = stepMap[noteData.step];
          const octave = noteData.oct || 4;
          const alter = noteData.alt || 0;
          return { step, octave, alter };
        };

        const voicesOrder = [
          { note: soprano, staff: formation.tessituras.soprano.staff, voiceId: formation.name === 'Violão' ? 1 : formation.name === 'Piano' ? 1 : 1 },
          { note: contralto, staff: formation.tessituras.contralto.staff, voiceId: formation.name === 'Violão' ? 1 : formation.name === 'Piano' ? 1 : 2 },
          { note: tenor, staff: formation.tessituras.tenor.staff, voiceId: formation.name === 'Violão' ? 1 : formation.name === 'Piano' ? 2 : 3 },
          { note: baixo, staff: formation.tessituras.baixo.staff, voiceId: formation.name === 'Violão' ? 1 : formation.name === 'Piano' ? 2 : 4 }
        ];

        const voicesByStaff: { [staff: number]: { note: string; voiceId: number }[] } = {};
        voicesOrder.forEach(v => {
          if (!voicesByStaff[v.staff]) {
            voicesByStaff[v.staff] = [];
          }
          if (v.note !== '') {
            voicesByStaff[v.staff].push({ note: v.note, voiceId: v.voiceId });
          }
        });

        Object.keys(voicesByStaff).forEach(staff => {
          const staffVoices = voicesByStaff[parseInt(staff)];
          staffVoices.forEach((v, noteIndex) => {
            const validatedNote = validateNote(v.note);
            if (!validatedNote) return;
            const noteEle = measure.ele('note');
            if (noteIndex > 0 && formation.name !== 'Quarteto Vocal') {
              noteEle.ele('chord').up();
            }
            const pitchEle = noteEle.ele('pitch');
            pitchEle.ele('step').txt(validatedNote.step).up();
            pitchEle.ele('octave').txt(validatedNote.octave.toString()).up();
            if (validatedNote.alter !== undefined && validatedNote.alter !== 0) {
              pitchEle.ele('alter').txt(validatedNote.alter.toString()).up();
            }
            noteEle.ele('duration').txt('4').up();
            noteEle.ele('voice').txt(v.voiceId.toString()).up();
            noteEle.ele('type').txt('whole').up();
            noteEle.ele('staff').txt(staff).up();
          });

          if (numberOfStaves > 1 && parseInt(staff) < numberOfStaves) {
            measure.ele('backup').ele('duration').txt('4').up().up();
          }
        });
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