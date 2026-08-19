// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { k8sCreate, k8sPatch, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { ApprovalPolicyK8s } from '../../models/agenticrun';
import ApprovalPolicy from './ApprovalPolicy';
import { fireEvent, renderWithProviders, screen, waitFor, within } from '../../test-render';

const watch = vi.mocked(useK8sWatchResource);
const patch = vi.mocked(k8sPatch);
const create = vi.mocked(k8sCreate);

const policy = (stages: { name: string; approval: string }[]): ApprovalPolicyK8s => ({
  metadata: { name: 'cluster', resourceVersion: '1' },
  spec: { stages },
});

const stageRow = (stage: string) => within(screen.getByTestId(`config-approval-row-${stage}`));

beforeEach(() => {
  patch.mockResolvedValue(undefined);
  create.mockResolvedValue(undefined);
  watch.mockReturnValue([undefined, true, undefined]);
});

afterEach(() => {
  vi.clearAllMocks();
});

const confirmExecutionModal = () => {
  const dialog = screen.getByRole('dialog');
  within(dialog)
    .getAllByRole('checkbox')
    .forEach((checkbox) => fireEvent.click(checkbox));
  fireEvent.click(within(dialog).getByRole('button', { name: 'Enable automatic execution' }));
};

describe('ApprovalPolicy', () => {
  test('shows a spinner while the policy is loading', () => {
    watch.mockReturnValue([undefined, false, undefined]);
    renderWithProviders(<ApprovalPolicy />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  test('defaults every stage to Manual when no policy exists', () => {
    renderWithProviders(<ApprovalPolicy />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    const manualButtons = screen.getAllByRole('button', { name: 'Manual' });
    const automaticButtons = screen.getAllByRole('button', { name: 'Automatic' });
    expect(manualButtons).toHaveLength(4);
    expect(automaticButtons).toHaveLength(4);
    manualButtons.forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'true'));
    automaticButtons.forEach((button) => expect(button).toHaveAttribute('aria-pressed', 'false'));
  });

  test('syncs stage selections from an existing policy', () => {
    watch.mockReturnValue([policy([{ approval: 'Automatic', name: 'Analysis' }]), true, undefined]);
    renderWithProviders(<ApprovalPolicy />);
    expect(stageRow('Analysis').getByRole('button', { name: 'Automatic' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('creates a policy on save when none exists', async () => {
    renderWithProviders(<ApprovalPolicy />);
    fireEvent.click(stageRow('Analysis').getByRole('button', { name: 'Automatic' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            spec: expect.objectContaining({
              stages: expect.arrayContaining([{ approval: 'Automatic', name: 'Analysis' }]),
            }),
          }),
        }),
      ),
    );
  });

  test('opens the execution warning modal before enabling automatic execution', () => {
    renderWithProviders(<ApprovalPolicy />);
    // Capture the button up front — once the modal opens, "Execution" is ambiguous.
    const executionAutomatic = stageRow('Execution').getByRole('button', { name: 'Automatic' });
    fireEvent.click(executionAutomatic);
    expect(screen.getByText('Enable automatic execution policy')).toBeInTheDocument();
    expect(executionAutomatic).toHaveAttribute('aria-pressed', 'false');
  });

  test('enables automatic execution after the modal is confirmed', async () => {
    renderWithProviders(<ApprovalPolicy />);
    fireEvent.click(stageRow('Execution').getByRole('button', { name: 'Automatic' }));
    confirmExecutionModal();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(stageRow('Execution').getByRole('button', { name: 'Automatic' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('patches an existing policy on save', async () => {
    watch.mockReturnValue([policy([{ approval: 'Manual', name: 'Analysis' }]), true, undefined]);
    renderWithProviders(<ApprovalPolicy />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [expect.objectContaining({ op: 'replace', path: '/spec/stages' })],
        }),
      ),
    );
  });

  test('shows a success alert after a successful save', async () => {
    renderWithProviders(<ApprovalPolicy />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Approval policy saved successfully.')).toBeInTheDocument();
  });

  test('shows an error alert when the save fails', async () => {
    create.mockRejectedValue(new Error('forbidden'));
    renderWithProviders(<ApprovalPolicy />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Error saving approval policy')).toBeInTheDocument();
    expect(screen.getByText('forbidden')).toBeInTheDocument();
  });
});
