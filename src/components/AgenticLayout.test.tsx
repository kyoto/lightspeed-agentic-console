// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { AgenticOLSConfig } from '../models/agenticrun';
import AgenticLayout from './AgenticLayout';
import { renderWithProviders, screen, watchResult } from '../test-render';

const watch = vi.mocked(useK8sWatchResource);

const config = (suspended: boolean): AgenticOLSConfig => ({
  apiVersion: 'agentic.openshift.io/v1alpha1',
  kind: 'AgenticOLSConfig',
  metadata: { name: 'cluster' },
  spec: { suspended },
});

beforeEach(() => {
  watch.mockReturnValue(watchResult<AgenticOLSConfig>(undefined, false));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AgenticLayout', () => {
  test('renders its children', () => {
    renderWithProviders(
      <AgenticLayout>
        <div>Run details</div>
      </AgenticLayout>,
    );
    expect(screen.getByText('Run details')).toBeInTheDocument();
  });

  test('shows the disabled warning when the config is suspended', () => {
    watch.mockReturnValue(watchResult(config(true), true));
    renderWithProviders(
      <AgenticLayout>
        <div>Run details</div>
      </AgenticLayout>,
    );
    expect(screen.getByText('Agentic capabilities disabled')).toBeInTheDocument();
    expect(screen.getByText('Run details')).toBeInTheDocument();
  });

  test('hides the warning when the config is not suspended', () => {
    watch.mockReturnValue(watchResult(config(false), true));
    renderWithProviders(
      <AgenticLayout>
        <div>Run details</div>
      </AgenticLayout>,
    );
    expect(screen.queryByText('Agentic capabilities disabled')).not.toBeInTheDocument();
  });

  test('hides the warning while the config is still loading', () => {
    watch.mockReturnValue(watchResult(config(true), false));
    renderWithProviders(
      <AgenticLayout>
        <div>Run details</div>
      </AgenticLayout>,
    );
    expect(screen.queryByText('Agentic capabilities disabled')).not.toBeInTheDocument();
  });
});
