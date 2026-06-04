import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  passWithNoTests: true,
  collectCoverageFrom: ['src/**/*.ts'],
};

export default config;
