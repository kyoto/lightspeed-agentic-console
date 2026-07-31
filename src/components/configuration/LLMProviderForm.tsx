import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  FormGroup,
  FormSelect,
  FormSelectOption,
  TextInput,
  Title,
} from '@patternfly/react-core';

import { LLMProviderType } from '../../models/agenticrun';

const PROVIDER_TYPES: { value: LLMProviderType; label: string }[] = [
  { value: 'Anthropic', label: 'Anthropic' },
  { value: 'GoogleCloudVertex', label: 'Google Cloud Vertex AI' },
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'AzureOpenAI', label: 'Azure OpenAI' },
  { value: 'AWSBedrock', label: 'AWS Bedrock' },
];

type LLMProviderFormProps = {
  onSubmit: (name: string, spec: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
};

const LLMProviderForm: React.FC<LLMProviderFormProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');

  const [name, setName] = React.useState('');
  const [providerType, setProviderType] = React.useState<LLMProviderType>('Anthropic');
  const [secretName, setSecretName] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [projectID, setProjectID] = React.useState('');
  const [region, setRegion] = React.useState('');
  const [endpoint, setEndpoint] = React.useState('');
  const [apiVersion, setApiVersion] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const resetProviderFields = () => {
    setSecretName('');
    setUrl('');
    setProjectID('');
    setRegion('');
    setEndpoint('');
    setApiVersion('');
  };

  const buildSpec = (): Record<string, unknown> => {
    const base = { credentialsSecret: { name: secretName } };
    const withUrl = url ? { ...base, url } : base;

    switch (providerType) {
      case 'Anthropic':
        return { type: 'Anthropic', anthropic: withUrl };
      case 'GoogleCloudVertex':
        return {
          type: 'GoogleCloudVertex',
          googleCloudVertex: { ...withUrl, projectID, region },
        };
      case 'OpenAI':
        return { type: 'OpenAI', openAI: withUrl };
      case 'AzureOpenAI': {
        const cfg: Record<string, unknown> = { ...withUrl, endpoint };
        if (apiVersion) cfg.apiVersion = apiVersion;
        return { type: 'AzureOpenAI', azureOpenAI: cfg };
      }
      case 'AWSBedrock':
        return { type: 'AWSBedrock', awsBedrock: { ...withUrl, region } };
    }
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
    if (!name || !secretName) return false;
    if (providerType === 'GoogleCloudVertex' && (!projectID || !region)) return false;
    if (providerType === 'AzureOpenAI' && !endpoint) return false;
    if (providerType === 'AWSBedrock' && !region) return false;
    return true;
  };

  return (
    <div className="ols-plugin__config-form-section">
      <Title headingLevel="h3">{t('Create LLM Provider')}</Title>

      {error && <p className="ols-plugin__config-error-text">{error}</p>}

      <FormGroup fieldId="provider-name" isRequired label={t('Name')}>
        <TextInput id="provider-name" isRequired onChange={(_e, v) => setName(v)} value={name} />
      </FormGroup>

      <FormGroup fieldId="provider-type" isRequired label={t('Provider Type')}>
        <FormSelect
          id="provider-type"
          onChange={(_e, v) => {
            setProviderType(v as LLMProviderType);
            resetProviderFields();
          }}
          value={providerType}
        >
          {PROVIDER_TYPES.map((pt) => (
            <FormSelectOption key={pt.value} label={pt.label} value={pt.value} />
          ))}
        </FormSelect>
      </FormGroup>

      <FormGroup fieldId="provider-secret" isRequired label={t('Credentials Secret Name')}>
        <TextInput
          id="provider-secret"
          isRequired
          onChange={(_e, v) => setSecretName(v)}
          value={secretName}
        />
      </FormGroup>

      {providerType === 'GoogleCloudVertex' && (
        <>
          <FormGroup fieldId="provider-project" isRequired label={t('Project ID')}>
            <TextInput
              id="provider-project"
              isRequired
              onChange={(_e, v) => setProjectID(v)}
              value={projectID}
            />
          </FormGroup>
          <FormGroup fieldId="provider-region" isRequired label={t('Region')}>
            <TextInput
              id="provider-region"
              isRequired
              onChange={(_e, v) => setRegion(v)}
              value={region}
            />
          </FormGroup>
        </>
      )}

      {providerType === 'AWSBedrock' && (
        <FormGroup fieldId="provider-region" isRequired label={t('Region')}>
          <TextInput
            id="provider-region"
            isRequired
            onChange={(_e, v) => setRegion(v)}
            value={region}
          />
        </FormGroup>
      )}

      {providerType === 'AzureOpenAI' && (
        <>
          <FormGroup fieldId="provider-endpoint" isRequired label={t('Endpoint')}>
            <TextInput
              id="provider-endpoint"
              isRequired
              onChange={(_e, v) => setEndpoint(v)}
              value={endpoint}
            />
          </FormGroup>
          <FormGroup fieldId="provider-api-version" label={t('API Version')}>
            <TextInput
              id="provider-api-version"
              onChange={(_e, v) => setApiVersion(v)}
              placeholder="2024-02-01"
              value={apiVersion}
            />
          </FormGroup>
        </>
      )}

      <FormGroup fieldId="provider-url" label={t('URL override')}>
        <TextInput
          id="provider-url"
          onChange={(_e, v) => setUrl(v)}
          placeholder={t('Optional')}
          value={url}
        />
      </FormGroup>

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

export default LLMProviderForm;
