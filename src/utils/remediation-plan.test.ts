// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RemediationOptionView } from '../models/agenticrun-views';
import { downloadRemediationOption } from './remediation-plan';

const option: RemediationOptionView = {
  cause: 'Memory limit too low',
  description: 'Increase the memory limit',
  detail: 'Pod was OOMKilled',
  index: 1,
  title: 'Restart the pod',
};

const originalUrlDescriptors = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
};

afterEach(() => {
  vi.restoreAllMocks();
  Object.entries(originalUrlDescriptors).forEach(([key, descriptor]) => {
    if (descriptor) {
      Object.defineProperty(URL, key, descriptor);
      return;
    }
    Reflect.deleteProperty(URL, key);
  });
});

describe('downloadRemediationOption', () => {
  test('serializes the option to a JSON blob and downloads it with a 1-based filename', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:fake');
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    let downloadedAnchor: HTMLAnchorElement | undefined;
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') downloadedAnchor = element as HTMLAnchorElement;
      return element;
    });

    downloadRemediationOption(option);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('application/json');
    await expect(blob.text()).resolves.toBe(JSON.stringify(option, null, 2));
    expect(downloadedAnchor?.download).toBe('remediation-option-2.json');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});
