import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Checkbox,
  Content,
  ContentVariants,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
} from '@patternfly/react-core';

type ExecutionPolicyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const ExecutionPolicyModal: React.FC<ExecutionPolicyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [ackAutomatic, setAckAutomatic] = React.useState(false);
  const [ackRbac, setAckRbac] = React.useState(false);

  const handleClose = () => {
    setAckAutomatic(false);
    setAckRbac(false);
    onClose();
  };

  const handleConfirm = () => {
    setAckAutomatic(false);
    setAckRbac(false);
    onConfirm();
  };

  const title = t('Enable automatic execution policy');

  return (
    <Modal aria-label={title} isOpen={isOpen} onClose={handleClose} variant="medium">
      <ModalHeader title={title} titleIconVariant="warning" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Alert
              isInline
              title={t('Automatic policy allows unprompted autonomous cluster operations')}
              variant="danger"
            >
              <Content component={ContentVariants.p}>
                <Trans ns="plugin__lightspeed-agentic-console-plugin">
                  Enabling Automatic for the <strong>Execution</strong> stage lets the agent proceed
                  without a human approval gate. Misconfigured limits or RBAC can result in
                  unintended cluster changes across remediation workflows.
                </Trans>
              </Content>
            </Alert>
          </StackItem>
          <StackItem>
            <Content component={ContentVariants.p}>
              <Trans ns="plugin__lightspeed-agentic-console-plugin">
                Confirm both statements below before enabling Automatic execution for{' '}
                <strong>Execution</strong>.
              </Trans>
            </Content>
          </StackItem>
          <StackItem>
            <Checkbox
              id="ack-automatic"
              isChecked={ackAutomatic}
              label={t(
                'I understand the agent will automatically perform operations without manual' +
                  ' approval',
              )}
              onChange={(_event, checked) => setAckAutomatic(checked)}
            />
          </StackItem>
          <StackItem>
            <Checkbox
              id="ack-rbac"
              isChecked={ackRbac}
              label={t(
                'I confirm that cluster safety limits and RBAC permissions have been verified',
              )}
              onChange={(_event, checked) => setAckRbac(checked)}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button isDisabled={!ackAutomatic || !ackRbac} onClick={handleConfirm} variant="primary">
          {t('Enable automatic execution')}
        </Button>
        <Button onClick={handleClose} variant="link">
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ExecutionPolicyModal;
