// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import PreviewBadge from './PreviewBadge';
import { renderWithProviders, screen } from '../test-render';

describe('PreviewBadge', () => {
  test('renders the dev preview label', () => {
    renderWithProviders(<PreviewBadge />);
    expect(screen.getByText('Dev preview')).toBeInTheDocument();
  });
});
