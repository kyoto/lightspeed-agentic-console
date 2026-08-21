// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useAgenticRun } from '../../hooks/useAgenticRun';
import type { AgenticRunView, RemediationOptionView } from '../../models/agenticrun-views';
import RunDetailPage from './RunDetailPage';
import { renderWithProviders, screen } from '../../test-render';

vi.mock('../../hooks/useAgenticRun', () => ({
  useAgenticRun: vi.fn(),
}));

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useParams: () => ({ name: 'run-1', ns: 'openshift-lightspeed' }) };
});

const hook = vi.mocked(useAgenticRun);

const makeView = (overrides: Partial<AgenticRunView>): AgenticRunView => ({
  options: [],
  phase: 'Failed',
  request: 'Fix the failing alert',
  timeline: [],
  ...overrides,
});

const makeOption = (overrides?: Partial<RemediationOptionView>): RemediationOptionView => ({
  cause: 'Memory limit too low',
  description: 'Increase the memory limit',
  detail: 'Pod was OOMKilled',
  index: 0,
  title: 'Restart the pod',
  ...overrides,
});

const mockHook = (view: AgenticRunView) => {
  hook.mockReturnValue({
    approveExecution: vi.fn(),
    approveStage: vi.fn(),
    canApprove: true,
    canApproveLoading: false,
    clearMutationError: vi.fn(),
    denyStage: vi.fn(),
    mutationError: undefined,
    mutationInProgress: false,
    needsApproval: { Analysis: false, Escalation: false, Verification: false },
    resultsError: undefined,
    resultsLoaded: true,
    run: { metadata: { name: 'run-1', namespace: 'openshift-lightspeed' } },
    runError: undefined,
    runLoaded: true,
    view,
  } as unknown as ReturnType<typeof useAgenticRun>);
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('RunDetailPage remediation hub failure rendering', () => {
  test('renders the failure card when a Failed run has no remediation options', () => {
    mockHook(makeView({ failureReason: 'Analysis pod exceeded memory limit', options: [] }));
    renderWithProviders(<RunDetailPage />);

    expect(screen.getByText('Analysis pod exceeded memory limit')).toBeInTheDocument();
    expect(screen.queryByText('Restart the pod')).not.toBeInTheDocument();
  });

  test('renders the terminal summary when a Failed run has remediation options', () => {
    mockHook(
      makeView({
        execution: {
          actions: [],
          originalRootCause: 'Memory limit too low',
          outcome: 'Failed',
          remediationDelta: '',
        },
        failureReason: 'Insufficient permissions to patch CoreDNS ConfigMap',
        options: [makeOption()],
      }),
    );
    renderWithProviders(<RunDetailPage />);

    expect(screen.getByText('Restart the pod')).toBeInTheDocument();
    expect(screen.getByText('Execution')).toBeInTheDocument();
  });
});
