# ChordProgressionsApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


vamos criar nosso proximo algoritmo que se chamara "Encadeamento com tríades invertidas". 
Regras: 
- materemos as mesmas regras do primeiro algoritmo "Encadeamento das tríades tonais"
- apesar das regras do primeiro algoritmo serem as mesmas, vamos considerar que acordes no estado fundamental, primeira inversão e segunda inversão não são o mesmo acorde, ou seja, qualquer acorde pode aparecer em uma progressão novamente desde que ainda não tenha aparecido
- qualquer acorde pode ser substituido por sua primeira inversão (ou seja a terça no baixo, no caso de Dó maior C/E), menos o primeiro e ultimo acorde (que é o acorde de I grau)
- para o acorde com a segunda inversão (ou seja a quinta no baixo, no caso de Dó maior C/G) não podera ser precedido de um acorde com qualquer inversão
- para o acorde com a segunda inversão pode ser seguido por acordes no estado fundamental e primeira inversão