// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CodeBlockWithClipboard } from './CodeBlockWithClipboard';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-render';

const twentyFiveLines = Array.from({ length: 25 }, (_, i) => `line ${i + 1}`).join('\n');

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  vi.restoreAllMocks();
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
    return;
  }
  Reflect.deleteProperty(navigator, 'clipboard');
});

describe('CodeBlockWithClipboard', () => {
  test('renders the code', () => {
    renderWithProviders(<CodeBlockWithClipboard code="echo hello" />);
    expect(screen.getByText('echo hello')).toBeInTheDocument();
  });

  test('is not expandable when the code fits within maxLines', () => {
    renderWithProviders(<CodeBlockWithClipboard code={'a\nb\nc'} maxLines={20} />);
    expect(screen.queryByText('Show more')).not.toBeInTheDocument();
  });

  test('shows a "Show more" toggle when the code exceeds maxLines', () => {
    renderWithProviders(<CodeBlockWithClipboard code={twentyFiveLines} />);
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  test('toggles between "Show more" and "Show less"', () => {
    renderWithProviders(<CodeBlockWithClipboard code={twentyFiveLines} />);
    fireEvent.click(screen.getByText('Show more'));
    expect(screen.getByText('Show less')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Show less'));
    expect(screen.getByText('Show more')).toBeInTheDocument();
  });

  test('writes the code to the clipboard when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    renderWithProviders(<CodeBlockWithClipboard code="echo hello" />);
    // The copy button's label is tooltip content, not visible text; for
    // non-expandable code it's the only button in the block.
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('echo hello'));
  });

  test('reports a failure when the clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    renderWithProviders(<CodeBlockWithClipboard code="echo hello" />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Failed to copy to clipboard')).toBeInTheDocument();
  });
});
