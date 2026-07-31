import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon, DownloadIcon } from '@patternfly/react-icons';
import type { FC } from 'react';
import * as React from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getRiskColor } from '../../../models/agenticrun';
import { RemediationOptionView } from '../../../models/agenticrun-views';
import { getReversibilityColor, getReversibilityText } from '../../../utils/agenticrun-utils';
import { ApprovalGatedButton } from '../../ApprovalGatedButton';
import { CodeBlockWithClipboard } from '../../CodeBlockWithClipboard';
import { MarkdownContent } from '../../MarkdownContent';
import './detail.css';

interface RemediationOptionCardProps {
  option: RemediationOptionView;
  isExpanded: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onExecute?: () => void;
  canApprove?: boolean;
  canApproveLoading?: boolean;
  readOnly?: boolean;
  showSpinner?: boolean;
  mutationInProgress?: boolean;
}

export const RemediationOptionCard: FC<RemediationOptionCardProps> = ({
  option,
  isExpanded,
  isSelected,
  onSelect,
  onToggleExpand,
  onExecute,
  canApprove = false,
  canApproveLoading,
  readOnly,
  showSpinner,
  mutationInProgress,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  const handleDownloadPlan = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const blob = new Blob([JSON.stringify(option, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `remediation-option-${option.index + 1}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [option],
  );

  return (
    <Card isSelectable={!readOnly} isSelected={isSelected}>
      <CardHeader
        className="ols-plugin__remediation-card-header--clickable"
        onClick={() => {
          if (readOnly) onToggleExpand();
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (readOnly && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        role={readOnly ? 'button' : undefined}
        selectableActions={
          readOnly
            ? undefined
            : {
                selectableActionId: `option-${option.index}`,
                selectableActionAriaLabel: t('Option {{number}}', { number: option.index + 1 }),
                name: 'remediation-option',
                variant: 'single',
                isHidden: true,
                onChange: () => onSelect(),
              }
        }
        tabIndex={readOnly ? 0 : undefined}
      >
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          {showSpinner ? (
            <FlexItem align={{ default: 'alignLeft' }}>
              <Spinner size="md" />
            </FlexItem>
          ) : (
            <FlexItem>{isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}</FlexItem>
          )}
          <FlexItem>
            <CardTitle>
              {readOnly
                ? t('Selected option')
                : t('Option {{number}}', { number: option.index + 1 })}
            </CardTitle>
          </FlexItem>
          {option.risk && (
            <FlexItem>
              <Label color={getRiskColor(option.risk)} variant="outline">
                {t('Risk')}: {option.risk}
              </Label>
            </FlexItem>
          )}
          {option.reversibility && (
            <FlexItem>
              <Label color={getReversibilityColor(option.reversibility)} variant="outline">
                {getReversibilityText(option.reversibility, t)}
              </Label>
            </FlexItem>
          )}
          <FlexItem>
            <Title headingLevel="h5">
              <MarkdownContent component="span" inline text={option.title} />
            </Title>
          </FlexItem>
        </Flex>
      </CardHeader>
      {isExpanded && (
        <CardBody>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
              <MarkdownContent text={option.description} />
            </FlexItem>

            {(option.cause || option.detail) && (
              <>
                <FlexItem>
                  <Title className="ols-plugin__remediation-card-header--title" headingLevel="h6">
                    {t('Root cause analysis')}
                  </Title>
                </FlexItem>
                <FlexItem>
                  <Card>
                    <CardBody>
                      <MarkdownContent text={option.cause} />
                      <MarkdownContent text={option.detail} />
                    </CardBody>
                  </Card>
                </FlexItem>
              </>
            )}

            <FlexItem>
              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
                {option.estimatedImpact && (
                  <FlexItem>
                    <Title className="ols-plugin__remediation-card-header--title" headingLevel="h6">
                      {t('Estimated impact')}
                    </Title>
                    <MarkdownContent text={option.estimatedImpact} />
                  </FlexItem>
                )}

                {option.actions && option.actions.length > 0 && (
                  <FlexItem>
                    <Flex
                      direction={{ default: 'column' }}
                      spaceItems={{ default: 'spaceItemsMd' }}
                    >
                      <FlexItem>
                        <Title
                          className="ols-plugin__remediation-card-header--title"
                          headingLevel="h6"
                        >
                          {t('Proposed Agent Command', { count: option.actions.length })}
                        </Title>
                      </FlexItem>
                      <FlexItem>
                        <Content component="ol">
                          {option.actions.map((action, i) => (
                            <Content component="li" key={i}>
                              <Label isCompact variant="outline">
                                {action.type}
                              </Label>{' '}
                              <MarkdownContent text={action.description} />
                              {action.command && <CodeBlockWithClipboard code={action.command} />}
                            </Content>
                          ))}
                        </Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                )}

                {(option.rollbackDescription || option.rollbackCommand) && (
                  <FlexItem>
                    <Title className="ols-plugin__remediation-card-header--title" headingLevel="h6">
                      {t('Rollback plan')}
                    </Title>
                    {option.rollbackDescription && (
                      <MarkdownContent text={option.rollbackDescription} />
                    )}
                    {option.rollbackCommand && (
                      <CodeBlockWithClipboard code={option.rollbackCommand} />
                    )}
                  </FlexItem>
                )}

                {option.verificationSteps && option.verificationSteps.length > 0 && (
                  <FlexItem>
                    <Title className="ols-plugin__remediation-card-header--title" headingLevel="h6">
                      {t('Verification steps')}
                    </Title>
                    {option.verificationDescription && (
                      <MarkdownContent text={option.verificationDescription} />
                    )}
                    <DescriptionList>
                      {option.verificationSteps.map((step, i) => (
                        <DescriptionListGroup key={i}>
                          <DescriptionListTerm>{step.name}</DescriptionListTerm>
                          <DescriptionListDescription>
                            {step.command && <CodeBlockWithClipboard code={step.command} />}
                            {step.expected && (
                              <Content component={ContentVariants.small}>
                                {t('Expected')}: {step.expected}
                              </Content>
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                      ))}
                    </DescriptionList>
                  </FlexItem>
                )}

                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    {onExecute && (
                      <FlexItem>
                        <ApprovalGatedButton
                          canApprove={canApprove}
                          canApproveLoading={canApproveLoading}
                          mutationInProgress={mutationInProgress}
                          onClick={onExecute}
                        >
                          {t('Execute remediation')}
                        </ApprovalGatedButton>
                      </FlexItem>
                    )}
                    <FlexItem>
                      <Button icon={<DownloadIcon />} onClick={handleDownloadPlan} variant="link">
                        {t('Download plan')}
                      </Button>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </FlexItem>
          </Flex>
        </CardBody>
      )}
    </Card>
  );
};
