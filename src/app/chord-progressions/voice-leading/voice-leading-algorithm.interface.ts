export interface VoiceLeadingAlgorithmInterface {
  applyVoiceLeading(progression: { roman: string[], transposed: string[], notes: string[][], functions: string[][] }): { soprano: string, contralto: string, tenor: string, baixo: string }[];
}