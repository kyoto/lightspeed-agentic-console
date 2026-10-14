// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';

import { RunUidProvider } from '../RunUidContext';

vi.unmock('./SandboxLogViewer');

vi.mock('@patternfly/react-log-viewer', () => ({
  LogViewer: ({ data, toolbar }: { data: string; toolbar: ReactNode }) => (
    <>
      {toolbar}
      <div data-testid="log-data">{data}</div>
    </>
  ),
  LogViewerSearch: () => null,
}));

const mockRetainedLogs = vi.fn();
vi.mock('../../../hooks/useRetainedLogs', () => ({
  useRetainedLogs: (...args: unknown[]) => mockRetainedLogs(...args),
}));

const mockPodLogStream = vi.fn();
vi.mock('../../../hooks/useSandboxLogStream', () => ({
  useSandboxLogStream: (...args: unknown[]) => mockPodLogStream(...args),
}));

import { SandboxLogViewer } from './SandboxLogViewer';

const SANDBOX = { namespace: 'openshift-lightspeed', podName: 'sandbox-pod' };

const otelResult = (overrides: Record<string, unknown> = {}) => ({
  available: true,
  error: undefined,
  lines: [] as string[],
  loading: false,
  ...overrides,
});

const podResult = (overrides: Record<string, unknown> = {}) => ({
  error: undefined,
  lines: [] as string[],
  loading: false,
  ...overrides,
});

const renderAndExpand = (props: Record<string, unknown> = {}) => {
  const result = render(
    <RunUidProvider value="uid-123">
      <SandboxLogViewer phase="analysis" sandbox={SANDBOX} title="Analysis" {...props} />
    </RunUidProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /View Analysis logs/ }));
  return result;
};

beforeEach(() => {
  mockRetainedLogs.mockReturnValue(otelResult({ available: false }));
  mockPodLogStream.mockReturnValue(podResult());
});

test('displays OTEL log lines when available', () => {
  mockRetainedLogs.mockReturnValue(
    otelResult({ lines: ['2026-01-01T00:00:01Z [agent.start] Starting analysis'] }),
  );

  renderAndExpand();

  expect(screen.getByTestId('log-data')).toHaveTextContent(
    '2026-01-01T00:00:01Z [agent.start] Starting analysis',
  );
});

test('falls back to pod logs when OTEL returns zero lines', () => {
  mockRetainedLogs.mockReturnValue(otelResult());
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand();

  expect(screen.getByTestId('log-data')).toHaveTextContent('pod log line');
  expect(mockPodLogStream).toHaveBeenCalledWith(SANDBOX, true, false, undefined);
});

test('uses pod logs when OTEL is unavailable', () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand();

  expect(screen.getByTestId('log-data')).toHaveTextContent('pod log line');
  expect(mockPodLogStream).toHaveBeenCalledWith(SANDBOX, true, false, undefined);
});

test('falls back to pod logs when OTEL fetch errors', () => {
  mockRetainedLogs.mockReturnValue(
    otelResult({ error: 'Failed to fetch retained logs (HTTP 500)' }),
  );
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod fallback line'] }));

  renderAndExpand();

  expect(screen.getByTestId('log-data')).toHaveTextContent('pod fallback line');
});

test('surfaces OTEL error when it fails and pod logs are unavailable', () => {
  mockRetainedLogs.mockReturnValue(
    otelResult({ error: 'Failed to fetch retained logs (HTTP 500)' }),
  );

  renderAndExpand();

  expect(screen.getByText('Failed to fetch retained logs (HTTP 500)')).toBeInTheDocument();
});

test('shows Live label when streaming', () => {
  render(
    <RunUidProvider value="uid-123">
      <SandboxLogViewer phase="analysis" sandbox={SANDBOX} streaming title="Analysis" />
    </RunUidProvider>,
  );

  expect(screen.getByText('Live')).toBeInTheDocument();
});

test('does not show Live label when not streaming', () => {
  render(
    <RunUidProvider value="uid-123">
      <SandboxLogViewer phase="analysis" sandbox={SANDBOX} title="Analysis" />
    </RunUidProvider>,
  );

  expect(screen.queryByText('Live')).not.toBeInTheDocument();
});

test('shows loading message while logs are loading', () => {
  mockRetainedLogs.mockReturnValue(otelResult({ loading: true }));

  renderAndExpand();

  expect(screen.getByText('Loading logs...')).toBeInTheDocument();
});

test('shows warning alert and failure message on error', () => {
  mockPodLogStream.mockReturnValue(podResult({ error: 'Connection refused' }));

  renderAndExpand();

  expect(screen.getByText('Connection refused')).toBeInTheDocument();
  expect(screen.getByTestId('log-data')).toHaveTextContent('Failed to load logs.');
});

test('passes phase to useRetainedLogs', () => {
  renderAndExpand({ phase: 'execution' });

  expect(mockRetainedLogs).toHaveBeenCalledWith('uid-123', true, 'execution');
});

const POD_LOG_URL =
  '/api/kubernetes/api/v1/namespaces/openshift-lightspeed/pods/sandbox-pod/log?timestamps=true';

test('renders a download link to the pod log endpoint when pod logs are the source', () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand();

  const link = screen.getByRole('link', { name: 'Download' });
  expect(link).toHaveAttribute('href', POD_LOG_URL);
  expect(link).toHaveAttribute('download', 'sandbox-pod.log');
});

test('renders a raw logs link that opens the pod log endpoint in a new tab', () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand();

  const link = screen.getByRole('link', { name: 'View raw logs' });
  expect(link).toHaveAttribute('href', POD_LOG_URL);
  expect(link).toHaveAttribute('target', '_blank');
  expect(link).toHaveAttribute('rel', 'noopener noreferrer');
});

test('links to the whole pod log, ignoring sinceTime and tailLines', () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand({ sinceTime: '2026-01-01T00:00:00Z' });

  expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute('href', POD_LOG_URL);
});

test('shows log actions for streaming views, which never use OTEL', () => {
  mockRetainedLogs.mockReturnValue(otelResult({ lines: ['otel line'] }));
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  render(
    <RunUidProvider value="uid-123">
      <SandboxLogViewer phase="analysis" sandbox={SANDBOX} streaming title="Analysis" />
    </RunUidProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: /View Analysis logs/ }));

  expect(screen.getByRole('link', { name: 'Download' })).toBeInTheDocument();
});

const expectTooltipNotToDescribe = async (action: HTMLElement, tooltipText: string) => {
  fireEvent.focus(action);
  await waitFor(() => expect(screen.getByRole('tooltip')).toHaveTextContent(tooltipText));
  expect(action).not.toHaveAttribute('aria-describedby');
  fireEvent.blur(action);
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
};

test('does not describe pod log actions with tooltip text that repeats their label', async () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand();

  await expectTooltipNotToDescribe(screen.getByRole('link', { name: 'Download' }), 'Download');
  await expectTooltipNotToDescribe(
    screen.getByRole('link', { name: 'View raw logs' }),
    'View raw logs',
  );
});

test('hides log actions while OTEL availability is still loading', () => {
  mockRetainedLogs.mockReturnValue(otelResult({ loading: true }));

  renderAndExpand();

  expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
});

test('hides log actions when OTEL is the active source', () => {
  mockRetainedLogs.mockReturnValue(otelResult({ lines: ['otel line'] }));

  renderAndExpand();

  expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View raw logs' })).not.toBeInTheDocument();
});

test('hides log actions when the pod log fetch failed', () => {
  mockPodLogStream.mockReturnValue(podResult({ error: 'Connection refused' }));

  renderAndExpand();

  expect(screen.queryByRole('link', { name: 'Download' })).not.toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'View raw logs' })).not.toBeInTheDocument();
});

test('builds a safe download filename for pod names needing encoding', () => {
  mockPodLogStream.mockReturnValue(podResult({ lines: ['pod log line'] }));

  renderAndExpand({ sandbox: { namespace: 'openshift-lightspeed', podName: 'sandbox/../pod' } });

  expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
    'download',
    'sandbox_.._pod.log',
  );
});
