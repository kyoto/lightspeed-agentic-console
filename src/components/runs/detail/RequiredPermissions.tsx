import {
  Alert,
  Banner,
  Content,
  ContentVariants,
  ExpandableSection,
  Flex,
  FlexItem,
  Label,
  Title,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { K8sModel, ResourceIcon, useK8sModels } from '@openshift-console/dynamic-plugin-sdk';
import { type FC, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AgentRbac, PermissionRule } from '../../../models/agenticrun';
import './detail.css';

const buildPluralToKindMap = (models: { [key: string]: K8sModel }): Map<string, string> => {
  const map = new Map<string, string>();
  for (const model of Object.values(models)) {
    const key = `${model.apiGroup ?? ''}/${model.plural}`;
    map.set(key, model.kind);
  }
  return map;
};

const resolveKind = (
  pluralToKind: Map<string, string>,
  apiGroups: string[],
  plural: string,
): string | undefined => {
  for (const g of apiGroups) {
    const kind = pluralToKind.get(`${g}/${plural}`);
    if (kind) return kind;
  }
  return undefined;
};

const WRITE_VERBS = new Set(['create', 'update', 'patch', 'delete', 'deletecollection']);

const isWriteVerb = (v: string): boolean => v === '*' || WRITE_VERBS.has(v);

const hasWriteVerb = (rule: PermissionRule): boolean => rule.verbs.some(isWriteVerb);

const formatResource = (rule: PermissionRule): string => {
  const nonEmptyGroups = rule.apiGroups.filter((g) => g !== '');
  let result = rule.resources.join(', ');
  if (rule.resourceNames?.length) {
    result += ` [${rule.resourceNames.join(', ')}]`;
  }
  if (nonEmptyGroups.length > 0) {
    result += ` (${nonEmptyGroups.join(', ')})`;
  }
  return result;
};

const summarizeWritePermissions = (rules: PermissionRule[]): string =>
  rules
    .flatMap((rule) => {
      const wv = rule.verbs.filter(isWriteVerb);
      return wv.length ? rule.resources.map((r) => `${wv.join('/')} ${r}`) : [];
    })
    .join(' · ');

interface NamespaceGroup {
  namespace: string;
  rules: PermissionRule[];
}

const groupByNamespace = (rules: PermissionRule[]): NamespaceGroup[] => {
  const map = new Map<string, PermissionRule[]>();
  for (const rule of rules) {
    const ns = rule.namespace ?? '';
    if (!map.has(ns)) map.set(ns, []);
    map.get(ns)!.push(rule);
  }
  return Array.from(map.entries()).map(([namespace, nsRules]) => ({
    namespace,
    rules: nsRules,
  }));
};

interface PermissionTableProps {
  label: string;
  rules: PermissionRule[];
  pluralToKind: Map<string, string>;
}

const PermissionTable: FC<PermissionTableProps> = ({ label, rules, pluralToKind }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  return (
    <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
      <FlexItem>
        <Banner className="ols-plugin__remediation-card-header--title">
          <strong>{label}</strong>
        </Banner>
      </FlexItem>
      <FlexItem>
        <Table variant="compact">
          <Thead>
            <Tr>
              <Th>{t('Resource')}</Th>
              <Th>{t('Verbs')}</Th>
              <Th>{t('Purpose')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {rules.map((rule, i) => {
              const kinds = rule.resources.map((r) => resolveKind(pluralToKind, rule.apiGroups, r));
              const allResolved = kinds.every(Boolean);
              return (
                <Tr key={i}>
                  <Td dataLabel={t('Resource')}>
                    {allResolved ? (
                      <Flex
                        alignItems={{ default: 'alignItemsCenter' }}
                        spaceItems={{ default: 'spaceItemsXs' }}
                      >
                        {kinds.map((kind, j) => (
                          <FlexItem key={rule.resources[j]}>
                            <ResourceIcon kind={kind ?? rule.resources[j]} />
                          </FlexItem>
                        ))}
                        <FlexItem>
                          <code>{rule.resources.join(', ')}</code>
                        </FlexItem>
                        {!!rule.resourceNames?.length && (
                          <FlexItem>
                            <code>{(rule.resourceNames ?? []).join(', ')}</code>
                          </FlexItem>
                        )}
                      </Flex>
                    ) : (
                      <code>{formatResource(rule)}</code>
                    )}
                  </Td>
                  <Td dataLabel={t('Verbs')}>
                    <code>{rule.verbs.join(', ')}</code>
                  </Td>
                  <Td dataLabel={t('Purpose')}>
                    {rule.justification}{' '}
                    {hasWriteVerb(rule) && (
                      <Label color="orange" isCompact>
                        {t('write')}
                      </Label>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </FlexItem>
    </Flex>
  );
};

interface RequiredPermissionsProps {
  rbac: AgentRbac;
}

export const RequiredPermissions: FC<RequiredPermissionsProps> = ({ rbac }) => {
  const { t } = useTranslation('plugin__lightspeed-agentic-console-plugin');
  const [isExpanded, setIsExpanded] = useState(false);
  const [models] = useK8sModels();

  const pluralToKind = useMemo(() => buildPluralToKindMap(models), [models]);
  const allNamespaceRules = useMemo(() => rbac.namespaceScoped ?? [], [rbac.namespaceScoped]);
  const allClusterRules = useMemo(() => rbac.clusterScoped ?? [], [rbac.clusterScoped]);
  const totalRules = allNamespaceRules.length + allClusterRules.length;

  const namespaceGroups = useMemo(() => groupByNamespace(allNamespaceRules), [allNamespaceRules]);
  const writeSummary = useMemo(
    () => summarizeWritePermissions([...allNamespaceRules, ...allClusterRules]),
    [allNamespaceRules, allClusterRules],
  );

  if (totalRules === 0) return null;

  return (
    <FlexItem>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
        <FlexItem>
          <Title className="ols-plugin__remediation-card-header--title" headingLevel="h6">
            {t('Required permissions')}
          </Title>
        </FlexItem>
        <FlexItem>
          <Alert
            isInline
            isPlain
            title={t(
              'Permissions are locked at approval. The agent cannot escalate its privileges beyond these rules.',
            )}
            variant="warning"
          />
        </FlexItem>
        <FlexItem>
          <Flex
            alignItems={{ default: 'alignItemsCenter' }}
            spaceItems={{ default: 'spaceItemsSm' }}
          >
            {allNamespaceRules.length > 0 && (
              <FlexItem>
                <Label color="blue" isCompact>
                  {t('{{count}} namespace permission', { count: allNamespaceRules.length })}
                </Label>
              </FlexItem>
            )}
            {allClusterRules.length > 0 && (
              <FlexItem>
                <Label color="purple" isCompact>
                  {t('{{count}} cluster-wide permission', { count: allClusterRules.length })}
                </Label>
              </FlexItem>
            )}
            {writeSummary && (
              <FlexItem>
                <Content component={ContentVariants.small}>
                  {`${t('Includes write')}: ${writeSummary}`}
                </Content>
              </FlexItem>
            )}
          </Flex>
        </FlexItem>
        <FlexItem>
          <ExpandableSection
            isExpanded={isExpanded}
            onToggle={(_e, expanded) => setIsExpanded(expanded)}
            toggleText={isExpanded ? t('Hide permission details') : t('View permission details')}
          >
            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
              {namespaceGroups.map((group) => (
                <FlexItem key={group.namespace}>
                  <PermissionTable
                    label={
                      group.namespace
                        ? `${t('Namespace')}: ${group.namespace}`
                        : t('Namespace-scoped (unspecified)')
                    }
                    pluralToKind={pluralToKind}
                    rules={group.rules}
                  />
                </FlexItem>
              ))}
              {allClusterRules.length > 0 && (
                <FlexItem>
                  <PermissionTable
                    label={t('Cluster-wide')}
                    pluralToKind={pluralToKind}
                    rules={allClusterRules}
                  />
                </FlexItem>
              )}
            </Flex>
          </ExpandableSection>
        </FlexItem>
      </Flex>
    </FlexItem>
  );
};
