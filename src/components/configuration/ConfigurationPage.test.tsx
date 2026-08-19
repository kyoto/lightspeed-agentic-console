// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import ConfigurationPage from './ConfigurationPage';
import { fireEvent, renderWithProviders, screen } from '../../test-render';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importActual) => ({
  ...(await importActual<typeof import('react-router')>()),
  useNavigate: () => navigateMock,
}));

const watch = vi.mocked(useK8sWatchResource);

beforeEach(() => {
  watch.mockReturnValue([undefined, true, undefined]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('ConfigurationPage', () => {
  test('renders the heading, subtitle, and preview badge', () => {
    renderWithProviders(<ConfigurationPage />);
    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(
      screen.getByText('Configure runtime policies for agentic troubleshooting workflows.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Dev preview')).toBeInTheDocument();
  });

  test('navigates to the runs list when the breadcrumb is clicked', () => {
    renderWithProviders(<ConfigurationPage />);
    fireEvent.click(screen.getByText('Agentic runs'));
    expect(navigateMock).toHaveBeenCalledWith('/lightspeed/runs');
  });

  test('renders the approval policy', () => {
    renderWithProviders(<ConfigurationPage />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
