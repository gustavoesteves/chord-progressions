import { Injectable } from '@angular/core';
import { ProgressionAlgorithm, VoiceLeadingRules } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class DiatonicSeventhsAlgorithm implements ProgressionAlgorithm {
  name = 'Capítulo 2: Sétimas Diatônicas';
  description = 'Introdução das Tétrades. O acréscimo da 7ª gera uma dissonância que demanda resolução. Neste exercício, a regra principal é que a 7ª do acorde (dissonância) deve obrigatoriamente resolver descendo por grau conjunto no próximo acorde.';
  domain: 'Harmonia Clássica' = 'Harmonia Clássica';
  mode: 'Maior' = 'Maior';
  showActiveRules = false;
  defaultRules: Partial<VoiceLeadingRules> = {
    resolveSevenths: true, // Crucial for this chapter
    resolveLeadingTone: false
  };

  generateProgressions(tonality: string, length: number) {
    // Retorna um gerador simplificado de tétrades diatônicas
    return this.generator(tonality, length);
  }

  private *generator(tonality: string, length: number): Generator<{ roman: string[], transposed: string[], notes: string[][], functions: string[][] }> {
    // Lógica simplificada: Imaj7 - vi7 - ii7 - V7 - Imaj7...
    const progressaoBase = [
      { roman: 'Imaj7', transposed: tonality, notes: ['C', 'E', 'G', 'B'], functions: ['Tônica'] },
      { roman: 'vi7', transposed: 'Am', notes: ['A', 'C', 'E', 'G'], functions: ['Submediante'] },
      { roman: 'ii7', transposed: 'Dm', notes: ['D', 'F', 'A', 'C'], functions: ['SuperTônica'] },
      { roman: 'V7', transposed: 'G', notes: ['G', 'B', 'D', 'F'], functions: ['Dominante'] },
    ];

    while (true) {
      const roman: string[] = [];
      const transposed: string[] = [];
      const notes: string[][] = [];
      const functions: string[][] = [];

      for (let i = 0; i < length; i++) {
        // Pega a progressão base em loop
        const acorde = progressaoBase[i % progressaoBase.length];
        
        roman.push(acorde.roman);
        transposed.push(acorde.transposed);
        notes.push([...acorde.notes]); 
        functions.push([...acorde.functions]);
      }
      
      yield { roman, transposed, notes, functions };
    }
  }
}
