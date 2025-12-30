/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/controllers/**/*.ts',
    'src/middleware/**/*.ts',
    'src/data/**/*.ts',
    'src/routes/**/*.ts',
    'src/websocket/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    'src/controllers/': {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    'src/middleware/': {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    'src/data/': {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    'src/routes/': {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    'src/websocket/': {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
  },
  verbose: true,
};
