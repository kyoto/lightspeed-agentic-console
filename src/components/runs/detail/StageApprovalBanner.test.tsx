// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import { StageApprovalBanner } from './StageApprovalBanner';
import { fireEvent, renderWithProviders, screen, waitFor, within } from '../../../test-render';

type Props = Parameters<typeof StageApprovalBanner>[0];

const renderBanner = (props: Partial<Props> = {}) => {
  const onApprove = props.onApprove ?? vi.fn().mockResolvedValue(true);
  const onClearError = props.onClearError ?? vi.fn();
  renderWithProviders(
    <StageApprovalBanner
      canApprove={true}
      canApproveLoading={false}
      mutationError={undefined}
      mutationInProgress={false}
      stageType="Analysis"
      {...props}
      onApprove={onApprove}
      onClearError={onClearError}
    />,
  );
  return { onApprove, onClearError };
};

const openModal = () => fireEvent.click(screen.getByRole('button', { name: 'Approve Analysis' }));

describe('StageApprovalBanner', () => {
  test('renders the approval alert and a stage-labeled approve button', () => {
    renderBanner();
    expect(screen.getByText('Waiting for approval')).toBeInTheDocument();
    expect(
      screen.getByText('This stage requires manual approval before it can proceed.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve Analysis' })).toBeInTheDocument();
  });

  test('labels the button with the given stage type', () => {
    renderBanner({ stageType: 'Execution' });
    expect(screen.getByRole('button', { name: 'Approve Execution' })).toBeInTheDocument();
  });

  test('disables the approve button when the user cannot approve', () => {
    renderBanner({ canApprove: false });
    expect(screen.getByRole('button', { name: 'Approve Analysis' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  test('keeps the confirmation modal closed until the button is clicked', () => {
    renderBanner();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('opens the confirmation modal when the approve button is clicked', () => {
    renderBanner();
    openModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Approve Analysis?')).toBeInTheDocument();
  });

  test('calls onApprove and closes the modal when approval succeeds', async () => {
    const { onApprove } = renderBanner();
    openModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve Analysis' }));
    expect(onApprove).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('leaves the modal open when approval is rejected', async () => {
    const { onApprove } = renderBanner({ onApprove: vi.fn().mockResolvedValue(false) });
    openModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Approve Analysis' }));
    await waitFor(() => expect(onApprove).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('clears the error when the modal is dismissed', () => {
    const { onClearError } = renderBanner({ mutationError: 'boom' });
    openModal();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(onClearError).toHaveBeenCalledTimes(1);
  });
});
