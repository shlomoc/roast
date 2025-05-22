// This file can be used for global test setup in the future.
require('@testing-library/jest-dom');

// Node.js 20+ (implied by @types/node^20) should have Request, Response, Headers globally.
// If tests fail due to these being undefined, the Jest environment isn't providing them.
// global.fetch is already mocked in the test file (src/app/api/roast/route.test.ts).
