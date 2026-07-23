import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Alert, PageSection } from '@patternfly/react-core';

import { AgenticOLSConfig, AgenticOLSConfigGVK } from '../models/agenticrun';

const AgenticLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  const [config, loaded] = useK8sWatchResource<AgenticOLSConfig>({
    groupVersionKind: AgenticOLSConfigGVK,
    name: 'cluster',
  });

  const isSuspended = loaded && config?.spec?.suspended === true;

  return (
    <>
      {isSuspended && (
        <PageSection hasBodyWrapper={false}>
          <Alert isInline title={t('Agentic capabilities disabled')} variant="warning">
            {t(
              'Administrative policy has paused agentic automation on this cluster. Actions and investigations are currently unavailable. Contact your cluster administrator to restore access.',
            )}
          </Alert>
        </PageSection>
      )}
      {children}
    </>
  );
};

export default AgenticLayout;
