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
    onExecute: vi.fn(),
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

const originalUrlDescriptors = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
};

afterEach(() => {
  vi.restoreAllMocks();
  Object.entries(originalUrlDescriptors).forEach(([key, descriptor]) => {
    if (descriptor) {
      Object.defineProperty(URL, key, descriptor);
      return;
    }
    Reflect.deleteProperty(URL, key);
  });
});

describe('RemediationOptionCard', () => {
  test('renders the option number, title, and reversibility when collapsed', () => {
    renderCard();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Restart the pod')).toBeInTheDocument();
    expect(screen.getByText('Reversible')).toBeInTheDocument();
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

  test('calls onSelect when the selectable control is activated in non-read-only mode', () => {
    const { onSelect } = renderCard();
    fireEvent.click(screen.getByRole('radio'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('calls onExecute when the execute button is clicked', () => {
    const { onExecute } = renderCard({ canApprove: true, isExpanded: true });
    fireEvent.click(screen.getByText('Execute remediation').closest('button') as HTMLButtonElement);
    expect(onExecute).toHaveBeenCalledTimes(1);
  });

  test('does not render the execute button when onExecute is not provided', () => {
    renderCard({ isExpanded: true, onExecute: undefined });
    expect(screen.queryByText('Execute remediation')).not.toBeInTheDocument();
  });

  test('renders a spinner in the header instead of the expand caret when showSpinner is set', () => {
    renderCard({ showSpinner: true });
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

  test('downloads the serialized plan with the expected blob and filename', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    // jsdom does not implement anchor navigation; stub the click it triggers.
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    // Capture the anchor the handler creates so we can assert its download name.
    let downloadedAnchor: HTMLAnchorElement | undefined;
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') downloadedAnchor = element as HTMLAnchorElement;
      return element;
    });
    renderCard({ isExpanded: true });
    fireEvent.click(screen.getByText('Download plan').closest('button') as HTMLButtonElement);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    await expect(blob.text()).resolves.toBe(JSON.stringify(baseOption, null, 2));
    expect(downloadedAnchor?.download).toBe('remediation-option-1.json');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
