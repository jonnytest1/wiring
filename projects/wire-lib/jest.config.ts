import type { Config } from '@jest/types';
const esmModules = [
  '@ngrx',
  '@angular',
  'deepdash-es',
  'ngx-bootstrap',
  'ng-lazyload-image',
  'lodash-es'
];

const config: Config.InitialOptions = {
  verbose: true,
  //  modulePathIgnorePatterns: ["models/test.ts"],
  testRegex: ".+.test.ts",
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.ts$": "babel-jest",
    "^.+\\.a.ts$": "babel-jest",
    "^.+\\.mjs$": "babel-jest"
  },
  transformIgnorePatterns: [`<rootDir>/node_modules/(?!${esmModules.join('|')})`],
  //setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  moduleNameMapper: {
    "@angular/material": "<rootDir>/node_modules/@angular/material"
  }
};
export default config;