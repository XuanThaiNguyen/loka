module.exports = {
  watchman: false,
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
