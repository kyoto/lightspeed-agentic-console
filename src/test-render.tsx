import type { ReactElement, ReactNode } from 'react';
import { configure, render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// The console plugin convention is data-test (not the default data-testid).
configure({ testIdAttribute: 'data-test' });

// Wraps components in the providers they expect (currently just the router).
// Keep this file separate from test-helpers.ts so node-environment tests can
// import the pure helpers without pulling in @testing-library/react.
const AllProviders = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
