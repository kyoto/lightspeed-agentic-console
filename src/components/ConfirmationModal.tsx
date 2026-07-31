import type { FC, ReactNode } from 'react';
import {
  Alert,
  Button,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  actionLabel: string;
  actionVariant: 'primary' | 'danger';
  onAction: () => void | Promise<void>;
  isLoading: boolean;
  error?: string;
}

export const ConfirmationModal: FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  title,
  body,
  actionLabel,
  actionVariant,
  onAction,
  isLoading,
  error,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  return (
    <Modal aria-label={title} isOpen={isOpen} onClose={onClose} variant="small">
      <ModalHeader title={title} />
      <ModalBody>
        {typeof body === 'string' ? <Content component={ContentVariants.p}>{body}</Content> : body}
        {error && <Alert isInline title={error} variant="danger" />}
      </ModalBody>
      <ModalFooter>
        <Button
          isDisabled={isLoading}
          isLoading={isLoading}
          onClick={onAction}
          variant={actionVariant}
        >
          {actionLabel}
        </Button>
        <Button isDisabled={isLoading} onClick={onClose} variant="link">
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
