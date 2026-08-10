import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { PermissionRule } from '../models/agenticrun';

export const buildPluralToKindMap = (models: { [key: string]: K8sModel }): Map<string, string> => {
  const map = new Map<string, string>();
  for (const model of Object.values(models)) {
    const key = `${model.apiGroup ?? ''}/${model.plural}`;
    map.set(key, model.kind);
  }
  return map;
};

export const resolveKind = (
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

export const isWriteVerb = (v: string): boolean => v === '*' || WRITE_VERBS.has(v);

export const hasWriteVerb = (rule: PermissionRule): boolean => rule.verbs.some(isWriteVerb);

export const formatResource = (rule: PermissionRule): string => {
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

export const summarizeWritePermissions = (rules: PermissionRule[]): string =>
  rules
    .flatMap((rule) => {
      const wv = rule.verbs.filter(isWriteVerb);
      return wv.length ? rule.resources.map((r) => `${wv.join('/')} ${r}`) : [];
    })
    .join(' · ');

export interface NamespaceGroup {
  namespace: string;
  rules: PermissionRule[];
}

export const groupByNamespace = (rules: PermissionRule[]): NamespaceGroup[] => {
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
