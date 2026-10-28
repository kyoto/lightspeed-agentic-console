// @vitest-environment jsdom
import { describe, expect, test, vi } from 'vitest';

import { stubAnchorDownload, stubObjectUrl } from '../test-helpers';
import { downloadBlob } from './download';

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
