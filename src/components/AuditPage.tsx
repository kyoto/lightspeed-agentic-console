import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ListPageHeader } from '@openshift-console/dynamic-plugin-sdk';

import AgenticLayout from './AgenticLayout';
import PreviewBadge from './PreviewBadge';

const AuditPage: React.FC = () => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  return (
    <AgenticLayout>
      <ListPageHeader badge={<PreviewBadge />} title={t('Audit & logs')} />
    </AgenticLayout>
  );
};

export default AuditPage;
