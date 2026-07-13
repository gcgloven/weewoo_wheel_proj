/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(png|jpg|jpeg|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        paths: { '@/*': ['src/*'] },
        types: ['chrome', 'jest'],
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(puppeteer|puppeteer-core)/)',
  ],
};

export default config;
