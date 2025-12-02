// Mock window.matchMedia because it is not implemented in JSDOM (Jest's default test environment)
// This is necessary for components that rely on checking system color schemes (like ThemeProvider).

// Check if window is defined (to satisfy Next.js server-side checks if this file runs early)
if (typeof window !== 'undefined') {
  // If matchMedia is not defined, define a mock version.
  if (typeof window.matchMedia === 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        // You can adjust 'matches' to 'true' or 'false' if you want tests to default to dark or light, respectively
        matches: query.includes('dark'), 
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }),
    });
  }
}