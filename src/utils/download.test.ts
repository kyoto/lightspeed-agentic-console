// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';

import { stubAnchorDownload, stubObjectUrl } from '../test-helpers';
import { createTextUrl, downloadBlob, downloadText } from './download';

describe('createTextUrl', () => {
  test('wraps the text in a plain-text blob and keeps the URL alive', async () => {
    const { createObjectURL, revokeObjectURL } = stubObjectUrl();

    expect(createTextUrl('line one\nline two')).toBe('blob:fake');

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/plain;charset=utf-8');
    await expect(blob.text()).resolves.toBe('line one\nline two');
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe('downloadBlob', () => {
  test('clicks an anchor that downloads the blob under the filename', () => {
    const { createObjectURL, revokeObjectURL } = stubObjectUrl();
    const { click, getLastAnchor } = stubAnchorDownload();
    const blob = new Blob(['content'], { type: 'text/plain' });

    downloadBlob(blob, 'file.txt');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(getLastAnchor()?.href).toBe('blob:fake');
    expect(getLastAnchor()?.download).toBe('file.txt');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  test('revokes the URL one second after the click', () => {
    const { revokeObjectURL } = stubObjectUrl();
    stubAnchorDownload();

    downloadBlob(new Blob(['content']), 'file.txt');

    vi.advanceTimersByTime(999);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});

describe('downloadText', () => {
  test('downloads the text as a plain-text blob under the given filename', async () => {
    const { createObjectURL } = stubObjectUrl();
    const { getLastAnchor } = stubAnchorDownload();

    downloadText('line one\nline two', 'sandbox-pod.log');

    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe('text/plain;charset=utf-8');
    await expect(blob.text()).resolves.toBe('line one\nline two');
    expect(getLastAnchor()?.download).toBe('sandbox-pod.log');
  });
});
