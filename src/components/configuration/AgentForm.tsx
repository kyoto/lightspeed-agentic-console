import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ExpandableSection,
  FormGroup,
  FormSelect,
  FormSelectOption,
  NumberInput,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { LLMProviderK8s } from '../../models/agenticrun';

type AgentFormProps = {
  providers: LLMProviderK8s[];
  onSubmit: (name: string, spec: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
};

const AgentForm: React.FC<AgentFormProps> = ({ providers, onSubmit, onCancel }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  const [name, setName] = React.useState('');
  const [providerName, setProviderName] = React.useState('');
  const [model, setModel] = React.useState('');

  React.useEffect(() => {
    if (!providerName && providers.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProviderName(providers[0].metadata.name);
    }
  }, [providers, providerName]);
  const [maxTurns, setMaxTurns] = React.useState(100);
  const [analysisSeconds, setAnalysisSeconds] = React.useState(300);
  const [executionSeconds, setExecutionSeconds] = React.useState(600);
  const [verificationSeconds, setVerificationSeconds] = React.useState(300);
  const [chatSeconds, setChatSeconds] = React.useState(120);
  const [showTimeouts, setShowTimeouts] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const buildSpec = (): Record<string, unknown> => {
    const spec: Record<string, unknown> = {
      llmProvider: { name: providerName },
      model,
      maxTurns,
    };
    if (showTimeouts) {
      spec.timeouts = {
        analysisSeconds,
        executionSeconds,
        verificationSeconds,
        chatSeconds,
      };
    }
    return spec;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onSubmit(name, buildSpec());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  };

  const isValid = (): boolean => {
    return !!name && !!providerName && !!model;
  };

  const clampedNumberInput = (
    value: number,
    min: number,
    max: number,
    setter: (v: number) => void,
  ) => (
    <NumberInput
      max={max}
      min={min}
      onChange={(e) => {
        const val = Number((e.target as HTMLInputElement).value);
        if (val >= min && val <= max) setter(val);
      }}
      onMinus={() => setter(Math.max(min, value - 30))}
      onPlus={() => setter(Math.min(max, value + 30))}
      value={value}
    />
  );

  return (
    <div className="ols-plugin__config-form-section">
      <Title headingLevel="h3">{t('Create Agent')}</Title>

      {error && <p className="ols-plugin__config-error-text">{error}</p>}

      <FormGroup fieldId="agent-name" isRequired label={t('Name')}>
        <TextInput
          id="agent-name"
          isRequired
          onChange={(_e, v) => setName(v)}
          placeholder="default"
          value={name}
        />
      </FormGroup>

      <FormGroup fieldId="agent-provider" isRequired label={t('LLM Provider')}>
        <FormSelect
          id="agent-provider"
          onChange={(_e, v) => setProviderName(v)}
          value={providerName}
        >
          {providers.length ? (
            providers.map((p) => (
              <FormSelectOption
                key={p.metadata.name}
                label={p.metadata.name}
                value={p.metadata.name}
              />
            ))
          ) : (
            <FormSelectOption isDisabled label={t('No providers available')} value="" />
          )}
        </FormSelect>
      </FormGroup>

      <FormGroup fieldId="agent-model" isRequired label={t('Model')}>
        <TextInput
          id="agent-model"
          isRequired
          onChange={(_e, v) => setModel(v)}
          placeholder="claude-opus-4-6"
          value={model}
        />
      </FormGroup>

      <FormGroup fieldId="agent-max-turns" label={t('Max Turns')}>
        {clampedNumberInput(maxTurns, 1, 500, setMaxTurns)}
      </FormGroup>

      <ExpandableSection
        isExpanded={showTimeouts}
        onToggle={(_e, expanded) => setShowTimeouts(expanded)}
        toggleText={showTimeouts ? t('Hide timeouts') : t('Show timeouts')}
      >
        <FormGroup fieldId="agent-timeout-analysis" label={t('Analysis (seconds)')}>
          {clampedNumberInput(analysisSeconds, 1, 3600, setAnalysisSeconds)}
        </FormGroup>
        <FormGroup fieldId="agent-timeout-execution" label={t('Execution (seconds)')}>
          {clampedNumberInput(executionSeconds, 1, 3600, setExecutionSeconds)}
        </FormGroup>
        <FormGroup fieldId="agent-timeout-verification" label={t('Verification (seconds)')}>
          {clampedNumberInput(verificationSeconds, 1, 3600, setVerificationSeconds)}
        </FormGroup>
        <FormGroup fieldId="agent-timeout-chat" label={t('Chat (seconds)')}>
          {clampedNumberInput(chatSeconds, 1, 600, setChatSeconds)}
        </FormGroup>
      </ExpandableSection>

      <div className="ols-plugin__config-form-actions">
        <Button
          isDisabled={!isValid() || submitting}
          isLoading={submitting}
          onClick={handleSubmit}
          variant="primary"
        >
          {t('Create')}
        </Button>
        <Button isDisabled={submitting} onClick={onCancel} variant="link">
          {t('Cancel')}
        </Button>
      </div>
    </div>
  );
};

export default AgentForm;
