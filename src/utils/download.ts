// Some browsers resolve the blob URL only after click() returns, so revoking it right away can
// drop the download
const REVOKE_DELAY_MS = 1000;

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
};
