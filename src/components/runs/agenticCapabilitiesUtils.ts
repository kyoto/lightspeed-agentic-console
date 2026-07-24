export const buildSuspendedPatch = (suspended: boolean) => [
  { op: 'add' as const, path: '/spec/suspended', value: suspended },
];
