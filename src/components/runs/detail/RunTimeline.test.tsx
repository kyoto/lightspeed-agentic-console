// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { TimelineEvent } from '../../../models/agenticrun-views';
import { RunTimeline } from './RunTimeline';
import { fireEvent, renderWithProviders, screen } from '../../../test-render';

const events: TimelineEvent[] = [
  {
    description: 'Run created',
    label: 'Pending',
    timestamp: '2026-08-19T10:00:00Z',
    variant: 'success',
  },
  { isCurrent: true, label: 'Analyzing', variant: 'info' },
];

describe('RunTimeline', () => {
  test('renders collapsed by default', () => {
    renderWithProviders(<RunTimeline events={events} />);
    expect(screen.getByRole('button', { name: /Timeline/ })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('reveals the steps, timestamps, and descriptions when expanded', () => {
    renderWithProviders(<RunTimeline events={events} />);
    fireEvent.click(screen.getByRole('button', { name: /Timeline/ }));
    expect(screen.getByRole('button', { name: /Timeline/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Analyzing')).toBeInTheDocument();
    expect(screen.getByText('2026-08-19T10:00:00Z')).toBeInTheDocument();
    expect(screen.getByText(/Run created/)).toBeInTheDocument();
  });
});
