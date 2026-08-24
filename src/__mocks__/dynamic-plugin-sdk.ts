import * as React from 'react';
import { vi } from 'vitest';

export class HttpError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.code = code;
  }
}

export const k8sPatch = vi.fn();
export const k8sCreate = vi.fn();
export const consoleFetch = vi.fn();
export const useK8sWatchResource = vi.fn().mockReturnValue([undefined, false, undefined]);
export const useAccessReview = vi.fn().mockReturnValue([true, false]);
export const useK8sModels = vi.fn().mockReturnValue([{}, false]);

export const DocumentTitle = ({ children }: { children?: React.ReactNode }): React.ReactNode =>
  children;

export const ResourceLink = ({ name }: { name?: string }): React.ReactElement =>
  React.createElement('span', { 'data-test': 'resource-link' }, name);

export const ResourceIcon = ({ kind }: { kind?: string }): React.ReactElement =>
  React.createElement('span', { 'data-test': 'resource-icon' }, kind);

export const Timestamp = ({ timestamp }: { timestamp?: string }): React.ReactElement =>
  React.createElement('span', { 'data-test': 'timestamp' }, timestamp);
