export interface ProgressionAlgorithm {
  name: string;
  generateProgressions(
    tonality: string,
    progressionLength: number
  ): Generator<
    { 
      roman: string[], 
      transposed: string[], 
      notes: string[][], 
      voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] 
    }, 
    void, 
    undefined
  > | { 
      roman: string[], 
      transposed: string[], 
      notes: string[][], 
      voices?: { soprano: string, contralto: string, tenor: string, baixo: string }[] 
    }[];
}