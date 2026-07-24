import { describe, expect, it } from 'vitest';

import { derivePhaseFromConditions, getPhaseDisplay } from './agenticrun';
import { cond } from '../test-helpers';

describe('derivePhaseFromConditions', () => {
  it('returns Pending for undefined conditions', () => {
    expect(derivePhaseFromConditions(undefined)).toBe('Pending');
  });

  it('returns Pending for empty conditions', () => {
    expect(derivePhaseFromConditions([])).toBe('Pending');
  });

  it('returns Analyzing for Analyzed=Unknown', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'Unknown')])).toBe('Analyzing');
  });

  it('returns Proposed for Analyzed=True (awaiting execution approval)', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'True')])).toBe('Proposed');
  });

  it('returns NoActionRequired for Analyzed=True with reason NoActionRequired', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'True', 'NoActionRequired')])).toBe(
      'NoActionRequired',
    );
  });

  it('Denied takes priority over NoActionRequired', () => {
    expect(
      derivePhaseFromConditions([
        cond('Denied', 'True'),
        cond('Analyzed', 'True', 'NoActionRequired'),
      ]),
    ).toBe('Denied');
  });

  it('returns Failed for Analyzed=False', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'False')])).toBe('Failed');
  });

  it('returns Executing for Executed=Unknown', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'True'), cond('Executed', 'Unknown')])).toBe(
      'Executing',
    );
  });

  it('returns Verifying for Executed=True', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'True'), cond('Executed', 'True')])).toBe(
      'Verifying',
    );
  });

  it('returns Failed for Executed=False', () => {
    expect(derivePhaseFromConditions([cond('Analyzed', 'True'), cond('Executed', 'False')])).toBe(
      'Failed',
    );
  });

  it('returns Verifying for Verified=Unknown', () => {
    expect(
      derivePhaseFromConditions([
        cond('Analyzed', 'True'),
        cond('Executed', 'True'),
        cond('Verified', 'Unknown'),
      ]),
    ).toBe('Verifying');
  });

  it('returns Completed for Verified=True', () => {
    expect(
      derivePhaseFromConditions([
        cond('Analyzed', 'True'),
        cond('Executed', 'True'),
        cond('Verified', 'True'),
      ]),
    ).toBe('Completed');
  });

  it('returns Executing for Verified=False with RetryingExecution reason', () => {
    expect(
      derivePhaseFromConditions([
        cond('Analyzed', 'True'),
        cond('Executed', 'True'),
        cond('Verified', 'False', 'RetryingExecution'),
      ]),
    ).toBe('Executing');
  });

  it('returns Failed for Verified=False with RetriesExhausted without Escalated condition', () => {
    expect(
      derivePhaseFromConditions([
        cond('Analyzed', 'True'),
        cond('Executed', 'True'),
        cond('Verified', 'False', 'RetriesExhausted'),
      ]),
    ).toBe('Failed');
  });

  it('returns Failed for Verified=False with other reason', () => {
    expect(
      derivePhaseFromConditions([
        cond('Analyzed', 'True'),
        cond('Executed', 'True'),
        cond('Verified', 'False', 'SystemError'),
      ]),
    ).toBe('Failed');
  });

  it('returns Denied for Denied=True', () => {
    expect(derivePhaseFromConditions([cond('Denied', 'True')])).toBe('Denied');
  });

  it('returns Escalated for Escalated=True', () => {
    expect(derivePhaseFromConditions([cond('Escalated', 'True')])).toBe('Escalated');
  });

  it('Escalated takes priority over Denied', () => {
    expect(derivePhaseFromConditions([cond('Escalated', 'True'), cond('Denied', 'True')])).toBe(
      'Escalated',
    );
  });

  it('returns EmergencyStopped for EmergencyStopped=True', () => {
    expect(derivePhaseFromConditions([cond('EmergencyStopped', 'True')])).toBe('EmergencyStopped');
  });

  it('EmergencyStopped takes priority over Analyzed=True', () => {
    expect(
      derivePhaseFromConditions([cond('EmergencyStopped', 'True'), cond('Analyzed', 'True')]),
    ).toBe('EmergencyStopped');
  });

  it('EmergencyStopped takes priority over Escalated=True', () => {
    expect(
      derivePhaseFromConditions([cond('EmergencyStopped', 'True'), cond('Escalated', 'True')]),
    ).toBe('EmergencyStopped');
  });

  it('EmergencyStopped takes priority over Denied=True', () => {
    expect(
      derivePhaseFromConditions([cond('EmergencyStopped', 'True'), cond('Denied', 'True')]),
    ).toBe('EmergencyStopped');
  });
});

describe('getPhaseDisplay', () => {
  it.each([
    ['Pending', { color: 'grey', label: 'Pending' }],
    ['Analyzing', { color: 'blue', label: 'Analyzing' }],
    ['Proposed', { color: 'blue', label: 'Proposed' }],
    ['NoActionRequired', { color: 'green', label: 'No action required' }],
    ['Executing', { color: 'teal', label: 'Executing' }],
    ['Verifying', { color: 'teal', label: 'Verifying' }],
    ['Escalating', { color: 'orange', label: 'Escalating' }],
    ['Completed', { color: 'green', label: 'Completed' }],
    ['Failed', { color: 'red', label: 'Failed' }],
    ['Denied', { color: 'red', label: 'Denied' }],
    ['Escalated', { color: 'orange', label: 'Escalated' }],
    ['EmergencyStopped', { color: 'red', label: 'Emergency stopped' }],
  ])('returns correct display for %s', (phase, expected) => {
    expect(getPhaseDisplay(phase)).toEqual(expected);
  });

  it('returns grey with phase as label for unknown phases', () => {
    expect(getPhaseDisplay('SomeUnknownPhase')).toEqual({
      color: 'grey',
      label: 'SomeUnknownPhase',
    });
  });

  it('returns grey with Unknown label when phase is undefined', () => {
    expect(getPhaseDisplay(undefined)).toEqual({
      color: 'grey',
      label: 'Unknown',
    });
  });
});
