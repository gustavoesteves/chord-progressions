# Chord Progressions App
Uma aplicação Angular para gerar progressões de acordes com condução de vozes e renderização de partituras em MusicXML.

## Pré-requisitos

- Node.js (versão 18.x ou superior)
- Angular CLI (npm install -g @angular/cli)
- Git

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gustavoesteves/chord-progressions.git
cd chord-progressions-app
```

2. Instale as dependências:
```bash
npm install
```
3. Inicie o servidor de desenvolvimento:
```bash
ng serve
```
4. Acesse a aplicação em [http://localhost:4200].

## Funcionalidades

- Geração de progressões de acordes com algoritmos configuráveis.
- Condução de vozes com prioridade à tessitura.
- Renderização de partituras usando OpenSheetMusicDisplay.
- Exportação de partituras em formato MusicXML.
- Suporte a diferentes formações (Piano, Violão, Quarteto de Cordas, Quarteto Vocal) com configurações de tessituras, claves e pautas.

## Estrutura do Projeto

- src/app/app.component.ts: Componente principal que coordena a interface e a lógica da aplicação.
- src/app/chord-progressions/voice-leading/voice-leading-algorithm.ts: Implementa a lógica de condução de vozes, incluindo otimização de trajetos e prioridade de tessituras.
- src/app/score-display/: Contém componentes para renderização (score-display.component.ts) e exportação (music-xml-export.component.ts) de partituras.
- src/app/types.ts: Define interfaces como Formation, Voices, e Tessituras.
- src/app/chord-progressions/chord-progressions.service.ts: Serviço para geração de progressões de acordes.
- .gitignore: Exclui arquivos desnecessários, como node_modules e .angular/cache.

## Contribuição

1. Faça um fork do repositório.
2. Crie uma branch para sua feature: 
```bash
git checkout -b minha-feature
```
3. Commit suas mudanças: 
```bash 
git commit -m "Adiciona minha feature"
```
4. Envie para o GitHub: 
```bash
git push origin minha-feature.
```
5. Abra um Pull Request.

Licença
[MIT License]
