# Run Lifecycle

The core domain of the plugin: displaying and managing runs through a multi-stage workflow.

## Behavioral Rules

### Phase Derivation

1. The plugin MUST derive the run phase from `status.conditions[]`, not from a stored phase field. The function `derivePhaseFromConditions` implements this logic and MUST match the operator's `DerivePhase` in `lightspeed-agentic-operator/api/v1alpha1/agenticrun_types.go`.
2. Phase derivation follows condition priority: EmergencyStopped > Escalated > Denied > Verified > Executed > Analyzed > Pending. Within the `Analyzed` condition, if the reason is `NoActionRequired`, the run maps to the `Completed` phase instead of `Proposed`. The `isNoActionRequired` helper checks this same condition/reason pair so the UI can distinguish a no-action-required completion from a normal one.
3. Within each condition, `status: True` means the stage completed successfully, `status: Unknown` means the stage is in progress, and `status: False` means the stage failed (unless a specific `reason` indicates retry).
4. The `Verified` condition with reason `RetryingExecution` maps to the `Executing` phase (not `Failed`).

### Run Phases

5. Valid phases are: Pending, Analyzing, Proposed, Executing, Verifying, Escalating, Completed, Failed, Denied, Escalated, EmergencyStopped.
6. Terminal phases are: Completed, Failed, Denied, Escalated, EmergencyStopped. No approval actions are shown for terminal runs.
6a. A run enters `EmergencyStopped` when the operator triggers an emergency halt (e.g., security policy violation). The console displays it as a terminal error state with no approve/deny controls. No user action is possible.
6b. When a `Completed` run's `Analyzed` condition has reason `NoActionRequired` (`view.noActionRequired`), the console displays an info alert instead of the normal terminal summary — no remediation proposal or approve/deny controls are shown. The run is complete — no user action is needed or available.

### Run List

7. The list page MUST watch all `AgenticRun` CRs across namespaces and display them in a virtualized table.
8. The list MUST support filtering by phase and text search. A trigger domain filter is shown alongside the phase filter, populated dynamically from distinct `agentic.openshift.io/source` label values across watched AgenticRun CRs.
9. Each row MUST show: name (linked to detail), phase label, request preview (truncated to 80 chars), namespace, trigger domain, [PLANNED: OLS-3578] tokens consumed, and age.
9a. The trigger domain column reads from the `agentic.openshift.io/source` label on the AgenticRun CR. Shows "-" when the label is absent. Depends on [OLS-3299] for backend population of the label.
9b. [PLANNED: OLS-3578] The tokens consumed column displays an aggregate token count. The source field does not yet exist on the CRD — the backend must add either a summary field on `AgenticRunStatus` (preferred, avoids per-row result CR fetches on the list page) or token count fields on the individual result CRs. Shows "—" during analyzing or when the data is unavailable.
9c. [PLANNED: OLS-3578] Each row has a kebab menu with a "Delete" action. Delete calls `k8sDelete` on the AgenticRun CR and is gated by RBAC — the plugin performs a `useAccessReview` check for `delete` verb on `agenticruns` in API group `agentic.openshift.io`. If the user lacks permission, the action is disabled.
9d. [PLANNED: OLS-3578] The list page MUST display a title, a description summarizing the page's purpose, and an advisory reminding users to review AI-generated content.

### Run Detail — Layout

10. The detail page MUST display content progressively as data becomes available. The run header (breadcrumb, title, phase label, creation timestamp, failure/results alerts) MUST render immediately without waiting for result CRs. The detail section (RCA, remediation hub, timeline) MUST be gated behind a loading/error guard (`StatusGuard`): show a spinner while loading, an error state on failure (403 → restricted access, 404 → not found, other → error message with detail), and the section content when data is ready. `AnalysisSummary` MUST be gated on `view` (available once the run CR loads), not on `resultsLoaded`, so the analysis request prompt and analysis phase state display without waiting for all result CRs. Remediation hub and timeline remain gated on `resultsLoaded`.
11. The detail page uses a single-page section layout (not tabs). Sections are rendered conditionally based on the current phase: Analysis request, Remediation options, Execution summary, Verification summary, Escalation summary, and Timeline.
11a. Legal disclaimer banner — persistent info alert below the detail page title/status: "OpenShift Lightspeed uses AI technology to help generate remediation plans. Always review AI-generated content prior to use."
11b. AI-generated content labeling — section headings for AI-generated content (Root cause analysis, Remediation hub, Verification summary, Escalation summary) MUST display a compact "AI-generated" label inline next to the heading text.
12. During in-progress stages (Analyzing, Executing, Verifying, Escalating), the page MUST show a `StageInProgress` card with embedded live log streaming from the sandbox pod, unless a manual approval gate for that stage is pending (`StageApprovalBanner` is shown instead).
13. The page MUST be wrapped in `AgenticLayout` to display the system-suspended banner when the agentic config has `suspended: true`.

### Approval Flow

14. Each stage (Analysis, Execution, Verification, Escalation) can independently require approval based on the `AgenticRunApproval` CR.
14a. **Authorization gate.** Before rendering Approve/Deny buttons, the plugin MUST perform a `useAccessReview` check for `patch` verb on `agenticrunapprovals` resource in API group `agentic.openshift.io`. The namespace MUST fall back from `approval.metadata.namespace` to the run's `metadata.namespace` when the approval CR has not loaded yet. If the user lacks the permission, the buttons MUST be disabled (using `isAriaDisabled` so hover/focus events remain active for the tooltip) with a tooltip stating "You must be a member of system:cluster-admins to approve or deny runs." This check is performed in the `useAgenticRun` hook and exposed as `canApprove`/`canApproveLoading` on the returned view model. The `RemediationOptionCard` component receives `canApprove` as a prop to gate its Execute/Deny buttons, and `ConfirmationModal` is used for execution confirmation. The `approveStage()` and deny callbacks in `useAgenticRun` MUST also guard against `!canApprove` as defense-in-depth. This prevents confusing 403 errors — the API server enforces the real gate.
14b. **Stage approval gates.** When any non-Execution stage requires manual approval, the detail page shows an approval prompt (`StageApprovalBanner`) with an "Approve [stage]" button (primary) in place of the normal in-progress or skeleton UI for that stage. A "Deny run" button (secondary) is shown below the remediation hub when any non-Execution approval gate is pending. Both buttons are permission-gated via `canApprove` from `useAgenticRun`. Approving opens a confirmation modal; denying uses the existing deny confirmation modal. The plugin determines whether a stage needs manual approval from the `AgenticRunApproval` CR alone — when the `ApprovalPolicy` sets a stage to `Automatic`, the operator pre-populates the corresponding entry in `approval.spec.stages[]` at creation time, so a missing entry indicates manual approval is required. Execution keeps its own card-based approval flow (remediation option selection in the `Proposed` phase).
15. Approval decisions are written as JSON patches to the `AgenticRunApproval` CR, not to the `AgenticRun` CR.
16. When approving execution, the user can select a specific remediation option (by index) and specify retry count (0-3). Each option's remediation plan contains concrete bash commands (kubectl/oc) visible in the approval view.
17. Execution approval uses a `ConfirmationModal` — the user clicks Execute on a remediation option card, which opens a modal dialog for confirmation with loading state and inline error display.
17a. The execution confirmation modal body includes a legal disclaimer: "OpenShift Lightspeed uses AI technology to help generate remediation plans. Always review AI-generated content prior to use."
17b. [PLANNED: OLS-3579] Stop execution button — a red danger button shown on the detail page for all non-terminal phases (not shown for Completed, Failed, Denied, Escalated, EmergencyStopped). Opens a confirmation modal. On confirm, patches the AgenticRun CR to trigger emergency stop. Gated by a dedicated RBAC check (`canEmergencyStop`) for `patch` verb on `agenticruns` in API group `agentic.openshift.io`. The emergency-stop callback MUST guard against `!canEmergencyStop` as defense-in-depth, and the backend MUST enforce matching authorization on the AgenticRun emergency-stop patch endpoint. The per-run stop mechanism does not yet exist on the CRD — backend must define the patch contract ([OLS-3298]).
18. The user can select which Agent to use for each approval stage. The available agents are fetched from the cluster-scoped Agent CRD list.

### Remediation Options

19. Analysis produces one or more `RemediationOption` objects, each containing diagnosis, proposed remediation (a concrete script of ordered bash commands using kubectl/oc), RBAC requirements derived from those commands, and a verification plan. Each action in the remediation plan includes `command` (exact bash command), `type` (phase category: pre-check, mutation, wait, post-check), and `description`. [OLS-3441]
20. When multiple options exist, they are rendered as expandable cards with a "Select this option" button.
21. RBAC permissions shown in the run are derived from the concrete bash commands in the remediation script and locked at approval time — the UI shows a warning alert stating the agent cannot escalate its own privileges. When `rbac` is present on a remediation option, a `RequiredPermissions` section displays a permission count, write-verb summary, and a collapsed expandable containing a single unified table with Namespace, Resource, Verbs, and Purpose columns. The grouped `namespaceScoped`/`clusterScoped` wire contract is flattened into one ordered rule list in the frontend. Each row's Namespace cell shows a purple "Cluster-wide" label for cluster-scoped rules or a namespace resource link for namespace-scoped rules; the Resource cell shows the resource icon and name when specific resource names are requested, otherwise the resource string; scope count badges in the section header are derived from the flattened rule list. [OLS-3441, OLS-3809, OLS-3919]
19a. [PLANNED: OLS-3661] Analysis token count — display the total token count for the full analysis as a badge on the root cause analysis card ("X tokens (analysis)"). This is a single count for the entire analysis. Source field does not yet exist on the CRD.
19b. Remove the confidence tag from the root cause analysis display.
19c. [PLANNED: OLS-3579] Remediation execution record — structured record above the execution log showing: selected option, max attempts, "Executed by" username + timestamp from `AgenticRunApproval.spec.approver`.
19d. [PLANNED: OLS-3579] Download plan button on remediation option cards — verify existing JSON download aligns with design; update if different.
19e. The "Analysis request" section displays the original prompt or alert event string that initiated the run, with a help popover explaining its purpose. Below it, the analysis sandbox log viewer is available when the sandbox has run.
19f. When remediation options exist, root cause analysis is displayed within each remediation option card. Each card shows the detected cause and detail, alongside estimated impact, proposed agent commands, rollback plan, and verification steps. When no remediation options are available, root cause analysis is shown below the analysis request section.
21a. When the run is in the `Failed` phase and analysis produced no remediation options, the remediation hub MUST render a failure card — a red "Failed" label with an error icon and the failure reason text — rather than the empty terminal content that would otherwise show. The failure reason is `view.failureReason`, which falls back to the failing AgenticRun condition's `reason: message` (via `deriveFailureReason`) when no result CR reports a `status.failureReason`. When a `Failed` run does have remediation options (e.g., a mid-run execution or verification failure), the hub renders the normal terminal summary (option cards and stage summaries) unchanged.

### Refine Flow [PLANNED]

22. [PLANNED] After analysis completes, the user can submit revision feedback via a "Refine" button. The `revisionFeedback` field exists in the CRD type definition but no UI component currently renders the Refine button.
23. [PLANNED] Refinement writes `spec.revisionFeedback` to the `AgenticRun` CR via patch. If the value already exists, it uses `replace`; otherwise `add`.
24. [PLANNED] A revision is considered pending when `spec.revisionFeedback` is set AND `metadata.generation` exceeds the `observedGeneration` on the `Analyzed` condition.

### Sandbox Log Streaming

25. While a stage is in progress, the plugin streams logs from the sandbox pod's `agent` container.
26. Log streaming uses `follow: true` with automatic reconnection on stream end or error (exponential backoff from 1s to 15s).
27. When the streaming result data arrives, the log viewer auto-collapses to an expandable section.
28. Logs are capped at 20,000 lines.

### Escalation

29. Verification failure enables an "Escalate" button that opens a confirmation modal.
30. Escalation approval creates an Escalation stage in the `AgenticRunApproval` CR.
31. The detail page watches `EscalationResult` CRs via the same label-selector pattern as other result CRs (`agentic.openshift.io/run`) and maps them into the run view (`EscalationView`).
32. While the run is in the `Escalating` phase: if escalation requires manual approval, show `StageApprovalBanner`; otherwise show `StageInProgress` with sandbox log streaming from `status.steps.escalation.sandbox`.
33. On terminal phases that include an escalation result, the page renders an `EscalationSummary` card. The card body is freeform AI-generated markdown from `EscalationResult.status.summary` and, when present and different, `status.content` — rendered as unmarked markdown (not titled subsections or an expandable section).
34. `EscalationSummary` MUST NOT render when the mapped view has no `summary`, `content`, or escalation sandbox. Failure-only results (system/agent error with only `status.failureReason`) surface via the page-level danger alert that aggregates stage `failureReason` values, not as an empty card. The page-level alert is suppressed for a `Failed` run with no remediation options — that failure is shown in the remediation hub failure card instead (see 21a).
35. Timeline events include Escalation started/completed conditions from the `EscalationResult` (same condition-to-event mapping as Analysis/Execution/Verification).

## Constraints

- The `derivePhaseFromConditions` function is a behavioral contract with the operator. Changes require synchronization.
- The approval patch structure depends on whether `spec`, `spec.stages`, or individual stages already exist — three patch variants are generated accordingly.
