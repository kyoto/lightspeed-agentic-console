import type { FC, ReactNode } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import type { ButtonProps } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface ApprovalGatedButtonProps {
  canApprove: boolean;
  canApproveLoading?: boolean;
  mutationInProgress?: boolean;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  isDanger?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: ReactNode;
  children: ReactNode;
}

export const ApprovalGatedButton: FC<ApprovalGatedButtonProps> = ({
  canApprove,
  canApproveLoading,
  mutationInProgress,
  onClick,
  variant = 'primary',
  isDanger,
  isDisabled,
  disabledTooltip,
  children,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const permissionBlocked = !canApprove && !canApproveLoading && !mutationInProgress;
  const selectionBlocked =
    !permissionBlocked && !!isDisabled && !!disabledTooltip && !mutationInProgress;
  return (
    <Tooltip
      content={
        selectionBlocked ? disabledTooltip : t("You don't have permission to approve or deny runs.")
      }
      trigger={permissionBlocked || selectionBlocked ? undefined : 'manual'}
    >
      <Button
        isAriaDisabled={!canApprove || mutationInProgress || !!isDisabled}
        isDanger={isDanger}
        isLoading={canApproveLoading || mutationInProgress}
        onClick={onClick}
        variant={variant}
      >
        {children}
      </Button>
    </Tooltip>
  );
};
