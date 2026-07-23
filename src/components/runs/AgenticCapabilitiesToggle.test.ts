import { describe, expect, test } from 'vitest';
import { buildSuspendedPatch } from './agenticCapabilitiesUtils';

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
