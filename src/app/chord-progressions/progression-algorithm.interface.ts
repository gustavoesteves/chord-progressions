export interface ProgressionAlgorithm {
  name: string;
  generateProgressions(
    tonality: string,
    progressionLength: number
  ):
    | { roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] }[]
    | Generator<
        { roman: string[]; transposed: string[]; notes: string[][]; functions: string[][] },
        void,
        undefined
      >;
}