// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { HttpError } from '@openshift-console/dynamic-plugin-sdk';
import StatusGuard from './StatusGuard';
import { renderWithProviders, screen } from '../test-render';

const renderGuard = (props: Partial<Parameters<typeof StatusGuard>[0]> = {}) =>
  renderWithProviders(
    <StatusGuard data={{ ok: true }} label="Cluster" loaded={true} loadError={undefined} {...props}>
      <div>child content</div>
    </StatusGuard>,
  );

describe('StatusGuard', () => {
  test('renders children when loaded with data', () => {
    renderGuard();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  test('shows a spinner while loading', () => {
    renderGuard({ loaded: false });
    expect(screen.getByLabelText('Loading Cluster')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  test('shows a not-found state when loaded with no data', () => {
    renderGuard({ data: undefined });
    expect(screen.getByText('Cluster not found')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  test('shows a restricted-access state on a 403 error', () => {
    renderGuard({ loadError: new HttpError('forbidden', 403) });
    expect(screen.getByText('Restricted access')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to view this Cluster.")).toBeInTheDocument();
  });

  test('shows a not-found state on a 404 error', () => {
    renderGuard({ loadError: new HttpError('missing', 404) });
    expect(screen.getByText('Cluster not found')).toBeInTheDocument();
  });

  test('shows a generic error state with the message for other errors', () => {
    renderGuard({ loadError: new Error('network down') });
    expect(screen.getByText('Unable to load Cluster')).toBeInTheDocument();
    expect(screen.getByText('network down')).toBeInTheDocument();
  });
});
