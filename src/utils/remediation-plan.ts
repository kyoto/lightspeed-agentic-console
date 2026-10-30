import { RemediationOptionView } from '../models/agenticrun-views';
import { downloadBlob } from './download';

export const downloadRemediationOption = (option: RemediationOptionView): void =>
  downloadBlob(
    new Blob([JSON.stringify(option, null, 2)], { type: 'application/json' }),
    `remediation-option-${option.index + 1}.json`,
  );
