# Configuration

The Configuration page (`/lightspeed/configuration`) provides cluster-wide settings for the agentic system, accessible via a gear icon on the run list page. The page is scoped to approval policy only; LLM provider and agent configuration is managed at the operator/infrastructure level and has no user-facing surface.

## Behavioral Rules

### Navigation

1. The Configuration page MUST be reachable from the run list page via a gear icon button.
2. A breadcrumb MUST link back to the agentic runs list.
3. The page renders the approval policy view directly as its body — there is no tab navigation. A heading subtitle describes the page.

### Approval Policy

4. The ApprovalPolicy CR is cluster-scoped with a singleton name `cluster`.
5. Each of the four stages (Analysis, Execution, Verification, Escalation) can be set to `Manual` or `Automatic` via toggle groups.
6. Max retry attempts are configurable between 1 and 3 via a number input.
7. If the ApprovalPolicy CR does not exist, saving creates it with `maxConcurrentAgenticRuns: 5` as the default.
8. If the CR exists, saving patches `spec.stages` and `spec.maxAttempts` via replace operations.

## Constraints

- All configuration CRDs use the same `agentic.openshift.io/v1alpha1` API group/version as runs.
- The ApprovalPolicy singleton pattern means only one policy governs the entire cluster.
