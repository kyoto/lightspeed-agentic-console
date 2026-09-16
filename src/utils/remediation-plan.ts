import { RemediationOptionView } from '../models/agenticrun-views';

export const downloadRemediationOption = (option: RemediationOptionView): void => {
  const blob = new Blob([JSON.stringify(option, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `remediation-option-${option.index + 1}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};
