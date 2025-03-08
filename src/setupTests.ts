// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom

// Define global test functions to avoid TypeScript errors
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }

  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function expect<T>(actual: T): any;
}

export {};
