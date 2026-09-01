import type { K8sResourceCommon, WatchK8sResult } from '@openshift-console/dynamic-plugin-sdk';
import type { ReactElement, ReactNode } from 'react';
import { configure, render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// The console plugin convention is data-test (not the default data-testid).
configure({ testIdAttribute: 'data-test' });

// Builds a useK8sWatchResource return tuple, allowing undefined data for
// loading/empty states that the SDK's return type does not model directly.
export const watchResult = <T extends K8sResourceCommon>(
  data: T | undefined,
  loaded: boolean,
  error?: unknown,
): WatchK8sResult<T> => [data as T, loaded, error];

// Wraps components in the providers they expect (currently just the router).
// Keep this file separate from test-helpers.ts so node-environment tests can
// import the pure helpers without pulling in @testing-library/react.
const AllProviders = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
