import { Component, Input, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as Vex from 'vexflow';

@Component({
  selector: 'app-score-display',
  template: '<div #scoreContainer style="width: 100%; overflow-x: auto;"></div>',
  styleUrls: ['./score-display.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ScoreDisplayComponent implements AfterViewInit, OnChanges {
  @Input() progression: { roman: string[], transposed: string[], notes: string[][] } | null = null;
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
    const { notes, roman } = this.progression;
    if (!notes || notes.length === 0) {
      console.error('No notes to render:', notes);
      return;
    }

    const staveWidth = 150 * notes.length;
    const height = this.formation === 'piano' ? 300 : this.formation === 'violão' ? 200 : 500;
    this.renderer.resize(staveWidth + 50, height);

    if (this.formation === 'piano') {
      this.renderPianoScore(notes, roman);
    } else if (this.formation === 'violão') {
      this.renderGuitarScore(notes, roman);
    } else if (this.formation === 'quarteto de cordas') {
      this.renderStringQuartetScore(notes, roman);
    } else if (this.formation === 'quarteto vocal') {
      this.renderVocalQuartetScore(notes, roman);
    }
  }

  private renderPianoScore(notes: string[][], roman: string[]): void {
    const staveTreble = new this.VF.Stave(10, 0, 150 * notes.length);
    staveTreble.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 150, 150 * notes.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesTreble: any[] = [];
    const voicesBass: any[] = [];

    notes.forEach((chordNotes, index) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes at index', index, chordNotes);
        return;
      }

      const duration = 'w';
      const keysTreble = [chordNotes[2], chordNotes[1]]; // Quinta e terça na clave de sol
      const keysBass = [chordNotes[3], chordNotes[0]];   // Fundamental duplicada e fundamental na clave de fá

      const chordTreble = new this.VF.StaveNote({ clef: 'treble', keys: keysTreble, duration });
      const chordBass = new this.VF.StaveNote({ clef: 'bass', keys: keysBass, duration });

      const annotation = new this.VF.Annotation(roman[index])
        .setVerticalJustification(this.VF.Annotation.VerticalJustify.TOP)
        .setFont('Arial', 12, 'bold');
      chordTreble.addModifier(annotation);

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

    // Adicionar barras de compasso manualmente
    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, 0);
      this.context.lineTo(xPosition, 150);
      this.context.stroke();
      this.context.moveTo(xPosition, 150);
      this.context.lineTo(xPosition, 300);
      this.context.stroke();
    }
  }

  private renderGuitarScore(notes: string[][], roman: string[]): void {
    const stave = new this.VF.Stave(10, 0, 150 * notes.length);
    stave.addClef('treble').setContext(this.context).draw();

    const voices: any[] = [];
    notes.forEach((chordNotes, index) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes at index', index, chordNotes);
        return;
      }

      const duration = 'w';
      const keys = [chordNotes[0]];
      const chord = new this.VF.StaveNote({ clef: 'treble', keys, duration })
        .addModifier(new this.VF.Annotation(chordNotes.join('-')));
      const romanAnnotation = new this.VF.Annotation(roman[index])
        .setVerticalJustification(this.VF.Annotation.VerticalJustify.TOP)
        .setFont('Arial', 12, 'bold');
      chord.addModifier(romanAnnotation);
      voices.push(chord);
    });

    const voice = new this.VF.Voice({ numBeats: notes.length * 4, beatValue: 4 });
    voice.addTickables(voices);
    const formatter = new this.VF.Formatter().joinVoices([voice]).format([voice], 150 * notes.length);
    voice.draw(this.context, stave);

    // Adicionar barras de compasso manualmente
    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, 0);
      this.context.lineTo(xPosition, 100);
      this.context.stroke();
    }
  }

  private renderStringQuartetScore(notes: string[][], roman: string[]): void {
    const staveViolin1 = new this.VF.Stave(10, 0, 150 * notes.length);
    staveViolin1.addClef('treble').setContext(this.context).draw();
    const staveViolin2 = new this.VF.Stave(10, 100, 150 * notes.length);
    staveViolin2.addClef('treble').setContext(this.context).draw();
    const staveViola = new this.VF.Stave(10, 200, 150 * notes.length);
    staveViola.addClef('alto').setContext(this.context).draw();
    const staveCello = new this.VF.Stave(10, 300, 150 * notes.length);
    staveCello.addClef('bass').setContext(this.context).draw();

    const voicesViolin1: any[] = [];
    const voicesViolin2: any[] = [];
    const voicesViola: any[] = [];
    const voicesCello: any[] = [];

    notes.forEach((chordNotes, index) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes at index', index, chordNotes);
        return;
      }

      const duration = 'w';
      const noteViolin1 = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[3]], duration });
      const noteViolin2 = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[2]], duration });
      const noteViola = new this.VF.StaveNote({ clef: 'alto', keys: [chordNotes[1]], duration });
      const noteCello = new this.VF.StaveNote({ clef: 'bass', keys: [chordNotes[0]], duration });

      const romanAnnotation = new this.VF.Annotation(roman[index])
        .setVerticalJustification(this.VF.Annotation.VerticalJustify.TOP)
        .setFont('Arial', 12, 'bold');
      noteViolin1.addModifier(romanAnnotation);

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

    // Adicionar barras de compasso manualmente
    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, 0);
      this.context.lineTo(xPosition, 100);
      this.context.stroke();
      this.context.moveTo(xPosition, 100);
      this.context.lineTo(xPosition, 200);
      this.context.stroke();
      this.context.moveTo(xPosition, 200);
      this.context.lineTo(xPosition, 300);
      this.context.stroke();
      this.context.moveTo(xPosition, 300);
      this.context.lineTo(xPosition, 400);
      this.context.stroke();
    }
  }

  private renderVocalQuartetScore(notes: string[][], roman: string[]): void {
    const staveSoprano = new this.VF.Stave(10, 0, 150 * notes.length);
    staveSoprano.addClef('treble').setContext(this.context).draw();
    const staveAlto = new this.VF.Stave(10, 100, 150 * notes.length);
    staveAlto.addClef('treble').setContext(this.context).draw();
    const staveTenor = new this.VF.Stave(10, 200, 150 * notes.length);
    staveTenor.addClef('treble').setContext(this.context).draw();
    const staveBass = new this.VF.Stave(10, 300, 150 * notes.length);
    staveBass.addClef('bass').setContext(this.context).draw();

    const voicesSoprano: any[] = [];
    const voicesAlto: any[] = [];
    const voicesTenor: any[] = [];
    const voicesBass: any[] = [];

    notes.forEach((chordNotes, index) => {
      if (!chordNotes || chordNotes.length < 4) {
        console.error('Invalid chord notes at index', index, chordNotes);
        return;
      }

      const duration = 'w';
      const noteSoprano = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[3]], duration });
      const noteAlto = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[2]], duration });
      const noteTenor = new this.VF.StaveNote({ clef: 'treble', keys: [chordNotes[1]], duration });
      const noteBass = new this.VF.StaveNote({ clef: 'bass', keys: [chordNotes[0]], duration });

      const romanAnnotation = new this.VF.Annotation(roman[index])
        .setVerticalJustification(this.VF.Annotation.VerticalJustify.TOP)
        .setFont('Arial', 12, 'bold');
      noteSoprano.addModifier(romanAnnotation);

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

    // Adicionar barras de compasso manualmente
    for (let i = 1; i < notes.length; i++) {
      const xPosition = 10 + i * 150;
      this.context.beginPath();
      this.context.moveTo(xPosition, 0);
      this.context.lineTo(xPosition, 100);
      this.context.stroke();
      this.context.moveTo(xPosition, 100);
      this.context.lineTo(xPosition, 200);
      this.context.stroke();
      this.context.moveTo(xPosition, 200);
      this.context.lineTo(xPosition, 300);
      this.context.stroke();
      this.context.moveTo(xPosition, 300);
      this.context.lineTo(xPosition, 400);
      this.context.stroke();
    }
  }
}