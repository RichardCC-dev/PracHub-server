/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  testTimeout: 30000,
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/', '/src/migrations/'],
  // Mockear dependencias con ESM (no compatibles con Jest en modo CJS)
  moduleNameMapper: {
    '^puppeteer$': '<rootDir>/tests/__mocks__/puppeteer.js',
    '^puppeteer-core$': '<rootDir>/tests/__mocks__/puppeteer.js',
    '^natural$': '<rootDir>/tests/__mocks__/natural.js',
  },
};
