import { useState } from 'react';
import { Alert, Content, ContentVariants, Flex, FlexItem } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { ApprovalStageType } from '../../../models/agenticrun';
import { ApprovalGatedButton } from '../../ApprovalGatedButton';
import { ConfirmationModal } from '../../ConfirmationModal';
import { getStageLabel } from '../../../utils/agenticrun-utils';

interface StageApprovalBannerProps {
  stageType: ApprovalStageType;
  canApprove: boolean;
  canApproveLoading: boolean;
  mutationInProgress: boolean;
  mutationError: string | undefined;
  onApprove: () => Promise<boolean> | void;
  onClearError?: () => void;
}

export const StageApprovalBanner: FC<StageApprovalBannerProps> = ({
  stageType,
  canApprove,
  canApproveLoading,
  mutationInProgress,
  mutationError,
  onApprove,
  onClearError,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const label = getStageLabel(stageType, t);

  const handleApprove = async () => {
    const result = await onApprove();
    if (result !== false) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <Alert
        actionLinks={
          <ApprovalGatedButton
            canApprove={canApprove}
            canApproveLoading={canApproveLoading}
            mutationInProgress={mutationInProgress}
            onClick={() => setIsModalOpen(true)}
          >
            {t('Approve {{stage}}', { stage: label })}
          </ApprovalGatedButton>
        }
        isInline
        title={t('Waiting for approval')}
        variant="info"
      >
        {t('This stage requires manual approval before it can proceed.')}
      </Alert>

      <ConfirmationModal
        actionLabel={t('Approve {{stage}}', { stage: label })}
        actionVariant="primary"
        body={
          <Flex direction={{ default: 'column' }}>
            <FlexItem>
              {t('Approving will allow the {{stage}} stage to proceed.', { stage: label })}
            </FlexItem>
            <FlexItem>
              <Content component={ContentVariants.small}>
                <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <InfoCircleIcon color="var(--pf-t--global--icon--color--status--info--default)" />
                  </FlexItem>
                  <FlexItem>{t('Always review AI-generated content prior to use.')}</FlexItem>
                </Flex>
              </Content>
            </FlexItem>
          </Flex>
        }
        error={mutationError}
        isLoading={mutationInProgress}
        isOpen={isModalOpen}
        onAction={handleApprove}
        onClose={() => {
          setIsModalOpen(false);
          onClearError?.();
        }}
        title={t('Approve {{stage}}?', { stage: label })}
      />
    </>
  );
};
