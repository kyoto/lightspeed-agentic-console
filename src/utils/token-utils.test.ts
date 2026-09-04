import { describe, expect, it } from 'vitest';

import type { AgenticRunK8s } from '../models/agenticrun';
import { compareTokenUsage, formatTokenCell, getTokenTotal } from './token-utils';

/** Minimal AgenticRunK8s factory - only the fields token-utils touches. */
const makeRun = (
  name: string,
  tokenUsage?: { inputTokens?: number; outputTokens?: number },
): AgenticRunK8s =>
  ({
    apiVersion: 'agentic.openshift.io/v1alpha1',
    kind: 'AgenticRun',
    metadata: { name, namespace: 'ns' },
    spec: { request: '' },
    status: tokenUsage !== undefined ? { tokenUsage } : undefined,
  }) as AgenticRunK8s;

// ---------------------------------------------------------------------------
// getTokenTotal
// ---------------------------------------------------------------------------

describe('getTokenTotal', () => {
  it('returns undefined when status is absent', () => {
    expect(getTokenTotal(makeRun('a'))).toBeUndefined();
  });

  it('returns undefined when tokenUsage is absent', () => {
    const run = makeRun('a');
    run.status = {};
    expect(getTokenTotal(run)).toBeUndefined();
  });

  it('returns undefined when tokenUsage is empty (both fields undefined)', () => {
    expect(getTokenTotal(makeRun('a', {}))).toBeUndefined();
  });

  it('returns 0 when both fields are zero', () => {
    expect(getTokenTotal(makeRun('a', { inputTokens: 0, outputTokens: 0 }))).toBe(0);
  });

  it('sums both fields', () => {
    expect(getTokenTotal(makeRun('a', { inputTokens: 100, outputTokens: 50 }))).toBe(150);
  });

  it('treats a missing field as 0 in the sum', () => {
    expect(getTokenTotal(makeRun('a', { inputTokens: 42 }))).toBe(42);
    expect(getTokenTotal(makeRun('a', { outputTokens: 7 }))).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// formatTokenCell
// ---------------------------------------------------------------------------

describe('formatTokenCell', () => {
  it('returns "-" when status is absent', () => {
    expect(formatTokenCell(makeRun('a'))).toBe('-');
  });

  it('returns "-" when tokenUsage is absent', () => {
    const run = makeRun('a');
    run.status = {};
    expect(formatTokenCell(run)).toBe('-');
  });

  it('renders inputTokens and outputTokens with locale formatting', () => {
    const result = formatTokenCell(makeRun('a', { inputTokens: 12345, outputTokens: 6789 }));
    // toLocaleString() in Node produces locale-dependent output; check structural pattern
    expect(result).toContain('/');
    expect(result).toContain('12');
    expect(result).toContain('6');
  });

  it('renders "- / -" when tokenUsage is empty (both fields undefined)', () => {
    expect(formatTokenCell(makeRun('a', {}))).toBe('- / -');
  });

  it('renders "0 / 0" for valid zero usage (distinct from absent)', () => {
    expect(formatTokenCell(makeRun('a', { inputTokens: 0, outputTokens: 0 }))).toBe('0 / 0');
  });

  it('renders "-" for a missing individual field', () => {
    expect(formatTokenCell(makeRun('a', { inputTokens: 100 }))).toBe('100 / -');
    expect(formatTokenCell(makeRun('a', { outputTokens: 50 }))).toBe('- / 50');
  });
});

// ---------------------------------------------------------------------------
// compareTokenUsage
// ---------------------------------------------------------------------------

describe('compareTokenUsage', () => {
  const withTokens = makeRun('with-100', { inputTokens: 80, outputTokens: 20 }); // total 100
  const withZero = makeRun('with-0', { inputTokens: 0, outputTokens: 0 }); // total 0
  const withLarge = makeRun('with-500', { inputTokens: 300, outputTokens: 200 }); // total 500
  const missing1 = makeRun('missing-1'); // no status at all
  const missing2 = makeRun('missing-2'); // no status at all

  it('sorts ascending: 0 < 100 < 500', () => {
    const sorted = compareTokenUsage([withLarge, withTokens, withZero], 'asc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-0', 'with-100', 'with-500']);
  });

  it('sorts descending: 500 > 100 > 0', () => {
    const sorted = compareTokenUsage([withZero, withTokens, withLarge], 'desc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-500', 'with-100', 'with-0']);
  });

  it('pushes missing values to the end when ascending', () => {
    const sorted = compareTokenUsage([missing1, withZero, withTokens], 'asc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-0', 'with-100', 'missing-1']);
  });

  it('pushes missing values to the end when descending', () => {
    const sorted = compareTokenUsage([missing1, withLarge, withZero], 'desc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-500', 'with-0', 'missing-1']);
  });

  it('keeps multiple missing values together at the end (ascending)', () => {
    const sorted = compareTokenUsage([missing1, withTokens, missing2], 'asc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-100', 'missing-1', 'missing-2']);
  });

  it('keeps multiple missing values together at the end (descending)', () => {
    const sorted = compareTokenUsage([missing2, withTokens, missing1], 'desc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-100', 'missing-2', 'missing-1']);
  });

  it('empty tokenUsage ({}) sorts to the end like missing, not with zero-usage rows', () => {
    const emptyUsage = makeRun('empty-usage', {});
    const sorted = compareTokenUsage([emptyUsage, withZero, withTokens], 'asc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-0', 'with-100', 'empty-usage']);
  });

  it('empty tokenUsage ({}) sorts to the end in descending order too', () => {
    const emptyUsage = makeRun('empty-usage', {});
    const sorted = compareTokenUsage([emptyUsage, withLarge, withZero], 'desc');
    expect(sorted.map((r) => r.metadata.name)).toEqual(['with-500', 'with-0', 'empty-usage']);
  });

  it('zero usage is NOT at the end - only truly missing values go there', () => {
    const sorted = compareTokenUsage([missing1, withZero, withTokens], 'asc');
    // withZero (0) sorts BEFORE withTokens (100) - not pushed to end like missing
    expect(sorted[0].metadata.name).toBe('with-0');
    expect(sorted[2].metadata.name).toBe('missing-1');
  });
});
