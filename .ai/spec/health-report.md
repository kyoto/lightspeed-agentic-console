# Spec health report

Last evaluated: 2026-08-31
Trigger: post-milestone (drift sweep — OLS-3578 / OLS-3579 / OLS-3688 / OLS-3919 shipped work)
Layout: software (.ai/spec/)

## Stale

Fixed in this pass (were misaligned with current code):

- **run-lifecycle rule 9** — list columns claimed "phase label, request preview (80 chars), namespace". Actual columns: name, **target namespaces** (`spec.targetNamespaces`), trigger domain, phase, tokens, age, kebab. No request-preview column exists; "namespace" is now target namespaces (OLS-3983). Fixed.
- **run-lifecycle rule 9b** — `[PLANNED: OLS-3578]` tokens column and "source field does not yet exist on the CRD" were stale. Shipped: column reads `status.usage.totalTokens` (`TokenUsage` type exists). Marker removed.
- **run-lifecycle rule 9c** — `[PLANNED: OLS-3578]` kebab delete was stale. Shipped (`RunKebab`, `useAccessReview` delete verb, `k8sDelete`, `ConfirmationModal`). Marker removed.
- **run-lifecycle rule 9d** — `[PLANNED: OLS-3578]` title/description/advisory was stale. Shipped (`ListPageHeader` title + help-text advisory + `PreviewBadge`). Marker removed.
- **run-lifecycle rule 14a** — tooltip text was "You must be a member of system:cluster-admins…"; actual text is "You don't have permission to approve or deny runs." Also the disabled/tooltip logic is now centralized in the new `ApprovalGatedButton`. Fixed.
- **run-lifecycle rule 18** — described an Agent-selection feature (cluster-scoped Agent CRD list) with no `[PLANNED]` marker. No Agent model/GVK, no Agent in the CRD inventory, no picker UI. Marked `[PLANNED]` with the gap noted.
- **run-lifecycle rule 19a** — "source field does not yet exist on the CRD" partially stale: a run-level `status.usage.totalTokens` now exists (shown in list). Kept `[PLANNED: OLS-3661]` (no per-analysis field / no badge rendered) and clarified.
- **run-lifecycle rules 19c/19d** — `[PLANNED: OLS-3579]` execution record and download-plan were stale. Both shipped (`ExecutionSummary.executionRecord`; "Download plan" button in `RemediationOptionCard`). Markers removed; 19c corrected (no "max attempts" field is rendered — only selected option + approved-by username/timestamp).
- **system-overview Planned Changes table** — OLS-3578 (fully shipped) and OLS-3688 (StageApprovalBanner shipped) removed. OLS-3579 reduced to its one remaining item (stop-execution button). Added OLS-3661 and the Audit & logs page as explicit planned rows.
- **project-structure module map** — added missing files that exist in the tree: `ApprovalGatedButton.tsx`, `PreviewBadge.tsx`, `runs/AgenticCapabilitiesToggle.tsx` + `agenticCapabilitiesUtils.ts`, `configuration/ExecutionPolicyModal.tsx`, `runs/detail/StageApprovalBanner.tsx`, `utils/rbac-utils.ts`.

## Missing

Documented in this pass (shipped behavior that had no spec coverage):

- **System suspend/resume toggle** — `AgenticCapabilitiesToggle` on the run list page creates/patches `AgenticOLSConfig.spec.suspended` (RBAC-gated). Added run-lifecycle rule 9e.
- **Execution automatic-policy acknowledgment** — `ExecutionPolicyModal` requires two checkbox acknowledgments when switching the Execution stage to Automatic. Added configuration rule 5a.

Remaining gap (not fixed — no behavioral spec invented):

- **Audit & logs page** (`/lightspeed/audit`) — still `[PLANNED]` in system-overview rules 2/3; route and subnav not yet registered in `console-extensions.json`. Behavioral spec intentionally not written.

## Structural concerns

None. what/ (behavioral) vs how/ (navigation) separation holds. `decisions/` directory exists with a README but contains no ADR files yet — informational only.

## Findability issues

None. Quick-start and cross-reference tables in README.md cover all existing spec files; no new spec files were added.

## No issues (verified current)

- CRD inventory (system-overview rule 9) matches `src/models/agenticrun.ts` plurals (agenticruns, agenticrunapprovals, approvalpolicies, analysis/execution/verification/escalation results, agenticolsconfigs).
- NoActionRequired → Completed mapping (rules 2, 6b; OLS-4015) matches `derivePhaseFromConditions` / `isNoActionRequired` / `view.noActionRequired`.
- StageApprovalBanner vs StageInProgress gating (rules 12, 14b, 32) matches `RunDetailPage.tsx`.
- RBAC permissions unified table (rule 21; OLS-3809/3919) matches `RequiredPermissions.tsx` + `rbac-utils.ts` (`flattenRbacRules`).
- k8s-data-layer module map and result-CR label-selector correlation match `useAgenticRun.ts` / `agenticrun.ts`.
- console-extensions.json routes/nav and `exposedModules` match console-plugin-system.md and project-structure entry points.
- e2e-testing.md matches `.tekton/` pipeline and `integration-tests/` layout.
