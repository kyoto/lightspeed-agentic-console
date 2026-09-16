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
  Radio,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { AngleDownIcon, AngleUpIcon, DownloadIcon } from '@patternfly/react-icons';
import type { FC } from 'react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RemediationOptionView } from '../../../models/agenticrun-views';
import { getReversibilityColor, getReversibilityText } from '../../../utils/agenticrun-utils';
import { downloadRemediationOption } from '../../../utils/remediation-plan';
import { CodeBlockWithClipboard } from '../../CodeBlockWithClipboard';
import { MarkdownContent } from '../../MarkdownContent';
import { RequiredPermissions } from './RequiredPermissions';
import './detail.css';

interface RemediationOptionCardProps {
  option: RemediationOptionView;
  isExpanded: boolean;
  isRecommended?: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  readOnly?: boolean;
  showSpinner?: boolean;
}

export const RemediationOptionCard: FC<RemediationOptionCardProps> = ({
  option,
  isExpanded,
  isRecommended = false,
  isSelected,
  onSelect,
  onToggleExpand,
  readOnly,
  showSpinner,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  return (
    <Card
      className={!readOnly && isSelected ? 'ols-plugin__remediation-card--selected' : undefined}
    >
      {readOnly ? (
        <CardHeader
          className="ols-plugin__remediation-card-header--clickable"
          onClick={() => onToggleExpand()}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleExpand();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            {showSpinner ? (
              <FlexItem align={{ default: 'alignLeft' }}>
                <Spinner size="md" />
              </FlexItem>
            ) : (
              <FlexItem>{isExpanded ? <AngleUpIcon /> : <AngleDownIcon />}</FlexItem>
            )}
            <Flex direction={{ default: 'column' }}>
              <FlexItem>
                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <CardTitle className="ols-plugin__remediation-option-title">
                      <strong>{t('Selected option')}</strong>
                    </CardTitle>
                  </FlexItem>
                  {option.reversibility && (
                    <FlexItem>
                      <Label
                        color={getReversibilityColor(option.reversibility)}
                        isCompact
                        variant="outline"
                      >
                        {getReversibilityText(option.reversibility, t)}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h5">
                  <strong>
                    <MarkdownContent component="span" inline text={option.title} />
                  </strong>
                </Title>
              </FlexItem>
            </Flex>
          </Flex>
        </CardHeader>
      ) : (
        <CardHeader>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              <label
                className="ols-plugin__remediation-select-row"
                htmlFor={`select-option-${option.index}`}
              >
                <Flex
                  alignItems={{ default: 'alignItemsCenter' }}
                  spaceItems={{ default: 'spaceItemsSm' }}
                >
                  <FlexItem>
                    <Radio
                      aria-label={t('Select plan {{number}}', { number: option.index + 1 })}
                      id={`select-option-${option.index}`}
                      isChecked={isSelected}
                      name="remediation-option"
                      onChange={() => onSelect()}
                    />
                  </FlexItem>
                  <FlexItem>
                    <strong>{t('Select plan {{number}}', { number: option.index + 1 })}</strong>
                  </FlexItem>
                  {isRecommended && (
                    <FlexItem>
                      <Label color="blue" isCompact>
                        {t('AI recommended')}
                      </Label>
                    </FlexItem>
                  )}
                  {option.reversibility && (
                    <FlexItem>
                      <Label
                        color={getReversibilityColor(option.reversibility)}
                        isCompact
                        variant="outline"
                      >
                        {getReversibilityText(option.reversibility, t)}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </label>
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h5">
                <strong>
                  <MarkdownContent component="span" inline text={option.title} />
                </strong>
              </Title>
            </FlexItem>
            <FlexItem>
              <Button
                icon={isExpanded ? <AngleUpIcon /> : <AngleDownIcon />}
                iconPosition="end"
                isInline
                onClick={() => onToggleExpand()}
                variant="link"
              >
                {isExpanded ? t('Hide plan details') : t('View plan details')}
              </Button>
            </FlexItem>
          </Flex>
        </CardHeader>
      )}
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

            {option.rbac && <RequiredPermissions rbac={option.rbac} />}

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

                {readOnly && (
                  <FlexItem>
                    <Button
                      icon={<DownloadIcon />}
                      onClick={() => downloadRemediationOption(option)}
                      variant="link"
                    >
                      {t('Download plan')}
                    </Button>
                  </FlexItem>
                )}
              </Flex>
            </FlexItem>
          </Flex>
        </CardBody>
      )}
    </Card>
  );
};
