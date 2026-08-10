import { useCallback, useEffect, useState } from 'react';

import {
  DocumentTitle,
  ResourceIcon,
  ResourceLink,
  Timestamp,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Card,
  CardBody,
  Content,
  ContentVariants,
  Divider,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  PageGroup,
  PageSection,
  Popover,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import { InfoCircleIcon, OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { useAgenticRun } from '../../hooks/useAgenticRun';
import { ApprovalStageType, LightspeedAgenticRunGVK } from '../../models/agenticrun';
import type { AgenticRunView } from '../../models/agenticrun-views';
import { TERMINAL_PHASES } from '../../models/agenticrun-views';
import { getReversibilityDescription, getReversibilityText } from '../../utils/agenticrun-utils';
import AgenticLayout from '../AgenticLayout';
import { ApprovalGatedButton } from '../ApprovalGatedButton';
import { ConfirmationModal } from '../ConfirmationModal';
import { MarkdownContent } from '../MarkdownContent';
import PreviewBadge from '../PreviewBadge';
import StatusGuard from '../StatusGuard';
import { AnalysisSummary } from './detail/AnalysisSummary';
import { EscalationSummary } from './detail/EscalationSummary';
import { ExecutionSummary } from './detail/ExecutionSummary';
import { RemediationOptionCard } from './detail/RemediationOptionCard';
import { RunPhaseLabel } from './detail/RunPhaseLabel';
import { RunTimeline } from './detail/RunTimeline';
import { StageApprovalBanner } from './detail/StageApprovalBanner';
import { StageInProgress } from './detail/StageInProgress';
import { VerificationSummary } from './detail/VerificationSummary';

const RunDetailPage: FC = () => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const navigate = useNavigate();
  const params = useParams<{ ns: string; name: string }>();
  const name = params.name ?? '';
  const namespace = params.ns;

  const {
    run,
    view,
    runLoaded,
    runError,
    resultsLoaded,
    resultsError,
    canApprove,
    canApproveLoading,
    needsApproval,
    approveStage,
    approveExecution,
    denyStage,
    mutationInProgress,
    mutationError,
    clearMutationError,
  } = useAgenticRun(name, namespace);

  const phaseKey = view?.phase ?? 'unknown';
  const [selectedOption, setSelectedOption] = useState(0);
  const [expandedOption, setExpandedOption] = useState(0);

  const executedOptionIndex = view?.executedOptionIndex;
  useEffect(() => {
    const idx = executedOptionIndex ?? 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedOption(idx);

    setExpandedOption(idx);
  }, [phaseKey, executedOptionIndex]);

  const selectOption = useCallback((idx: number) => {
    setSelectedOption(idx);
    setExpandedOption((prev) => (prev === idx ? -1 : idx));
  }, []);

  const [executeOptionIndex, setExecuteOptionIndex] = useState<number | null>(null);
  const [denyingStage, setDenyingStage] = useState<ApprovalStageType | null>(null);

  const openExecuteModal = useCallback(() => {
    setExecuteOptionIndex(selectedOption);
  }, [selectedOption]);

  const handleApproveExecution = useCallback(async () => {
    if (executeOptionIndex === null) return;
    const success = await approveExecution(executeOptionIndex);
    if (success) setExecuteOptionIndex(null);
  }, [approveExecution, executeOptionIndex]);

  const handleDeny = useCallback(async () => {
    if (!denyingStage) return;
    const success = await denyStage(denyingStage);
    if (success) setDenyingStage(null);
  }, [denyStage, denyingStage]);

  const optionData =
    executeOptionIndex !== null ? (view?.options[executeOptionIndex] ?? undefined) : undefined;

  const renderRemediationHub = (v: AgenticRunView): ReactNode => {
    switch (v.phase) {
      case 'Pending':
      case 'Analyzing':
        return (
          <Card>
            <CardBody>
              <Flex direction={{ default: 'column' }}>
                <FlexItem>
                  <Content component={ContentVariants.small}>
                    <em>{t('Remediation options will appear once analysis is complete.')}</em>
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Skeleton screenreaderText={t('Loading remediation options')} width="70%" />
                </FlexItem>
                <FlexItem>
                  <Skeleton width="30%" />
                </FlexItem>
                <FlexItem>
                  <Skeleton width="50%" />
                </FlexItem>
              </Flex>
            </CardBody>
          </Card>
        );

      case 'NoActionRequired':
        return (
          <Alert isInline title={t('No remediation needed')} variant="info">
            {t('Analysis determined that no action is required for this run.')}
          </Alert>
        );

      case 'Proposed':
        return (
          <>
            {v.options.length > 0 ? (
              <>
                {v.advisory && (
                  <Alert
                    isInline
                    title={t(
                      'This is an advisory-only run. Review the recommendations below and apply changes externally.',
                    )}
                    variant="info"
                  />
                )}
                {v.options.map((option) => (
                  <RemediationOptionCard
                    canApprove={canApprove}
                    canApproveLoading={canApproveLoading}
                    isExpanded={expandedOption === option.index}
                    isSelected={selectedOption === option.index}
                    key={option.index}
                    mutationInProgress={mutationInProgress}
                    onExecute={v.advisory ? undefined : openExecuteModal}
                    onSelect={() => selectOption(option.index)}
                    onToggleExpand={() => selectOption(option.index)}
                    option={option}
                  />
                ))}
              </>
            ) : (
              <EmptyState>
                <EmptyStateBody>
                  {t('No remediation options were generated by the analysis.')}
                </EmptyStateBody>
              </EmptyState>
            )}
            {!v.advisory && (
              <Flex>
                <FlexItem>
                  <ApprovalGatedButton
                    canApprove={canApprove}
                    canApproveLoading={canApproveLoading}
                    mutationInProgress={mutationInProgress}
                    onClick={() => setDenyingStage('Execution')}
                    variant="secondary"
                  >
                    {t('Deny run')}
                  </ApprovalGatedButton>
                </FlexItem>
              </Flex>
            )}
          </>
        );

      case 'Executing':
        return (
          <>
            {renderOptionCards({ showSpinner: true })}
            {v.executionSandbox && (
              <StageInProgress
                sandbox={v.executionSandbox}
                sinceTime={v.executionStartedAt}
                title={t('Execution')}
              />
            )}
          </>
        );

      case 'Verifying':
        return (
          <>
            {renderOptionCards({})}
            {v.execution && <ExecutionSummary execution={v.execution} />}
            {needsApproval.Verification ? (
              <StageApprovalBanner
                canApprove={canApprove}
                canApproveLoading={canApproveLoading}
                mutationError={mutationError}
                mutationInProgress={mutationInProgress}
                onApprove={() => approveStage('Verification')}
                onClearError={clearMutationError}
                stageType="Verification"
              />
            ) : (
              v.verificationSandbox && (
                <StageInProgress
                  sandbox={v.verificationSandbox}
                  sinceTime={v.verificationStartedAt}
                  title={t('Verification')}
                />
              )
            )}
          </>
        );

      case 'Escalating':
        return (
          <>
            {v.options.length > 0 && renderOptionCards({})}
            {v.execution && <ExecutionSummary execution={v.execution} />}
            {v.verification && <VerificationSummary verification={v.verification} />}
            {needsApproval.Escalation ? (
              <StageApprovalBanner
                canApprove={canApprove}
                canApproveLoading={canApproveLoading}
                mutationError={mutationError}
                mutationInProgress={mutationInProgress}
                onApprove={() => approveStage('Escalation')}
                onClearError={clearMutationError}
                stageType="Escalation"
              />
            ) : (
              v.escalationSandbox && (
                <StageInProgress
                  sandbox={v.escalationSandbox}
                  sinceTime={v.escalationStartedAt}
                  title={t('Escalation')}
                />
              )
            )}
          </>
        );

      default:
        if (TERMINAL_PHASES.includes(v.phase)) {
          return (
            <>
              {v.options.length > 0 && renderOptionCards({})}
              {v.execution && <ExecutionSummary execution={v.execution} />}
              {v.verification && <VerificationSummary verification={v.verification} />}
              {v.escalation && <EscalationSummary escalation={v.escalation} />}
            </>
          );
        }
        return null;
    }
  };

  const renderOptionCards = (opts: { showSpinner?: boolean }) => {
    if (!view) return null;
    if (view.executedOptionIndex !== undefined && view.executedOptionIndex < view.options.length) {
      const executedOption = view.options[view.executedOptionIndex];
      if (executedOption) {
        return (
          <RemediationOptionCard
            isExpanded={expandedOption === executedOption.index}
            isSelected
            onSelect={() => selectOption(executedOption.index)}
            onToggleExpand={() => selectOption(executedOption.index)}
            option={executedOption}
            readOnly
            showSpinner={opts.showSpinner}
          />
        );
      }
    }
    return view.options.map((option) => (
      <RemediationOptionCard
        isExpanded={expandedOption === option.index}
        isSelected={selectedOption === option.index}
        key={option.index}
        onSelect={() => selectOption(option.index)}
        onToggleExpand={() => selectOption(option.index)}
        option={option}
        readOnly
        showSpinner={opts.showSpinner && selectedOption === option.index}
      />
    ));
  };

  return (
    <AgenticLayout>
      <DocumentTitle>
        {t('{{name}} details', { name: run?.metadata?.name || name || t('Run') })}
      </DocumentTitle>

      <PageGroup>
        <PageSection hasBodyWrapper={false}>
          <Breadcrumb>
            <BreadcrumbItem
              onClick={(e) => {
                e.preventDefault();
                navigate('/lightspeed/runs');
              }}
              to="#"
            >
              {t('Agentic runs')}
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{run?.metadata?.name ?? name}</BreadcrumbItem>
          </Breadcrumb>
        </PageSection>

        <Divider />

        <PageSection hasBodyWrapper={false}>
          <Content>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsSm' }}
              >
                <FlexItem>
                  <ResourceIcon groupVersionKind={LightspeedAgenticRunGVK} />
                </FlexItem>
                <FlexItem>
                  <Title headingLevel="h1">{run?.metadata?.name || name}</Title>
                </FlexItem>
                <FlexItem>
                  <PreviewBadge />
                </FlexItem>
                {view &&
                  view.targetNamespaces?.map((ns) => (
                    <FlexItem key={ns}>
                      <ResourceLink kind="Namespace" name={ns} />
                    </FlexItem>
                  ))}
              </Flex>
              {view && (
                <FlexItem>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <RunPhaseLabel phase={view.phase} />
                    </FlexItem>
                    {view.source && (
                      <FlexItem>
                        <Label
                          isCompact
                          variant="outline"
                        >{`${t('Trigger domain')}: ${view.source}`}</Label>
                      </FlexItem>
                    )}
                  </Flex>
                </FlexItem>
              )}
              <FlexItem>
                <Content component={ContentVariants.small}>
                  {t('Created')} <Timestamp simple timestamp={run?.metadata?.creationTimestamp} />
                </Content>
              </FlexItem>
            </Flex>
          </Content>

          {view?.failureReason && <Alert isInline title={view.failureReason} variant="danger" />}

          {resultsError && (
            <Alert isInline title={t('Unable to load run results.')} variant="warning" />
          )}
        </PageSection>

        <Divider />

        <StatusGuard
          data={run?.metadata?.name ? run : undefined}
          label={t('Run')}
          loaded={runLoaded}
          loadError={runError}
        >
          <PageSection hasBodyWrapper={false}>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Title headingLevel="h3">{t('Agentic run details')}</Title>
              </FlexItem>

              <FlexItem>
                <small>
                  <Flex spaceItems={{ default: 'spaceItemsXs' }}>
                    <FlexItem>
                      <InfoCircleIcon color="var(--pf-t--global--icon--color--status--info--default)" />
                    </FlexItem>
                    <FlexItem>
                      {t(
                        'The autonomous features of OpenShift Lightspeed use AI technology to generate output.',
                      )}{' '}
                      {t('Always review AI-generated content prior to use.')}
                    </FlexItem>
                  </Flex>
                </small>
              </FlexItem>
            </Flex>

            <Flex spaceItems={{ default: 'spaceItemsXs' }}>
              <FlexItem>
                <Title headingLevel="h4">{t('Analysis request')}</Title>
              </FlexItem>
              <FlexItem>
                <Popover
                  aria-label="Analysis request info"
                  bodyContent={
                    <div>
                      {t(
                        'The original prompt or alert event string sent to the AI agent to initiate analysis.',
                      )}
                    </div>
                  }
                  headerContent={<div>{t('Analysis request')}</div>}
                >
                  <Button
                    aria-label="Analysis request info"
                    icon={<OutlinedQuestionCircleIcon />}
                    variant="plain"
                  />
                </Popover>
              </FlexItem>
            </Flex>

            {view && (
              <AnalysisSummary
                analysisRequest={view.request}
                analysisSandbox={view.analysisSandbox}
                analysisStartedAt={view.analysisStartedAt}
                canApprove={canApprove}
                canApproveLoading={canApproveLoading}
                hasRemediationOptions={view.options.length > 0}
                mutationError={mutationError}
                mutationInProgress={mutationInProgress}
                needsApproval={needsApproval.Analysis}
                onApproveAnalysis={() => approveStage('Analysis')}
                onClearError={clearMutationError}
                phase={view.phase}
                rootCause={view.rootCause}
              />
            )}

            <Flex
              direction={{ default: 'column' }}
              gap={{ default: 'gapXs' }}
              spaceItems={{ default: 'spaceItemsXs' }}
            >
              <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <Title headingLevel="h4">{t('Remediation hub')}</Title>
                </FlexItem>
                <FlexItem>
                  <Label isCompact>{t('AI-generated')}</Label>
                </FlexItem>
                {resultsLoaded && view && view.phase === 'Proposed' && view.options.length > 0 && (
                  <FlexItem>
                    <Label isCompact variant="outline">
                      {t('{{count}} remediation option', { count: view.options.length })}
                    </Label>
                  </FlexItem>
                )}
              </Flex>
              {resultsLoaded && view?.analysisCreatedAt && (
                <FlexItem>
                  <Content component={ContentVariants.small}>
                    {t('Created')} <Timestamp simple timestamp={view.analysisCreatedAt} />
                  </Content>
                </FlexItem>
              )}
            </Flex>

            {!resultsLoaded ? (
              <Skeleton screenreaderText={t('Loading remediation options')} />
            ) : view ? (
              renderRemediationHub(view)
            ) : null}

            {resultsLoaded &&
              view &&
              !TERMINAL_PHASES.includes(view.phase) &&
              view.phase !== 'Proposed' &&
              (needsApproval.Analysis ||
                needsApproval.Verification ||
                needsApproval.Escalation) && (
                <Flex>
                  <FlexItem>
                    <ApprovalGatedButton
                      canApprove={canApprove}
                      canApproveLoading={canApproveLoading}
                      mutationInProgress={mutationInProgress}
                      onClick={() => {
                        if (needsApproval.Analysis) setDenyingStage('Analysis');
                        else if (needsApproval.Verification) setDenyingStage('Verification');
                        else if (needsApproval.Escalation) setDenyingStage('Escalation');
                      }}
                      variant="secondary"
                    >
                      {t('Deny run')}
                    </ApprovalGatedButton>
                  </FlexItem>
                </Flex>
              )}

            {resultsLoaded && view && view.timeline.length > 0 && (
              <RunTimeline events={view.timeline} />
            )}
          </PageSection>
        </StatusGuard>
      </PageGroup>

      <ConfirmationModal
        actionLabel={t('Execute remediation')}
        actionVariant="danger"
        body={
          <Flex direction={{ default: 'column' }}>
            <FlexItem>
              {t("You're about to run the automated script for Option {{ selectedOptionIndex }}", {
                selectedOptionIndex: executeOptionIndex !== null ? executeOptionIndex + 1 : 0,
              })}
              :{' '}
              <strong>
                <MarkdownContent inline text={optionData?.title ?? ''} />
              </strong>
            </FlexItem>
            {optionData?.reversibility && optionData.reversibility !== 'Reversible' && (
              <FlexItem>
                <Alert
                  title={t('This action is {{ reversibility }}', {
                    reversibility: getReversibilityText(optionData?.reversibility ?? '', t),
                  })}
                  variant="warning"
                >
                  <p>{getReversibilityDescription(optionData?.reversibility ?? '', t)}</p>
                </Alert>
              </FlexItem>
            )}
            <FlexItem>
              <Content component={ContentVariants.small}>
                {t(
                  'OpenShift Lightspeed uses AI technology to help generate this remediation plan.',
                )}
              </Content>
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
        isOpen={executeOptionIndex !== null}
        onAction={handleApproveExecution}
        onClose={() => {
          setExecuteOptionIndex(null);
          clearMutationError();
        }}
        title={t('Execute remediation?')}
      />

      <ConfirmationModal
        actionLabel={t('Deny run')}
        actionVariant="danger"
        body={t(
          'Denying this run will stop all further actions. Are you sure you want to proceed?',
        )}
        error={mutationError}
        isLoading={mutationInProgress}
        isOpen={denyingStage !== null}
        onAction={handleDeny}
        onClose={() => {
          setDenyingStage(null);
          clearMutationError();
        }}
        title={t('Confirm Deny')}
      />
    </AgenticLayout>
  );
};

export default RunDetailPage;
