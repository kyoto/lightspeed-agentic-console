import { AgenticOLSConfig, AgenticOLSConfigModel } from '../../models/agenticrun';

export const AGENTIC_OLS_CONFIG_NAME = 'cluster';

export const isNotFoundError = (loadError: unknown): boolean =>
  (loadError as { code?: number } | null)?.code === 404;

export const buildSuspendedPatch = (suspended: boolean) => [
  { op: 'add' as const, path: '/spec/suspended', value: suspended },
];

export const buildAgenticOLSConfig = (suspended: boolean): AgenticOLSConfig => ({
  apiVersion: `${AgenticOLSConfigModel.apiGroup}/${AgenticOLSConfigModel.apiVersion}`,
  kind: AgenticOLSConfigModel.kind,
  metadata: { name: AGENTIC_OLS_CONFIG_NAME },
  spec: { suspended },
});
