// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RemediationOptionView } from '../../../models/agenticrun-views';
import { RemediationOptionCard } from './RemediationOptionCard';
import { fireEvent, renderWithProviders, screen } from '../../../test-render';

const baseOption: RemediationOptionView = {
  actions: [{ command: 'kubectl edit deploy', description: 'Patch the deployment', type: 'patch' }],
  cause: 'Memory limit too low',
  description: 'Increase the memory limit',
  detail: 'Pod was OOMKilled',
  estimatedImpact: 'Minimal downtime expected',
  index: 0,
  reversibility: 'Reversible',
  rollbackCommand: 'kubectl rollout undo',
  rollbackDescription: 'Revert the memory limit',
  title: 'Restart the pod',
};

type Props = Parameters<typeof RemediationOptionCard>[0];

const renderCard = (props: Partial<Props> = {}) => {
  const handlers = {
    onSelect: vi.fn(),
    onToggleExpand: vi.fn(),
  };
  renderWithProviders(
    <RemediationOptionCard
      isExpanded={false}
      isSelected={false}
      option={baseOption}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('RemediationOptionCard', () => {
  test('renders the plan selection radio, title, and reversibility when collapsed', () => {
    renderCard();
    expect(screen.getByText('Select plan 1')).toBeInTheDocument();
    expect(screen.getByText('Restart the pod')).toBeInTheDocument();
    expect(screen.getByText('Reversible')).toBeInTheDocument();
  });

  test('renders the "AI recommended" badge when isRecommended is set', () => {
    renderCard({ isRecommended: true });
    expect(screen.getByText('AI recommended')).toBeInTheDocument();
  });

  test('does not render the "AI recommended" badge by default', () => {
    renderCard();
    expect(screen.queryByText('AI recommended')).not.toBeInTheDocument();
  });

  test('hides the body while collapsed', () => {
    renderCard();
    expect(screen.queryByText('Increase the memory limit')).not.toBeInTheDocument();
  });

  test('renders description, root cause, and estimated impact when expanded', () => {
    renderCard({ isExpanded: true });
    expect(screen.getByText('Increase the memory limit')).toBeInTheDocument();
    expect(screen.getByText('Root cause analysis')).toBeInTheDocument();
    expect(screen.getByText('Memory limit too low')).toBeInTheDocument();
    expect(screen.getByText('Pod was OOMKilled')).toBeInTheDocument();
    expect(screen.getByText('Estimated impact')).toBeInTheDocument();
    expect(screen.getByText('Minimal downtime expected')).toBeInTheDocument();
  });

  test('renders proposed actions and the rollback plan when expanded', () => {
    renderCard({ isExpanded: true });
    expect(screen.getByText('patch')).toBeInTheDocument();
    expect(screen.getByText('Patch the deployment')).toBeInTheDocument();
    expect(screen.getByText('Rollback plan')).toBeInTheDocument();
    expect(screen.getByText('Revert the memory limit')).toBeInTheDocument();
  });

  test('shows "Selected option" and toggles on header click in read-only mode', () => {
    const { onToggleExpand } = renderCard({ readOnly: true });
    expect(screen.getByText('Selected option')).toBeInTheDocument();
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Selected option'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  test('toggles on Enter and Space keydown on the read-only header', () => {
    const { onToggleExpand } = renderCard({ readOnly: true });
    const header = screen.getByRole('button');
    fireEvent.keyDown(header, { key: 'Enter' });
    fireEvent.keyDown(header, { key: ' ' });
    expect(onToggleExpand).toHaveBeenCalledTimes(2);
  });

  test('calls onSelect without expanding when the plan radio is activated', () => {
    const { onSelect, onToggleExpand } = renderCard();
    fireEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onToggleExpand).not.toHaveBeenCalled();
  });

  test('calls onSelect when the reversibility label in the selection row is clicked', () => {
    const { onSelect, onToggleExpand } = renderCard();
    fireEvent.click(screen.getByText('Reversible'));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onToggleExpand).not.toHaveBeenCalled();
  });

  test('expands via "View plan details" without selecting the plan', () => {
    const { onSelect, onToggleExpand } = renderCard();
    fireEvent.click(screen.getByText('View plan details'));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('does not render an execute button (execution is triggered from the toolbar)', () => {
    renderCard({ isExpanded: true, isSelected: true });
    expect(screen.queryByText('Execute remediation')).not.toBeInTheDocument();
  });

  test('renders a spinner in the header instead of the expand caret when showSpinner is set', () => {
    renderCard({ readOnly: true, showSpinner: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders verification steps with their command and expected result when expanded', () => {
    renderCard({
      isExpanded: true,
      option: {
        ...baseOption,
        verificationDescription: 'Confirm the pod is healthy',
        verificationSteps: [
          { command: 'kubectl get pod web', expected: 'Running', name: 'Check pod status' },
        ],
      },
    });
    expect(screen.getByText('Verification steps')).toBeInTheDocument();
    expect(screen.getByText('Confirm the pod is healthy')).toBeInTheDocument();
    expect(screen.getByText('Check pod status')).toBeInTheDocument();
    expect(screen.getByText('kubectl get pod web')).toBeInTheDocument();
    expect(screen.getByText(/Running/)).toBeInTheDocument();
  });

  test('renders a download button in read-only mode when expanded', () => {
    renderCard({ isExpanded: true, readOnly: true });
    expect(screen.getByText('Download plan')).toBeInTheDocument();
  });

  test('does not render a download button in the selectable (non-read-only) card', () => {
    renderCard({ isExpanded: true });
    expect(screen.queryByText('Download plan')).not.toBeInTheDocument();
  });
});
