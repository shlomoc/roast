module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/*.test.tsx', '**/*.test.ts'],
  moduleNameMapper: {
    // Handle CSS imports (if any)
    '\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'] // Optional: for setup files
};
