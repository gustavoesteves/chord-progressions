import { Injectable } from '@angular/core';
import { ProgressionAlgorithm, VoiceLeadingRules } from '../../types';

@Injectable({
  providedIn: 'root'
})
export class SecondaryDominantsAlgorithm implements ProgressionAlgorithm {
  name = 'Capítulo 3: Dominantes Secundárias';
  description = 'Expandindo a tonalidade: acordes ganham "vontade própria" ao receberem suas próprias dominantes. Aqui treina-se a alteração cromática e a obrigatoriedade da Sensível (terça da dominante) resolver subindo para a fundamental do acorde alvo.';
  domain: 'Harmonia Clássica' = 'Harmonia Clássica';
  mode: 'Maior' = 'Maior';
  showActiveRules = false;
  defaultRules: Partial<VoiceLeadingRules> = {
    resolveSevenths: true,
    resolveLeadingTone: true // Crucial for dominants
  };

  generateProgressions(tonality: string, length: number) {
    return this.generator(tonality, length);
  }

  private *generator(tonality: string, length: number): Generator<{ roman: string[], transposed: string[], notes: string[][], functions: string[][] }> {
    // Exemplo: I - V7/IV - IV - V7 - I
    const progressaoBase = [
      { roman: 'I', transposed: tonality, notes: ['C', 'E', 'G', 'C'], functions: ['Tônica'] },
      { roman: 'V7/IV', transposed: 'C7', notes: ['C', 'E', 'G', 'Bb'], functions: ['Dominante Secundária'] },
      { roman: 'IV', transposed: 'F', notes: ['F', 'A', 'C', 'F'], functions: ['Subdominante'] },
      { roman: 'V', transposed: 'G', notes: ['G', 'B', 'D', 'G'], functions: ['Dominante'] },
    ];

    while (true) {
      const roman: string[] = [];
      const transposed: string[] = [];
      const notes: string[][] = [];
      const functions: string[][] = [];

      for (let i = 0; i < length; i++) {
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
