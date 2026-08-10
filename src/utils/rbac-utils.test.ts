import { describe, expect, test } from 'vitest';
import { PermissionRule } from '../models/agenticrun';
import {
  buildPluralToKindMap,
  groupByNamespace,
  resolveKind,
  summarizeWritePermissions,
} from './rbac-utils';

const makeRule = (overrides?: Partial<PermissionRule>): PermissionRule => ({
  apiGroups: [''],
  resources: ['pods'],
  verbs: ['get', 'list'],
  justification: 'Read pods',
  ...overrides,
});

describe('groupByNamespace', () => {
  test('groups rules by namespace', () => {
    const rules = [
      makeRule({ namespace: 'ns-a' }),
      makeRule({ namespace: 'ns-b', resources: ['secrets'] }),
      makeRule({ namespace: 'ns-a', resources: ['configmaps'] }),
    ];
    const groups = groupByNamespace(rules);
    expect(groups).toHaveLength(2);
    expect(groups[0].namespace).toBe('ns-a');
    expect(groups[0].rules).toHaveLength(2);
    expect(groups[1].namespace).toBe('ns-b');
    expect(groups[1].rules).toHaveLength(1);
  });

  test('coalesces undefined namespace to empty string', () => {
    const groups = groupByNamespace([makeRule(), makeRule({ resources: ['secrets'] })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].namespace).toBe('');
    expect(groups[0].rules).toHaveLength(2);
  });

  test('returns empty array for empty input', () => {
    expect(groupByNamespace([])).toEqual([]);
  });

  test('preserves insertion order', () => {
    const rules = [
      makeRule({ namespace: 'z-ns' }),
      makeRule({ namespace: 'a-ns' }),
      makeRule({ namespace: 'z-ns', resources: ['secrets'] }),
    ];
    const groups = groupByNamespace(rules);
    expect(groups[0].namespace).toBe('z-ns');
    expect(groups[1].namespace).toBe('a-ns');
  });
});

describe('summarizeWritePermissions', () => {
  test('returns empty string when no write verbs', () => {
    expect(summarizeWritePermissions([makeRule({ verbs: ['get', 'list', 'watch'] })])).toBe('');
  });

  test('summarizes single write verb and resource', () => {
    expect(summarizeWritePermissions([makeRule({ verbs: ['create'], resources: ['pods'] })])).toBe(
      'create pods',
    );
  });

  test('joins multiple write verbs with slash', () => {
    expect(
      summarizeWritePermissions([
        makeRule({ verbs: ['create', 'delete'], resources: ['secrets'] }),
      ]),
    ).toBe('create/delete secrets');
  });

  test('expands multiple resources into separate entries', () => {
    expect(
      summarizeWritePermissions([
        makeRule({ verbs: ['patch'], resources: ['pods', 'deployments'] }),
      ]),
    ).toBe('patch pods · patch deployments');
  });

  test('filters out non-write verbs', () => {
    expect(
      summarizeWritePermissions([
        makeRule({ verbs: ['get', 'update', 'list'], resources: ['pods'] }),
      ]),
    ).toBe('update pods');
  });

  test('treats wildcard * as a write verb', () => {
    expect(summarizeWritePermissions([makeRule({ verbs: ['*'], resources: ['pods'] })])).toBe(
      '* pods',
    );
  });

  test('joins multiple rules with dot separator', () => {
    expect(
      summarizeWritePermissions([
        makeRule({ verbs: ['create'], resources: ['pods'] }),
        makeRule({ verbs: ['delete'], resources: ['secrets'] }),
      ]),
    ).toBe('create pods · delete secrets');
  });

  test('skips rules with only read verbs', () => {
    expect(
      summarizeWritePermissions([
        makeRule({ verbs: ['get'] }),
        makeRule({ verbs: ['delete'], resources: ['secrets'] }),
      ]),
    ).toBe('delete secrets');
  });
});

describe('buildPluralToKindMap', () => {
  test('builds map from models keyed by apiGroup/plural', () => {
    const models = {
      Pod: { apiGroup: '', plural: 'pods', kind: 'Pod' },
      Deployment: { apiGroup: 'apps', plural: 'deployments', kind: 'Deployment' },
    };
    const map = buildPluralToKindMap(models as never);
    expect(map.get('/pods')).toBe('Pod');
    expect(map.get('apps/deployments')).toBe('Deployment');
  });

  test('defaults missing apiGroup to empty string', () => {
    const models = {
      Secret: { plural: 'secrets', kind: 'Secret' },
    };
    const map = buildPluralToKindMap(models as never);
    expect(map.get('/secrets')).toBe('Secret');
  });

  test('returns empty map for empty models', () => {
    expect(buildPluralToKindMap({} as never).size).toBe(0);
  });
});

describe('resolveKind', () => {
  const pluralToKind = new Map([
    ['/pods', 'Pod'],
    ['apps/deployments', 'Deployment'],
    ['/secrets', 'Secret'],
  ]);

  test('resolves core resource with empty apiGroup', () => {
    expect(resolveKind(pluralToKind, [''], 'pods')).toBe('Pod');
  });

  test('resolves resource with named apiGroup', () => {
    expect(resolveKind(pluralToKind, ['apps'], 'deployments')).toBe('Deployment');
  });

  test('returns undefined for unknown resource', () => {
    expect(resolveKind(pluralToKind, [''], 'widgets')).toBeUndefined();
  });

  test('returns undefined for wrong apiGroup', () => {
    expect(resolveKind(pluralToKind, ['extensions'], 'deployments')).toBeUndefined();
  });

  test('tries multiple apiGroups and returns first match', () => {
    expect(resolveKind(pluralToKind, ['extensions', 'apps'], 'deployments')).toBe('Deployment');
  });

  test('returns undefined for empty apiGroups array', () => {
    expect(resolveKind(pluralToKind, [], 'pods')).toBeUndefined();
  });
});
