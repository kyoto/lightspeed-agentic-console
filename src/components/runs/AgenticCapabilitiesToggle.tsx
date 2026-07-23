import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  k8sPatch,
  useAccessReview,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Popover,
  Switch,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';

import { ConfirmationModal } from '../ConfirmationModal';
import {
  AgenticOLSConfig,
  AgenticOLSConfigGVK,
  AgenticOLSConfigModel,
} from '../../models/agenticrun';
import { buildSuspendedPatch } from './agenticCapabilitiesUtils';

import './AgenticCapabilitiesToggle.css';

const AgenticCapabilitiesToggle: React.FC = () => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [config, loaded] = useK8sWatchResource<AgenticOLSConfig>({
    groupVersionKind: AgenticOLSConfigGVK,
    name: 'cluster',
  });

  const [canPatch] = useAccessReview({
    group: AgenticOLSConfigModel.apiGroup,
    resource: AgenticOLSConfigModel.plural,
    verb: 'patch',
  });

  const isEnabled = !config?.spec?.suspended;

  const setSuspended = React.useCallback(
    async (suspended: boolean): Promise<boolean> => {
      setSaving(true);
      setError('');
      try {
        await k8sPatch({
          model: AgenticOLSConfigModel,
          resource: config,
          data: buildSuspendedPatch(suspended),
        });
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [config],
  );

  const handleToggle = React.useCallback(
    (_event: React.FormEvent, checked: boolean) => {
      if (checked) {
        setSuspended(false);
        return;
      }
      setConfirmOpen(true);
    },
    [setSuspended],
  );

  const handleConfirmDisable = React.useCallback(async () => {
    const success = await setSuspended(true);
    if (success) {
      setConfirmOpen(false);
    }
  }, [setSuspended]);

  return (
    <>
      {error && !confirmOpen && (
        <Alert
          actionClose={<AlertActionCloseButton onClose={() => setError('')} />}
          isInline
          title={t('Failed to update agentic capabilities')}
          variant="danger"
        >
          {error}
        </Alert>
      )}
      <Card className="ols-plugin__agentic-capabilities-toggle" isCompact>
        <CardBody>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>{t('Agentic capabilities')}</FlexItem>
            <FlexItem>
              <Popover
                bodyContent={
                  <>
                    {t('Controls the autonomous analysis engine for this cluster.')}
                    <br />
                    <br />
                    <strong>{t('When enabled:')}</strong>{' '}
                    {t(
                      'The AI actively monitors incoming alerts, collects diagnostic logs, correlates telemetry, and creates structured remediation plans.',
                    )}
                    <br />
                    <br />
                    <strong>{t('When disabled:')}</strong>{' '}
                    {t(
                      'The engine goes entirely code-silent. Background analysis halts, active executions freeze, and API token consumption drops to zero.',
                    )}
                  </>
                }
                headerContent={t('Cluster agentic capabilities')}
              >
                <Button
                  aria-label={t('More info about agentic capabilities')}
                  icon={<OutlinedQuestionCircleIcon />}
                  variant="plain"
                />
              </Popover>
            </FlexItem>
            <FlexItem>
              <Switch
                aria-label={t('Agentic capabilities')}
                id="agentic-capabilities-toggle"
                isChecked={isEnabled}
                isDisabled={!loaded || saving || !canPatch}
                onChange={handleToggle}
              />
            </FlexItem>
          </Flex>
        </CardBody>
      </Card>
      <ConfirmationModal
        actionLabel={t('Disable AI')}
        actionVariant="danger"
        body={t(
          'Stops all background analysis, active executions, and API token consumption for this cluster. You can re-enable agentic capabilities at any time.',
        )}
        error={error}
        isLoading={saving}
        isOpen={confirmOpen}
        onAction={handleConfirmDisable}
        onClose={() => {
          setConfirmOpen(false);
          setError('');
        }}
        title={t('Disable AI?')}
      />
    </>
  );
};

export default AgenticCapabilitiesToggle;
