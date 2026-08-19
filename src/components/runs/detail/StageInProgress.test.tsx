// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { StageInProgress } from './StageInProgress';
import { renderWithProviders, screen } from '../../../test-render';

describe('StageInProgress', () => {
  test('renders the title and the stage log viewer', () => {
    renderWithProviders(
      <StageInProgress sandbox={{ namespace: 'ns', podName: 'pod' }} title="Execution" />,
    );
    expect(screen.getByRole('heading', { name: 'Execution' })).toBeInTheDocument();
    expect(screen.getByText('View Execution logs')).toBeInTheDocument();
  });
});
