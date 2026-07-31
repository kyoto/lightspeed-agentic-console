import {
  Card,
  CardBody,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AgenticRunPhase,
  RootCauseView,
  SandboxView,
  TERMINAL_PHASES,
} from '../../../models/agenticrun-views';
import { MarkdownContent } from '../../MarkdownContent';
import { SandboxLogViewer } from './SandboxLogViewer';

interface AnalysisSummaryProps {
  analysisRequest?: string;
  rootCause?: RootCauseView;
  hasRemediationOptions: boolean;
  phase: AgenticRunPhase;
  analysisSandbox?: SandboxView;
  analysisStartedAt?: string;
}

export const AnalysisSummary: FC<AnalysisSummaryProps> = ({
  analysisRequest,
  phase,
  analysisSandbox,
  analysisStartedAt,
  hasRemediationOptions,
  rootCause,
}) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  if (phase === 'Pending' || phase === 'Analyzing') {
    const isPending = phase === 'Pending';
    return (
      <>
        <Card>
          <CardBody>
            <Flex direction={{ default: 'column' }}>
              <FlexItem>
                <Content component={ContentVariants.small}>
                  <em>{isPending ? t('Waiting for analysis to start...') : t('Analyzing...')}</em>
                </Content>
              </FlexItem>
              <FlexItem>
                <Skeleton
                  screenreaderText={
                    isPending ? t('Waiting for analysis to start...') : t('Loading analysis')
                  }
                  width="70%"
                />
              </FlexItem>
              <FlexItem>
                <Skeleton width="40%" />
              </FlexItem>
              <FlexItem>
                <Skeleton width="50%" />
              </FlexItem>
              {!isPending && analysisSandbox && (
                <FlexItem>
                  <SandboxLogViewer
                    sandbox={analysisSandbox}
                    sinceTime={analysisStartedAt}
                    streaming
                    title={t('Analysis')}
                  />
                </FlexItem>
              )}
            </Flex>
          </CardBody>
        </Card>
      </>
    );
  }

  if (analysisRequest) {
    return (
      <>
        <Card>
          <CardBody>
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem>
                <MarkdownContent text={analysisRequest} />
              </FlexItem>
              {analysisSandbox && (
                <FlexItem>
                  <SandboxLogViewer
                    sandbox={analysisSandbox}
                    sinceTime={analysisStartedAt}
                    title={t('Analysis')}
                  />
                </FlexItem>
              )}
            </Flex>
          </CardBody>
        </Card>

        {!hasRemediationOptions && rootCause && (
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsLg' }}>
            <FlexItem>
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Title headingLevel="h4">{t('Root cause analysis')}</Title>
                </FlexItem>
                <FlexItem>
                  <Label isCompact>{t('AI-generated')}</Label>
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <Card>
                <CardBody>
                  <Flex>
                    <FlexItem>
                      <MarkdownContent text={rootCause.cause} />
                    </FlexItem>
                    <FlexItem>
                      <MarkdownContent text={rootCause.detail} />
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          </Flex>
        )}
      </>
    );
  }

  if (TERMINAL_PHASES.includes(phase)) {
    return (
      <Card>
        <CardBody>
          <EmptyState>
            <EmptyStateBody>{t('Root cause analysis was not completed.')}</EmptyStateBody>
          </EmptyState>
          {analysisSandbox && (
            <SandboxLogViewer
              sandbox={analysisSandbox}
              sinceTime={analysisStartedAt}
              title={t('Analysis')}
            />
          )}
        </CardBody>
      </Card>
    );
  }

  return null;
};
