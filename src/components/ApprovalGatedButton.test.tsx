// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';
import { ApprovalGatedButton } from './ApprovalGatedButton';
import { fireEvent, renderWithProviders, screen } from '../test-render';

const renderButton = (props: Partial<Parameters<typeof ApprovalGatedButton>[0]> = {}) => {
  const onClick = vi.fn();
  renderWithProviders(
    <ApprovalGatedButton canApprove={true} onClick={onClick} {...props}>
      Approve
    </ApprovalGatedButton>,
  );
  return { onClick };
};

describe('ApprovalGatedButton', () => {
  test('renders the children as the button label', () => {
    renderButton();
    expect(screen.getByText('Approve')).toBeInTheDocument();
  });

  test('calls onClick when enabled and clicked', () => {
    const { onClick } = renderButton();
    fireEvent.click(screen.getByText('Approve').closest('button') as HTMLButtonElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test('is aria-disabled when the user cannot approve', () => {
    renderButton({ canApprove: false });
    expect(screen.getByText('Approve').closest('button')).toHaveAttribute('aria-disabled', 'true');
  });

  test('does not call onClick when the user cannot approve', () => {
    const { onClick } = renderButton({ canApprove: false });
    fireEvent.click(screen.getByText('Approve').closest('button') as HTMLButtonElement);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('is aria-disabled while a mutation is in progress', () => {
    renderButton({ mutationInProgress: true });
    expect(screen.getByText('Approve').closest('button')).toHaveAttribute('aria-disabled', 'true');
  });

  test('shows the permission tooltip on hover when the user cannot approve', async () => {
    renderButton({ canApprove: false });
    fireEvent.mouseEnter(screen.getByText('Approve').closest('button') as HTMLButtonElement);
    expect(
      await screen.findByText("You don't have permission to approve or deny runs."),
    ).toBeInTheDocument();
  });

  test('does not show the tooltip on hover when the user can approve', () => {
    renderButton({ canApprove: true });
    fireEvent.mouseEnter(screen.getByText('Approve').closest('button') as HTMLButtonElement);
    expect(
      screen.queryByText("You don't have permission to approve or deny runs."),
    ).not.toBeInTheDocument();
  });
});
