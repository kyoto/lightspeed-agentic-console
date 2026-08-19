// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { RunPhaseLabel } from './RunPhaseLabel';
import { renderWithProviders, screen } from '../../../test-render';

describe('RunPhaseLabel', () => {
  test('renders the display label for a known phase', () => {
    renderWithProviders(<RunPhaseLabel phase="Completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  test('maps a multi-word phase to its display label', () => {
    renderWithProviders(<RunPhaseLabel phase="EmergencyStopped" />);
    expect(screen.getByText('Emergency stopped')).toBeInTheDocument();
  });

  test('falls back to the raw phase for an unknown value', () => {
    renderWithProviders(<RunPhaseLabel phase={'Surprise' as never} />);
    expect(screen.getByText('Surprise')).toBeInTheDocument();
  });
});
