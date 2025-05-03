import { Injectable } from '@angular/core';
import { VoiceLeadingAlgorithmInterface, Voices } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class VoiceLeadingAlgorithm implements VoiceLeadingAlgorithmInterface {
  applyVoiceLeading(progression: { roman: string[], transposed: string[], notes: string[][] }): { soprano: string, contralto: string, tenor: string, baixo: string }[] {
    // Tessituras definidas (em notas MIDI)
    const tessitura = {
      baixo: { min: 36, max: 55 },    // C2 a G3
      tenor: { min: 43, max: 62 },    // G2 a D4
      contralto: { min: 48, max: 67 }, // C3 a G4
      soprano: { min: 55, max: 72 }   // G3 a C5
    };

    let previousVoices: Voices | null = null;
    const resultVoices: Voices[] = [];

    for (let i = 0; i < progression.notes.length; i++) {
      const notes = progression.notes[i];
      const romanNumeral = progression.roman[i];

      // Extrair fundamental, terça e quinta do acorde
      const fundamental = notes[0].split('/')[0]; // Ex.: C
      const third = notes[1].split('/')[0];       // Ex.: E
      const fifth = notes[2].split('/')[0];       // Ex.: G

      // Determinar as notas disponíveis (excluindo o baixo)
      const availableNotes = [fundamental, third, fifth];

      // Inicializar as vozes para o acorde atual
      const voices: Voices = {
        soprano: '',
        contralto: '',
        tenor: '',
        baixo: ''
      };

      // Função para calcular a distância em semitons
      const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const getSemitoneDistance = (note1: string, note2: string): number => {
        const [name1, octave1] = note1.split('/');
        const [name2, octave2] = note2.split('/');
        const midi1 = noteNames.indexOf(name1) + (parseInt(octave1) * 12);
        const midi2 = noteNames.indexOf(name2) + (parseInt(octave2) * 12);
        return Math.abs(midi1 - midi2);
      };

      // Função para ajustar a oitava de uma nota para uma tessitura
      const adjustOctave = (note: string, minMidi: number, maxMidi: number, voice: string, previousNote?: string): string => {
        const [noteName] = note.split('/');
        let octave: number;
        if (previousNote) {
          const [_, prevOctave] = previousNote.split('/');
          octave = parseInt(prevOctave);
        } else {
          // Definir a oitava inicial com base na voz
          if (voice === 'baixo') {
            octave = 3; // Começar em C3 para o baixo
          } else if (voice === 'tenor') {
            octave = 3; // Começar em G3 para o tenor
          } else {
            octave = 4; // Começar em C4 ou E4 para soprano e contralto
          }
        }

        let midi = noteNames.indexOf(noteName) + (octave * 12);
        while (midi < minMidi) {
          octave++;
          midi = noteNames.indexOf(noteName) + (octave * 12);
        }
        while (midi > maxMidi) {
          octave--;
          midi = noteNames.indexOf(noteName) + (octave * 12);
        }

        // Ajustar a oitava para minimizar a distância
        if (previousNote) {
          const prevMidi = noteNames.indexOf(previousNote.split('/')[0]) + (parseInt(previousNote.split('/')[1]) * 12);
          let bestOctave = octave;
          let bestDistance = Math.abs(midi - prevMidi);
          for (let testOctave = octave - 1; testOctave <= octave + 1; testOctave++) {
            const testMidi = noteNames.indexOf(noteName) + (testOctave * 12);
            if (testMidi >= minMidi && testMidi <= maxMidi) {
              const distance = Math.abs(testMidi - prevMidi);
              if (distance < bestDistance) {
                bestDistance = distance;
                bestOctave = testOctave;
              }
            }
          }
          octave = bestOctave;
          midi = noteNames.indexOf(noteName) + (octave * 12);

          // Verificar novamente se está dentro da tessitura após o ajuste
          if (midi < minMidi || midi > maxMidi) {
            octave = Math.floor((minMidi + maxMidi) / 2 / 12); // Ajustar para o meio da tessitura
            midi = noteNames.indexOf(noteName) + (octave * 12);
          }
        }

        return `${noteName}/${octave}`;
      };

      // Atribuir o baixo, considerando inversões indicadas pelo numeral romano
      let baixoNote: string;
      if (romanNumeral.includes('6')) {
        // Segunda inversão (ex.: V6): o baixo deve ser a quinta do acorde
        baixoNote = fifth;
      } else if (romanNumeral.includes('3')) {
        // Primeira inversão (ex.: ii3): o baixo deve ser a terça do acorde
        baixoNote = third;
      } else {
        // Posição fundamental: o baixo é a fundamental do acorde
        baixoNote = fundamental;
      }

      if (!previousVoices) {
        voices.baixo = adjustOctave(baixoNote + '/3', tessitura.baixo.min, tessitura.baixo.max, 'baixo');
      } else {
        const prevBaixo = previousVoices.baixo;
        voices.baixo = adjustOctave(
          baixoNote + '/3',
          tessitura.baixo.min,
          tessitura.baixo.max,
          'baixo',
          prevBaixo
        );
      }

      // Determinar as notas disponíveis para as outras vozes (excluindo o baixo)
      const baixoNoteName = voices.baixo.split('/')[0];
      const remainingNotesForOtherVoices = availableNotes.filter(note => note !== baixoNoteName);
      // Sempre duplicar a fundamental do acorde para ter 3 notas disponíveis
      while (remainingNotesForOtherVoices.length < 3) {
        remainingNotesForOtherVoices.push(fundamental);
      }

      if (!previousVoices) {
        // Primeiro acorde: seguir as preferências
        voices.soprano = adjustOctave(third + '/4', tessitura.soprano.min, tessitura.soprano.max, 'soprano');    // Soprano prefere a terça
        voices.tenor = adjustOctave(fifth + '/3', tessitura.tenor.min, tessitura.tenor.max, 'tenor');      // Tenor prefere a quinta
        voices.contralto = adjustOctave(fundamental + '/4', tessitura.contralto.min, tessitura.contralto.max, 'contralto'); // Contralto duplica a fundamental
      } else {
        // Identificar notas comuns entre o acorde anterior e o atual
        const previousNotes = [
          { note: previousVoices.soprano?.split('/')[0], voice: 'soprano' },
          { note: previousVoices.contralto?.split('/')[0], voice: 'contralto' },
          { note: previousVoices.tenor?.split('/')[0], voice: 'tenor' }
        ].filter(item => item.note !== undefined); // Filtra entradas undefined
        const currentNotes = remainingNotesForOtherVoices;

        const commonNotes: { note: string, previousVoice: string }[] = [];
        previousNotes.forEach(({ note, voice }) => {
          if (note && currentNotes.includes(note)) {
            commonNotes.push({ note, previousVoice: voice });
          }
        });

        // Atribuir notas comuns às mesmas vozes
        const assignedNotes = new Set<string>();
        for (const { note, previousVoice } of commonNotes) {
          if (!assignedNotes.has(note) && !voices[previousVoice as keyof Voices]) {
            voices[previousVoice as keyof Voices] = adjustOctave(
              note + '/' + (previousVoices![previousVoice as keyof Voices]?.split('/')[1] || '4'),
              tessitura[previousVoice as keyof typeof tessitura].min,
              tessitura[previousVoice as keyof typeof tessitura].max,
              previousVoice,
              previousVoices![previousVoice as keyof Voices]
            );
            assignedNotes.add(note);
          }
        }

        // Atribuir as vozes restantes
        const remainingVoices = ['soprano', 'contralto', 'tenor'].filter(voice => !voices[voice as keyof Voices]);
        let remainingNotes = currentNotes.filter(note => !assignedNotes.has(note));

        // Garantir que o tenor prefira a quinta, se ainda não atribuído
        const tenorIndex = remainingVoices.indexOf('tenor');
        if (tenorIndex !== -1 && remainingNotes.length > 0) {
          const fifthNote = fifth;
          if (remainingNotes.includes(fifthNote)) {
            voices.tenor = adjustOctave(
              fifthNote + '/3',
              tessitura.tenor.min,
              tessitura.tenor.max,
              'tenor',
              previousVoices.tenor
            );
            assignedNotes.add(fifthNote);
            remainingVoices.splice(tenorIndex, 1);
            remainingNotes = remainingNotes.filter(note => note !== fifthNote);
          }
        }

        // Atualizar as notas restantes após atribuir o tenor
        remainingVoices.forEach((voice, idx) => {
          if (remainingNotes.length === 0) {
            // Se não houver notas restantes, usar a fundamental como fallback
            remainingNotes.push(fundamental);
          }
          const previousNote = previousVoices![voice as keyof Voices];
          const distances = remainingNotes.map(note => ({
            note: note + '/' + (voice === 'soprano' || voice === 'contralto' ? '4' : '3'),
            distance: getSemitoneDistance(previousNote, note + '/' + (voice === 'soprano' || voice === 'contralto' ? '4' : '3'))
          }));
          distances.sort((a, b) => a.distance - b.distance);

          let preferredNote: { note: string, distance: number } | undefined;
          if (voice === 'soprano') {
            preferredNote = distances.find(d => d.note.startsWith(third));
          }
          const selectedNote = preferredNote || distances[0];
          voices[voice as keyof Voices] = adjustOctave(
            selectedNote.note,
            tessitura[voice as keyof typeof tessitura].min,
            tessitura[voice as keyof typeof tessitura].max,
            voice,
            previousNote
          );
          assignedNotes.add(selectedNote.note.split('/')[0]);
          remainingNotes = remainingNotes.filter(note => note !== selectedNote.note.split('/')[0]);
        });

        // Garantir que não haja cruzamentos
        const sopranoMidi = noteNames.indexOf(voices.soprano.split('/')[0]) + (parseInt(voices.soprano.split('/')[1]) * 12);
        let contraltoMidi = noteNames.indexOf(voices.contralto.split('/')[0]) + (parseInt(voices.contralto.split('/')[1]) * 12);
        let tenorMidi = noteNames.indexOf(voices.tenor.split('/')[0]) + (parseInt(voices.tenor.split('/')[1]) * 12);

        if (sopranoMidi <= contraltoMidi) {
          const newOctave = parseInt(voices.contralto.split('/')[1]) - 1;
          voices.contralto = `${voices.contralto.split('/')[0]}/${newOctave}`;
          contraltoMidi = noteNames.indexOf(voices.contralto.split('/')[0]) + (newOctave * 12);
        }
        if (contraltoMidi <= tenorMidi) {
          const newOctave = parseInt(voices.tenor.split('/')[1]) - 1;
          voices.tenor = `${voices.tenor.split('/')[0]}/${newOctave}`;
        }
      }

      previousVoices = voices;
      resultVoices.push(voices);
    }

    return resultVoices;
  }
}