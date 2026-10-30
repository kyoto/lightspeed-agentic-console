import { afterEach, describe, expect, test, vi } from 'vitest';
import { RemediationOptionView } from '../models/agenticrun-views';
import { downloadBlob } from './download';
import { downloadRemediationOption } from './remediation-plan';

vi.mock('./download', () => ({ downloadBlob: vi.fn() }));

const option: RemediationOptionView = {
  cause: 'Memory limit too low',
  description: 'Increase the memory limit',
  detail: 'Pod was OOMKilled',
  index: 1,
  title: 'Restart the pod',
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('downloadRemediationOption', () => {
  test('serializes the option to a JSON blob and downloads it with a 1-based filename', async () => {
    downloadRemediationOption(option);

    expect(downloadBlob).toHaveBeenCalledTimes(1);
    const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
    expect(blob.type).toBe('application/json');
    await expect(blob.text()).resolves.toBe(JSON.stringify(option, null, 2));
    expect(filename).toBe('remediation-option-2.json');
  });
});
