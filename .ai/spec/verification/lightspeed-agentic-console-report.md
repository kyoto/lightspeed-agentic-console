# Spec Verification Report: lightspeed-agentic-console

**Date:** 2026-07-24
**Scope:** `.ai/spec/what/` — system-overview.md, run-lifecycle.md, configuration.md, audit-logging.md

---

## Pass 1: Acceptance Criteria

The what/ files do not use `- [ ]` checkbox-style acceptance criteria. Behavioral rules are stated as numbered MUST/MUST NOT rules. Evaluating spec self-completeness against each rule:

### system-overview.md

| Rule | Verdict | Notes |
|---|---|---|
| 1 | PASS | Plugin loading via ConsolePlugin CRD and webpack module federation is fully specified. |
| 2 | PASS | Four routes specified (list, detail, configuration, audit). Audit route correctly marked [PLANNED]. |
| 3 | PASS | Nav section structure specified with subnav items. |
| 4 | PASS | i18n namespace specified. |
| 5 | PASS | CSS prefix convention specified. |
| 6 | PASS | API group and version specified. |
| 7 | PASS | SDK functions for reads and writes specified. |
| 8 | PASS | Backend proxy path documented as unused. |
| 9 | PASS | Pod log streaming path and mechanism specified. |
| 10 | PASS | CRD inventory is comprehensive. |
| 11 | PASS | Result CR discovery mechanism specified. |

### run-lifecycle.md

| Rule | Verdict | Notes |
|---|---|---|
| 1-4 | PASS | Phase derivation logic fully specified. |
| 5-6b | PASS | Valid and terminal phases enumerated. |
| 7-9d | PASS | List page behavior specified (some columns PLANNED). |
| 10-13 | PASS | Detail page layout specified. |
| 14 | **FAIL** | Rule 14 is missing from the numbering sequence (jumps from 13 to 15). |
| 15-19 | PASS | Approval flow fully specified. |
| 20-22 | PASS | Remediation options specified. |
| 20a-20d | PASS | Planned enhancements documented with ticket refs. |
| 23-25 | PASS | Refine flow marked [PLANNED] with sufficient detail. |
| 26-29 | PASS | Sandbox log streaming specified. |
| 30 | **FAIL** | Rule 30 is missing from the numbering sequence (jumps from 29 to 31). |
| 31-33 | PASS | Escalation flow specified. |

### configuration.md

| Rule | Verdict | Notes |
|---|---|---|
| 1-16 | PASS | All configuration page rules are complete. |

### audit-logging.md

| Rule | Verdict | Notes |
|---|---|---|
| 1-5 | PASS | Audit logging responsibilities clearly defined (no-emit, webhook-injected approver). |

**Summary: 2 FAIL** (rule numbering gaps at 14 and 30 in run-lifecycle.md)

---

## Pass 2: Constraint Compliance

Checking what/ files against shared constraints in `ols/.ai/spec/constraints.md`:

| Constraint | Verdict | Notes |
|---|---|---|
| 1. Fork-based workflow | N/A | Process constraint, not spec content. |
| 2. OLS-XXXX commit messages | N/A | Process constraint, not spec content. |
| 3. Squash commits | N/A | Process constraint, not spec content. |
| 4. Jira project key OLS | PASS | All ticket references use OLS- prefix. |
| 5. Classic OLS CRDs: `ols.openshift.io/v1alpha1` | PASS | Not used in this repo (agentic, not classic). |
| 6. Agentic OLS CRDs: `agentic.openshift.io/v1alpha1` | PASS | system-overview.md rule 6: "All custom resources use API group `agentic.openshift.io` version `v1alpha1`". configuration.md constraints section confirms same. |
| 7. Deploy into `openshift-lightspeed` namespace | PASS | No conflicting namespace references. |
| 8. RAG embedding model consistency | N/A | This repo does not use RAG. |

**Summary: 0 violations**

---

## Pass 3: Term Consistency

Skipped — no glossary file exists.

---

## Pass 4: Internal Reference Accuracy

### Reference 1: run-lifecycle.md rule 1 → `lightspeed-agentic-operator/api/v1alpha1/proposal_types.go`
- **Status: BROKEN**
- The file `proposal_types.go` does NOT exist in the operator repo. `DerivePhase` is defined in `lightspeed-agentic-operator/api/v1alpha1/agenticrun_types.go` (line 57).
- The reference should be updated to `agenticrun_types.go`.

### Reference 2: system-overview.md rule 2 → `verification/spec-verify-2026-07-23.md`
- **Status: BROKEN**
- The file `verification/spec-verify-2026-07-23.md` does not exist. The `verification/` directory did not exist until this report created it.

### Reference 3: audit-logging.md → `ols/.ai/spec/what/audit-logging.md` (parent spec)
- **Status: PASS**
- The file exists at `/Users/xavi/street/github.com/AI/ols/.ai/spec/what/audit-logging.md` and covers cross-repo audit requirements.

### Reference 4: audit-logging.md → `run-lifecycle.md` rules 15-19
- **Status: PASS**
- Rules 15 through 19 exist in run-lifecycle.md and cover the approval flow UI.

### Reference 5: audit-logging.md → `configuration.md`
- **Status: PASS**
- configuration.md exists and the reference correctly notes no audit changes needed.

### Reference 6: how/ files referenced from README.md cross-reference table
- **Status: PASS**
- All four how/ files exist: `console-plugin-system.md`, `e2e-testing.md`, `k8s-data-layer.md`, `project-structure.md`.

**Summary: 2 broken references**

---

## Findings Summary

| Category | Count |
|---|---|
| Acceptance criteria fails | 2 |
| Constraint violations | 0 |
| Reference issues | 2 |
| **Total issues** | **4** |

### All Issues

1. **run-lifecycle.md rule numbering gap at 14** — sequence jumps from 13 to 15.
2. **run-lifecycle.md rule numbering gap at 30** — sequence jumps from 29 to 31.
3. **run-lifecycle.md rule 1 broken reference** — cites `proposal_types.go` but `DerivePhase` lives in `agenticrun_types.go`.
4. **system-overview.md rule 2 broken reference** — cites `verification/spec-verify-2026-07-23.md` which does not exist.
