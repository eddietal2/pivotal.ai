/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

/** @type {import('jest').Config} */
const config = {
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,
  
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: "v8",

  // The test environment that will be used for testing
  testEnvironment: "jest-environment-jsdom",

  // === START: FIX FOR NEXT.JS PATH ALIASES AND MODULE RESOLUTION ===

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: [
    "node_modules",
    "<rootDir>" // Allows Jest to search relative to the project root
  ],

  // A map from regular expressions to module names or to arrays of module names 
  // that resolve path aliases and mock non-JS files.
  moduleNameMapper: {
    // 1. Resolve Next.js path aliases (e.g., '@/components/...' maps to '<rootDir>/components/...')
    // This is the CRITICAL fix for the 'Cannot find module "@/components/ui/CandleStickAnim"' error.
    '^@/(.*)$': '<rootDir>/$1',

    // 2. Mock asset imports (CSS, images, etc.) that Jest cannot process
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
  },

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    "\\\\node_modules\\\\",
    "\\.pnp\\.[^\\\\]+$",
    "\\.next" // Ignore Next.js build directories
  ],

  // === END: FIX FOR NEXT.JS PATH ALIASES AND MODULE RESOLUTION ===
};

module.exports = config;