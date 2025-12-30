// Jest setup file for global test configuration

// Increase timeout for integration tests if needed
jest.setTimeout(10000);

// Suppress console logs during tests (optional - comment out to see logs)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Clean up after all tests
afterAll(() => {
  jest.clearAllMocks();
});
