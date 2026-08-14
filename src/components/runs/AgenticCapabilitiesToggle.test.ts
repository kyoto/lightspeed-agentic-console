import { describe, expect, test } from 'vitest';
import {
  buildAgenticOLSConfig,
  buildSuspendedPatch,
  isNotFoundError,
} from './agenticCapabilitiesUtils';

describe('buildSuspendedPatch', () => {
  test('returns replace op setting suspended to true', () => {
    expect(buildSuspendedPatch(true)).toEqual([
      { op: 'add', path: '/spec/suspended', value: true },
    ]);
  });

  test('returns replace op setting suspended to false', () => {
    expect(buildSuspendedPatch(false)).toEqual([
      { op: 'add', path: '/spec/suspended', value: false },
    ]);
  });
});

describe('buildAgenticOLSConfig', () => {
  test('builds a cluster config with the given suspended value', () => {
    expect(buildAgenticOLSConfig(true)).toEqual({
      apiVersion: 'agentic.openshift.io/v1alpha1',
      kind: 'AgenticOLSConfig',
      metadata: { name: 'cluster' },
      spec: { suspended: true },
    });
  });
});

describe('isNotFoundError', () => {
  test('is true for a 404 error', () => {
    expect(isNotFoundError({ code: 404 })).toBe(true);
  });

  test('is false for other error codes', () => {
    expect(isNotFoundError({ code: 403 })).toBe(false);
    expect(isNotFoundError({ code: 500 })).toBe(false);
  });

  test('is false for errors without a code', () => {
    expect(isNotFoundError(new Error('network down'))).toBe(false);
  });

  test('is false when there is no error', () => {
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});
