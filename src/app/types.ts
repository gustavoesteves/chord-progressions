export interface Voices {
    soprano: string;
    contralto: string;
    tenor: string;
    baixo: string;
}

export interface Tessitura {
    min: number;
    max: number;
    clef: string; // Ex.: "G" (clave de sol), "F" (clave de fá), "C" (clave de dó)
    staff: number; // Número da pauta (ex.: 1, 2, 3, 4)
}

export interface Formation {
    name: string;
    tessituras: {
        baixo: Tessitura;
        tenor: Tessitura;
        contralto: Tessitura;
        soprano: Tessitura;
    };
}

export interface Tessituras {
    baixo: Tessitura;
    tenor: Tessitura;
    contralto: Tessitura;
    soprano: Tessitura;
}

export interface ProgressionAlgorithm {
    name: string;
    generateProgressions: (tonality: string, length: number) => { roman: string[], transposed: string[], notes: string[][], functions: string[][] }[] | Iterator<{ roman: string[], transposed: string[], notes: string[][], functions: string[][] }>;
}

export interface VoiceLeadingAlgorithmInterface {
    applyVoiceLeading(
        progression: { roman: string[], transposed: string[], notes: string[][] },
        tessituras?: Tessituras
    ): Voices[];
}