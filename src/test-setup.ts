// Vitest test setup — add global matchers or polyfills here as needed.
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { vi } from 'vitest';

// Mock react-i18next so components render stable, interpolated English strings
// without loading the real i18n resources. t() echoes the key and fills in
// {{placeholders}} from the options object.
vi.mock('react-i18next', () => ({
  Trans: ({ children }: { children: React.ReactNode }): React.ReactNode => children,
  useTranslation: () => ({
    i18n: { changeLanguage: () => Promise.resolve(), language: 'en' },
    t: (key: string, options?: Record<string, unknown>) =>
      options ? key.replace(/{{(\w+)}}/g, (_, name) => String(options[name] ?? '')) : key,
  }),
}));

// Replace SandboxLogViewer with a lightweight stub. The real one renders
// PatternFly's LogViewer, which measures text against a canvas 2D context that
// jsdom does not implement. The stub echoes the toggle text so consumers can
// still assert the viewer is present.
vi.mock('./components/runs/detail/SandboxLogViewer', () => ({
  SandboxLogViewer: ({ title }: { title: string }): React.ReactElement =>
    React.createElement('div', { 'data-test': 'sandbox-log-viewer' }, `View ${title} logs`),
}));

// Stub the execution log-actions hook so ExecutionSummary renders without
// opening a network stream. Tests that care can override the return value.
vi.mock('./hooks/useExecutionLogActions', () => ({
  useExecutionLogActions: vi
    .fn()
    .mockReturnValue({ actions: [], error: undefined, loading: false }),
}));
