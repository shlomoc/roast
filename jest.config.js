module.exports = {
  // No preset at the top level when using projects
  // No testEnvironment at the top level when using projects
  // No testMatch at the top level when using projects

  projects: [
    // Configuration for API tests (Node.js environment)
    {
      displayName: 'node-tests',
      testMatch: ['<rootDir>/tests/app/api/**/*.test.ts'],
      testEnvironment: 'node',
      preset: 'ts-jest', // Apply ts-jest preset here
      moduleNameMapper: {
        // Handle module aliases (if you have them in tsconfig.json)
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
        // API tests generally don't import CSS
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Common setup, review if node-specific setup is needed
    },
    // Configuration for Component tests (JSDOM environment)
    {
      displayName: 'jsdom-tests',
      testMatch: ['<rootDir>/tests/components/**/*.test.tsx', '<rootDir>/tests/components/**/*.test.ts'],
      testEnvironment: 'jest-environment-jsdom',
      preset: 'ts-jest', // Apply ts-jest preset here
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
          },
        }],
      },
      moduleNameMapper: {
        // Handle CSS imports (if any)
        '\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle module aliases (if you have them in tsconfig.json)
        '^@/components/(.*)$': '<rootDir>/src/components/$1',
        '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
        '^@/app/(.*)$': '<rootDir>/src/app/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Common setup
    },
  ],
};
