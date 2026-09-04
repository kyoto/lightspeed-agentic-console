import type { AgenticRunK8s } from '../models/agenticrun';

/**
 * Returns the total token count for sorting, or `undefined` when the run
 * has no token data at all. This lets callers distinguish "zero usage" from
 * "no data yet" - absent rows sort to the end of the list.
 */
export const getTokenTotal = (obj: AgenticRunK8s): number | undefined => {
  const tu = obj.status?.tokenUsage;
  if (!tu) return undefined;
  // Both fields undefined means no data yet - treat like missing for sorting, not zero.
  if (tu.inputTokens == null && tu.outputTokens == null) return undefined;
  return (tu.inputTokens ?? 0) + (tu.outputTokens ?? 0);
};

/**
 * Formats the token cell content.
 *
 * - Both values present: "12,345 / 6,789" (locale-formatted)
 * - tokenUsage exists but a field is absent: "- / 6,789" or "12,345 / -"
 * - tokenUsage missing entirely: "-"
 */
export const formatTokenCell = (obj: AgenticRunK8s): string => {
  const tu = obj.status?.tokenUsage;
  if (!tu) return '-';

  const inp = tu.inputTokens != null ? tu.inputTokens.toLocaleString() : '-';
  const out = tu.outputTokens != null ? tu.outputTokens.toLocaleString() : '-';
  return `${inp} / ${out}`;
};

/**
 * Sort comparator for the token column. Rows with no tokenUsage sort to the
 * END regardless of sort direction - they should never intermix with rows
 * that have actual (even zero) usage.
 */
export const compareTokenUsage = (
  data: AgenticRunK8s[],
  direction: 'asc' | 'desc',
): AgenticRunK8s[] =>
  [...data].sort((a, b) => {
    const totalA = getTokenTotal(a);
    const totalB = getTokenTotal(b);

    // Both missing → stable (equal)
    if (totalA === undefined && totalB === undefined) return 0;
    // One missing → push it to the end, regardless of direction
    if (totalA === undefined) return 1;
    if (totalB === undefined) return -1;

    const cmp = totalA - totalB;
    return direction === 'desc' ? -cmp : cmp;
  });
