// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  k8sCreate,
  k8sPatch,
  useAccessReview,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { AgenticOLSConfig } from '../../models/agenticrun';
import AgenticCapabilitiesToggle from './AgenticCapabilitiesToggle';
import { fireEvent, renderWithProviders, screen, waitFor, within } from '../../test-render';

const config = (suspended: boolean): AgenticOLSConfig => ({
  metadata: { name: 'cluster' },
  spec: { suspended },
});

const watch = vi.mocked(useK8sWatchResource);
const access = vi.mocked(useAccessReview);
const patch = vi.mocked(k8sPatch);
const create = vi.mocked(k8sCreate);

beforeEach(() => {
  access.mockReturnValue([true, false]);
  patch.mockResolvedValue(undefined);
  create.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

const notFound = { code: 404 };

describe('AgenticCapabilitiesToggle', () => {
  test('renders an enabled switch when the config is not suspended', () => {
    watch.mockReturnValue([config(false), true, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    expect(screen.getByRole('switch', { name: 'Agentic capabilities' })).toBeChecked();
  });

  test('renders an unchecked switch when the config is suspended', () => {
    watch.mockReturnValue([config(true), true, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    expect(screen.getByRole('switch', { name: 'Agentic capabilities' })).not.toBeChecked();
  });

  test('disables the switch while the config is still loading', () => {
    watch.mockReturnValue([undefined, false, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    expect(screen.getByRole('switch', { name: 'Agentic capabilities' })).toBeDisabled();
  });

  test('disables the switch when the user cannot modify the config', () => {
    watch.mockReturnValue([config(false), true, undefined]);
    access.mockReturnValue([false, false]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    expect(screen.getByRole('switch', { name: 'Agentic capabilities' })).toBeDisabled();
  });

  test('patches the config to resume when enabling a suspended cluster', async () => {
    watch.mockReturnValue([config(true), true, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    fireEvent.click(screen.getByRole('switch', { name: 'Agentic capabilities' }));
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        expect.objectContaining({ data: [{ op: 'add', path: '/spec/suspended', value: false }] }),
      ),
    );
  });

  test('opens a confirmation modal before disabling an enabled cluster', () => {
    watch.mockReturnValue([config(false), true, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    fireEvent.click(screen.getByRole('switch', { name: 'Agentic capabilities' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Disable AI?')).toBeInTheDocument();
    expect(patch).not.toHaveBeenCalled();
  });

  test('patches the config to suspend after the disable is confirmed', async () => {
    watch.mockReturnValue([config(false), true, undefined]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    fireEvent.click(screen.getByRole('switch', { name: 'Agentic capabilities' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable AI' }));
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        expect.objectContaining({ data: [{ op: 'add', path: '/spec/suspended', value: true }] }),
      ),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('creates the config when none exists yet', async () => {
    watch.mockReturnValue([undefined, false, notFound]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    fireEvent.click(screen.getByRole('switch', { name: 'Agentic capabilities' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Disable AI' }));
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ spec: { suspended: true } }) }),
      ),
    );
  });

  test('shows a load-error alert on an unexpected load failure', () => {
    watch.mockReturnValue([undefined, false, new Error('boom')]);
    renderWithProviders(<AgenticCapabilitiesToggle />);
    expect(
      screen.getByText('Failed to load agentic capabilities configuration'),
    ).toBeInTheDocument();
  });

  test('shows an update-error alert when the patch fails', async () => {
    watch.mockReturnValue([config(true), true, undefined]);
    patch.mockRejectedValue(new Error('denied'));
    renderWithProviders(<AgenticCapabilitiesToggle />);
    fireEvent.click(screen.getByRole('switch', { name: 'Agentic capabilities' }));
    expect(await screen.findByText('Failed to update agentic capabilities')).toBeInTheDocument();
    expect(screen.getByText('denied')).toBeInTheDocument();
  });
});
