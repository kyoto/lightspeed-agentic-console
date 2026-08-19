// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import { ConfirmationModal, ConfirmationModalProps } from './ConfirmationModal';
import { fireEvent, renderWithProviders, screen } from '../test-render';

const renderModal = (props: Partial<ConfirmationModalProps> = {}) => {
  const onAction = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <ConfirmationModal
      actionLabel="Delete"
      actionVariant="danger"
      body="Are you sure?"
      isLoading={false}
      isOpen={true}
      onAction={onAction}
      onClose={onClose}
      title="Delete run"
      {...props}
    />,
  );
  return { onAction, onClose };
};

describe('ConfirmationModal', () => {
  test('renders the title, body, and action label when open', () => {
    renderModal();
    expect(screen.getByText('Delete run')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  test('renders nothing when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Delete run')).not.toBeInTheDocument();
  });

  test('calls onAction when the action button is clicked', () => {
    const { onAction } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when the cancel button is clicked', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('disables both buttons while loading', () => {
    renderModal({ isLoading: true });
    // isLoading injects a spinner that changes the button's accessible name,
    // so match on the visible label text and walk up to the button element.
    expect(screen.getByText('Delete').closest('button')).toBeDisabled();
    expect(screen.getByText('Cancel').closest('button')).toBeDisabled();
  });

  test('renders an error alert when an error is passed', () => {
    renderModal({ error: 'Something went wrong' });
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('renders a ReactNode body as-is', () => {
    renderModal({ body: <span>custom node body</span> });
    expect(screen.getByText('custom node body')).toBeInTheDocument();
  });
});
