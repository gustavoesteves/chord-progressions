import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Vex from 'vexflow';

@Component({
  selector: 'app-score-display',
  template: `
    <div #scoreContainer></div>
  `,
  styleUrls: ['./score-display.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ScoreDisplayComponent implements AfterViewInit, OnChanges {
  @Input() progression: { roman: string[], transposed: string[], notes: string[][], voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] } | null = null;
  @Input() formation: string = 'piano';
  @ViewChild('scoreContainer', { static: true }) scoreContainer!: ElementRef<HTMLDivElement>;

  private VF = Vex;
  private renderer: any;
  private context: any;

  ngAfterViewInit(): void {
    this.setupVexFlow();
    if (this.progression) {
      this.renderScore();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['progression'] && this.progression) || changes['formation']) {
      this.setupVexFlow();
      this.renderScore();
    }
  }

  private setupVexFlow(): void {
    const div = this.scoreContainer.nativeElement;
    div.innerHTML = '';
    this.renderer = new this.VF.Renderer(div, this.VF.Renderer.Backends.SVG);
    this.context = this.renderer.getContext();
    this.context.setFillStyle('#000');
    this.context.setStrokeStyle('#000');
  }

  private renderScore(): void {
    if (!this.progression || !this.context) {
      console.error('Progression or context not available:', { progression: this.progression, context: this.context });
      return;
    }

    this.context.clear();
    const { voices, notes } = this.progression;

    if (voices && voices.length > 0) {
      const staveWidth = 150 * voices.length;
      const height = this.formation === 'piano' ? 350 : this.formation === 'violão' ? 200 : 550;
      this.renderer.resize(staveWidth + 50, height);

      if (this.formation === 'piano') {
        this.renderPianoScore(voices);
      } else if (this.formation === 'violão') {
        this.renderGuitarScore(voices);
      } else if (this.formation === 'quarteto de cordas') {
        this.renderStringQuartetScore(voices);
      } else if (this.formation === 'quarteto vocal') {
        this.renderVocalQuartetScore(voices);
      }
    } else if (notes && notes.length > 0) {
      const staveWidth = 150 * notes.length;
      const height = this.formation === 'piano' ? 350 : this.formation === 'violão' ? 200 : 550;
      this.renderer.resize(staveWidth + 50, height);

      if (this.formation === 'piano') {
        this.renderPianoScoreWithNotes(notes);
      } else if (this.formation === 'violão') {
        this.renderGuitarScoreWithNotes(notes);
      } else if (this.formation === 'quarteto de cordas') {
        this.renderStringQuartetScoreWithNotes(notes);
      } else if (this.formation === 'quarteto vocal') {
        this.renderVocalQuartetScoreWithNotes(notes);
      }
    }
  }

  private renderPianoScore(voices: { soprano: string, contralto: string, tenor: string, baixo: string }[]): void {
    const staveTreble = new this.VF.Stave(10, 20, 150 * voices.length);
    staveTreble.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 180, 150 * voices.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesTreble: any[] = [];
    const voicesBass: any[] = [];

    voices.forEach((voice) => {
      const duration = 'w';
      const keysTreble = [voice.soprano, voice.contralto];
      const keysBass = [voice.tenor, voice.baixo];

      const chordTreble = new this.VF.StaveNote({ clef: 'treble', keys: keysTreble, duration });
      const chordBass = new this.VF.StaveNote({ clef: 'bass', keys: keysBass, duration });

      voicesTreble.push(chordTreble);
      voicesBass.push(chordBass);
    });

    const voiceTreble = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceTreble.addTickables(voicesTreble);
    const voiceBass = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceBass.addTickables(voicesBass);

    const formatter = new this.VF.Formatter().joinVoices([voiceTreble]).format([voiceTreble], 150 * voices.length);
    voiceTreble.draw(this.context, staveTreble);

    const formatterBass = new this.VF.Formatter().joinVoices([voiceBass]).format([voiceBass], 150 * voices.length);
    voiceBass.draw(this.context, staveBass);

    for (let i = 1; i < voices.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveTreble.getYForLine(0));
      this.context.lineTo(xPosition, staveTreble.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveBass.getYForLine(0));
      this.context.lineTo(xPosition, staveBass.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderPianoScoreWithNotes(notes: string[][]): void {
    const staveTreble = new this.VF.Stave(10, 20, 150 * notes.length);
    staveTreble.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 180, 150 * notes.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesTreble: any[] = [];
    const voicesBass: any[] = [];

    notes.forEach((chordNotes) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes', chordNotes);
        return;
      }

      const duration = 'w';
      const keysTreble = [chordNotes[2], chordNotes[1]];
      const keysBass = [chordNotes[3], chordNotes[0]];

      const chordTreble = new this.VF.StaveNote({ clef: 'treble', keys: keysTreble, duration });
      const chordBass = new this.VF.StaveNote({ clef: 'bass', keys: keysBass, duration });

      voicesTreble.push(chordTreble);
      voicesBass.push(chordBass);
    });

    const voiceTreble = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceTreble.addTickables(voicesTreble);
    const voiceBass = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceBass.addTickables(voicesBass);

    const formatter = new this.VF.Formatter().joinVoices([voiceTreble]).format([voiceTreble], 150 * notes.length);
    voiceTreble.draw(this.context, staveTreble);

    const formatterBass = new this.VF.Formatter().joinVoices([voiceBass]).format([voiceBass], 150 * notes.length);
    voiceBass.draw(this.context, staveBass);

    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveTreble.getYForLine(0));
      this.context.lineTo(xPosition, staveTreble.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveBass.getYForLine(0));
      this.context.lineTo(xPosition, staveBass.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderGuitarScore(voices: { soprano: string, contralto: string, tenor: string, baixo: string }[]): void {
    const stave = new this.VF.Stave(10, 20, 150 * voices.length);
    stave.addClef('treble').setContext(this.context).draw();

    const voiceNotes: any[] = [];
    voices.forEach((voice) => {
      const duration = 'w';
      const keys = [voice.baixo];
      const chord = new this.VF.StaveNote({ clef: 'treble', keys, duration })
        .addModifier(new this.VF.Annotation(`${voice.soprano}-${voice.contralto}-${voice.tenor}-${voice.baixo}`));
      voiceNotes.push(chord);
    });

    const voice = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voice.addTickables(voiceNotes);
    const formatter = new this.VF.Formatter().joinVoices([voice]).format([voice], 150 * voices.length);
    voice.draw(this.context, stave);

    for (let i = 1; i < voices.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, stave.getYForLine(0));
      this.context.lineTo(xPosition, stave.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderGuitarScoreWithNotes(notes: string[][]): void {
    const stave = new this.VF.Stave(10, 20, 150 * notes.length);
    stave.addClef('treble').setContext(this.context).draw();

    const voiceNotes: any[] = [];
    notes.forEach((chordNotes) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes', chordNotes);
        return;
      }

      const duration = 'w';
      const keys = [chordNotes[0]];
      const chord = new this.VF.StaveNote({ clef: 'treble', keys, duration })
        .addModifier(new this.VF.Annotation(chordNotes.join('-')));
      voiceNotes.push(chord);
    });

    const voice = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voice.addTickables(voiceNotes);
    const formatter = new this.VF.Formatter().joinVoices([voice]).format([voice], 150 * notes.length);
    voice.draw(this.context, stave);

    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, stave.getYForLine(0));
      this.context.lineTo(xPosition, stave.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderStringQuartetScore(voices: { soprano: string, contralto: string, tenor: string, baixo: string }[]): void {
    const staveViolin1 = new this.VF.Stave(10, 20, 150 * voices.length);
    staveViolin1.addClef('treble').setContext(this.context).draw();
    const staveViolin2 = new this.VF.Stave(10, 120, 150 * voices.length);
    staveViolin2.addClef('treble').setContext(this.context).draw();
    const staveViola = new this.VF.Stave(10, 220, 150 * voices.length);
    staveViola.addClef('alto').setContext(this.context).draw();
    const staveCello = new this.VF.Stave(10, 320, 150 * voices.length);
    staveCello.addClef('bass').setContext(this.context).draw();

    const voicesViolin1: any[] = [];
    const voicesViolin2: any[] = [];
    const voicesViola: any[] = [];
    const voicesCello: any[] = [];

    voices.forEach((voice) => {
      const duration = 'w';
      const noteViolin1 = new this.VF.StaveNote({ clef: 'treble', keys: [voice.soprano], duration });
      const noteViolin2 = new this.VF.StaveNote({ clef: 'treble', keys: [voice.contralto], duration });
      const noteViola = new this.VF.StaveNote({ clef: 'alto', keys: [voice.tenor], duration });
      const noteCello = new this.VF.StaveNote({ clef: 'bass', keys: [voice.baixo], duration });

      voicesViolin1.push(noteViolin1);
      voicesViolin2.push(noteViolin2);
      voicesViola.push(noteViola);
      voicesCello.push(noteCello);
    });

    const voiceViolin1 = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceViolin1.addTickables(voicesViolin1);
    const voiceViolin2 = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceViolin2.addTickables(voicesViolin2);
    const voiceViola = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceViola.addTickables(voicesViola);
    const voiceCello = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceCello.addTickables(voicesCello);

    const formatterViolin1 = new this.VF.Formatter().joinVoices([voiceViolin1]).format([voiceViolin1], 150 * voices.length);
    voiceViolin1.draw(this.context, staveViolin1);
    const formatterViolin2 = new this.VF.Formatter().joinVoices([voiceViolin2]).format([voiceViolin2], 150 * voices.length);
    voiceViolin2.draw(this.context, staveViolin2);
    const formatterViola = new this.VF.Formatter().joinVoices([voiceViola]).format([voiceViola], 150 * voices.length);
    voiceViola.draw(this.context, staveViola);
    const formatterCello = new this.VF.Formatter().joinVoices([voiceCello]).format([voiceCello], 150 * voices.length);
    voiceCello.draw(this.context, staveCello);

    for (let i = 1; i < voices.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveViolin1.getYForLine(0));
      this.context.lineTo(xPosition, staveViolin1.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveViolin2.getYForLine(0));
      this.context.lineTo(xPosition, staveViolin2.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveViola.getYForLine(0));
      this.context.lineTo(xPosition, staveViola.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveCello.getYForLine(0));
      this.context.lineTo(xPosition, staveCello.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderStringQuartetScoreWithNotes(notes: string[][]): void {
    const staveViolin1 = new this.VF.Stave(10, 20, 150 * notes.length);
    staveViolin1.addClef('treble').setContext(this.context).draw();
    const staveViolin2 = new this.VF.Stave(10, 120, 150 * notes.length);
    staveViolin2.addClef('treble').setContext(this.context).draw();
    const staveViola = new this.VF.Stave(10, 220, 150 * notes.length);
    staveViola.addClef('alto').setContext(this.context).draw();
    const staveCello = new this.VF.Stave(10, 320, 150 * notes.length);
    staveCello.addClef('bass').setContext(this.context).draw();

    const voicesViolin1: any[] = [];
    const voicesViolin2: any[] = [];
    const voicesViola: any[] = [];
    const voicesCello: any[] = [];

    notes.forEach((chordNotes) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes', chordNotes);
        return;
      }

      const duration = 'w';
      const noteViolin1 = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[3]], duration });
      const noteViolin2 = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[2]], duration });
      const noteViola = new this.VF.StaveNote({ clef: 'alto', keys: [chordNotes[1]], duration });
      const noteCello = new this.VF.StaveNote({ clef: 'bass', keys: [chordNotes[0]], duration });

      voicesViolin1.push(noteViolin1);
      voicesViolin2.push(noteViolin2);
      voicesViola.push(noteViola);
      voicesCello.push(noteCello);
    });

    const voiceViolin1 = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceViolin1.addTickables(voicesViolin1);
    const voiceViolin2 = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceViolin2.addTickables(voicesViolin2);
    const voiceViola = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceViola.addTickables(voicesViola);
    const voiceCello = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceCello.addTickables(voicesCello);

    const formatterViolin1 = new this.VF.Formatter().joinVoices([voiceViolin1]).format([voiceViolin1], 150 * notes.length);
    voiceViolin1.draw(this.context, staveViolin1);
    const formatterViolin2 = new this.VF.Formatter().joinVoices([voiceViolin2]).format([voiceViolin2], 150 * notes.length);
    voiceViolin2.draw(this.context, staveViolin2);
    const formatterViola = new this.VF.Formatter().joinVoices([voiceViola]).format([voiceViola], 150 * notes.length);
    voiceViola.draw(this.context, staveViola);
    const formatterCello = new this.VF.Formatter().joinVoices([voiceCello]).format([voiceCello], 150 * notes.length);
    voiceCello.draw(this.context, staveCello);

    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveViolin1.getYForLine(0));
      this.context.lineTo(xPosition, staveViolin1.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveViolin2.getYForLine(0));
      this.context.lineTo(xPosition, staveViolin2.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveViola.getYForLine(0));
      this.context.lineTo(xPosition, staveViola.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveCello.getYForLine(0));
      this.context.lineTo(xPosition, staveCello.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderVocalQuartetScore(voices: { soprano: string, contralto: string, tenor: string, baixo: string }[]): void {
    const staveSoprano = new this.VF.Stave(10, 20, 150 * voices.length);
    staveSoprano.addClef('treble').setContext(this.context).draw();
    const staveAlto = new this.VF.Stave(10, 120, 150 * voices.length);
    staveAlto.addClef('treble').setContext(this.context).draw();
    const staveTenor = new this.VF.Stave(10, 220, 150 * voices.length);
    staveTenor.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 320, 150 * voices.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesSoprano: any[] = [];
    const voicesAlto: any[] = [];
    const voicesTenor: any[] = [];
    const voicesBass: any[] = [];

    voices.forEach((voice) => {
      const duration = 'w';
      const noteSoprano = new this.VF.StaveNote({ clef: 'treble', keys: [voice.soprano], duration });
      const noteAlto = new this.VF.StaveNote({ clef: 'treble', keys: [voice.contralto], duration });
      const noteTenor = new this.VF.StaveNote({ clef: 'treble', keys: [voice.tenor], duration });
      const noteBass = new this.VF.StaveNote({ clef: 'bass', keys: [voice.baixo], duration });

      voicesSoprano.push(noteSoprano);
      voicesAlto.push(noteAlto);
      voicesTenor.push(noteTenor);
      voicesBass.push(noteBass);
    });

    const voiceSoprano = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceSoprano.addTickables(voicesSoprano);
    const voiceAlto = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceAlto.addTickables(voicesAlto);
    const voiceTenor = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceTenor.addTickables(voicesTenor);
    const voiceBass = new this.VF.Voice({ numBeats: voices.length * 4, beatValue: 4 });
    voiceBass.addTickables(voicesBass);

    const formatterSoprano = new this.VF.Formatter().joinVoices([voiceSoprano]).format([voiceSoprano], 150 * voices.length);
    voiceSoprano.draw(this.context, staveSoprano);
    const formatterAlto = new this.VF.Formatter().joinVoices([voiceAlto]).format([voiceAlto], 150 * voices.length);
    voiceAlto.draw(this.context, staveAlto);
    const formatterTenor = new this.VF.Formatter().joinVoices([voiceTenor]).format([voiceTenor], 150 * voices.length);
    voiceTenor.draw(this.context, staveTenor);
    const formatterBass = new this.VF.Formatter().joinVoices([voiceBass]).format([voiceBass], 150 * voices.length);
    voiceBass.draw(this.context, staveBass);

    for (let i = 1; i < voices.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveSoprano.getYForLine(0));
      this.context.lineTo(xPosition, staveSoprano.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveAlto.getYForLine(0));
      this.context.lineTo(xPosition, staveAlto.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveTenor.getYForLine(0));
      this.context.lineTo(xPosition, staveTenor.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveBass.getYForLine(0));
      this.context.lineTo(xPosition, staveBass.getYForLine(4));
      this.context.stroke();
    }
  }

  private renderVocalQuartetScoreWithNotes(notes: string[][]): void {
    const staveSoprano = new this.VF.Stave(10, 20, 150 * notes.length);
    staveSoprano.addClef('treble').setContext(this.context).draw();
    const staveAlto = new this.VF.Stave(10, 120, 150 * notes.length);
    staveAlto.addClef('treble').setContext(this.context).draw();
    const staveTenor = new this.VF.Stave(10, 220, 150 * notes.length);
    staveTenor.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 320, 150 * notes.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesSoprano: any[] = [];
    const voicesAlto: any[] = [];
    const voicesTenor: any[] = [];
    const voicesBass: any[] = [];

    notes.forEach((chordNotes) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes', chordNotes);
        return;
      }

      const duration = 'w';
      const noteSoprano = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[3]], duration });
      const noteAlto = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[2]], duration });
      const noteTenor = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[1]], duration });
      const noteBass = new this.VF.StaveNote({ clef: 'bass', keys: [chordNotes[0]], duration });

      voicesSoprano.push(noteSoprano);
      voicesAlto.push(noteAlto);
      voicesTenor.push(noteTenor);
      voicesBass.push(noteBass);
    });

    const voiceSoprano = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceSoprano.addTickables(voicesSoprano);
    const voiceAlto = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceAlto.addTickables(voicesAlto);
    const voiceTenor = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceTenor.addTickables(voicesTenor);
    const voiceBass = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voiceBass.addTickables(voicesBass);

    const formatterSoprano = new this.VF.Formatter().joinVoices([voiceSoprano]).format([voiceSoprano], 150 * notes.length);
    voiceSoprano.draw(this.context, staveSoprano);
    const formatterAlto = new this.VF.Formatter().joinVoices([voiceAlto]).format([voiceAlto], 150 * notes.length);
    voiceAlto.draw(this.context, staveAlto);
    const formatterTenor = new this.VF.Formatter().joinVoices([voiceTenor]).format([voiceTenor], 150 * notes.length);
    voiceTenor.draw(this.context, staveTenor);
    const formatterBass = new this.VF.Formatter().joinVoices([voiceBass]).format([voiceBass], 150 * notes.length);
    voiceBass.draw(this.context, staveBass);

    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, staveSoprano.getYForLine(0));
      this.context.lineTo(xPosition, staveSoprano.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveAlto.getYForLine(0));
      this.context.lineTo(xPosition, staveAlto.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveTenor.getYForLine(0));
      this.context.lineTo(xPosition, staveTenor.getYForLine(4));
      this.context.stroke();
      this.context.moveTo(xPosition, staveBass.getYForLine(0));
      this.context.lineTo(xPosition, staveBass.getYForLine(4));
      this.context.stroke();
    }
  }
}