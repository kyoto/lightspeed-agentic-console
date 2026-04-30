import { derivePhaseFromConditions } from '../models/proposal';
import type { LightspeedProposal, ProposalCondition } from '../models/proposal';
import type { ChatConfig } from './useChat';

export function buildProposalChatConfig(proposal: LightspeedProposal): ChatConfig {
  const context: Record<string, unknown> = {
    remediation: {
      name: proposal.metadata.name,
      namespace: proposal.metadata.namespace,
      request: proposal.spec.request,
    },
  };

  const analysis = proposal.status?.steps?.analysis;
  if (analysis?.options?.length) {
    context.options = analysis.options;
    if (analysis.selectedOption !== undefined) {
      context.selectedOption = analysis.selectedOption;
    }
  }

  const execution = proposal.status?.steps?.execution;
  if (execution?.actionsTaken) {
    context.execution = {
      success: execution.success,
      actionsTaken: execution.actionsTaken,
      verification: execution.verification,
      verificationPassed: derivePhaseFromConditions(proposal.status?.conditions as ProposalCondition[]) === 'Completed',
    };
  }

  const phase = derivePhaseFromConditions(proposal.status?.conditions as ProposalCondition[]);
  if (phase) {
    context.phase = phase;
  }

  if (proposal.status?.previousAttempts?.length) {
    context.previousAttempts = proposal.status.previousAttempts;
  }

  if (proposal.status?.attempts !== undefined) {
    context.attempts = proposal.status.attempts;
  }

  if (proposal.status?.conditions?.length) {
    context.conditions = proposal.status.conditions.map((c) => ({
      type: c.type,
      status: c.status,
      reason: c.reason,
      message: c.message,
    }));
  }

  if (proposal.spec.targetNamespaces?.length) {
    context.targetNamespaces = proposal.spec.targetNamespaces;
  }

  if (proposal.spec.parentRef) {
    context.parentRef = proposal.spec.parentRef;
  }

  const sandbox = analysis?.sandbox;
  return {
    sandboxPod: sandbox?.claimName,
    sandboxNamespace: sandbox?.namespace || 'openshift-lightspeed',
    context,
  };
}
