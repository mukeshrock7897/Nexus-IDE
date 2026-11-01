/**
 * Security & Validation Module for Nexus IDE Main & Backend Processes
 * Enforces IPC channel allowlisting, workspace path traversal checks, and shell command risk classification.
 */

import type { CommandRiskAssessment, IpcChannel } from '../src/shared/ipc-types';

export const ALLOWED_IPC_CHANNELS: ReadonlySet<IpcChannel> = new Set<IpcChannel>([
  'nexus:workspace:list',
  'nexus:workspace:save',
  'nexus:workspace:delete',
  'nexus:workspace:rename',
  'nexus:terminal:execute',
  'nexus:terminal:classify',
  'nexus:git:status',
  'nexus:git:stage',
  'nexus:git:commit',
  'nexus:ai:chat',
  'nexus:ai:inline-edit',
  'nexus:ai:autocomplete',
  'nexus:ai:agent-plan',
  'nexus:ai:review',
  'nexus:ai:generate-tests',
  'nexus:rag:search',
  'nexus:mcp:list',
  'nexus:mcp:invoke',
  'nexus:window:control',
  'nexus:macos:open-dialog',
  'nexus:macos:save-dialog',
  'nexus:macos:keychain-status',
  'nexus:macos:app-paths',
]);

export function isValidIpcChannel(channel: string): channel is IpcChannel {
  return ALLOWED_IPC_CHANNELS.has(channel as IpcChannel);
}

/**
 * Prevents directory traversal outside the project workspace root.
 */
export function validateWorkspacePath(filePath: string): { valid: boolean; normalized: string; error?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, normalized: '', error: 'File path must be a non-empty string.' };
  }

  const trimmed = filePath.trim().replace(/\\/g, '/');
  if (trimmed.includes('\0')) {
    return { valid: false, normalized: '', error: 'Null byte detected in file path.' };
  }

  const segments = trimmed.split('/').filter(Boolean);
  for (const segment of segments) {
    if (segment === '..') {
      return { valid: false, normalized: '', error: 'Path traversal (..) is prohibited outside workspace root.' };
    }
  }

  const normalized = '/' + segments.join('/');
  return { valid: true, normalized };
}

/**
 * Classifies terminal commands by security impact to drive the IDE Command Approval workflow.
 */
export function classifyCommandRisk(
  rawCommand: string,
  policy: 'strict' | 'moderate' | 'permissive' = 'moderate'
): CommandRiskAssessment {
  const command = rawCommand.trim();

  if (!command) {
    return {
      command: '',
      riskLevel: 'safe',
      requiresApproval: false,
      reason: 'Empty command.',
    };
  }

  const criticalPatterns = [
    /\brm\s+(-rf|-fr|--no-preserve-root)/i,
    /\bsudo\b/i,
    /\bchmod\s+777\b/i,
    /\bmkfs\b/i,
    /\bdd\s+if=/i,
    /\bcurl\b.*\|\s*(sh|bash|zsh)/i,
    /\bwget\b.*\|\s*(sh|bash|zsh)/i,
    /\bgit\s+push\s+--force\b/i,
    /\bgit\s+reset\s+--hard\b/i,
    /\bdrop\s+table\b/i,
  ];

  for (const pattern of criticalPatterns) {
    if (pattern.test(command)) {
      return {
        command,
        riskLevel: 'critical',
        requiresApproval: true,
        reason: 'Destructive or privilege-escalating operation detected.',
      };
    }
  }

  const moderatePatterns = [
    /\brm\b/i,
    /\bmv\b/i,
    /\bnpm\s+(install|i|uninstall|publish)\b/i,
    /\bgit\s+(commit|push|checkout|merge|rebase)\b/i,
    /\bdocker\b/i,
    /\bkill\b/i,
  ];

  for (const pattern of moderatePatterns) {
    if (pattern.test(command)) {
      return {
        command,
        riskLevel: 'moderate',
        requiresApproval: policy === 'strict' || policy === 'moderate',
        reason: 'Workspace-mutating or network package command.',
      };
    }
  }

  return {
    command,
    riskLevel: 'safe',
    requiresApproval:
      policy === 'strict' &&
      !/^(ls|pwd|echo|cat|git\s+status|git\s+log|git\s+diff|npm\s+test|vitest|help|node\s+-v)/i.test(
        command
      ),
    reason: 'Read-only or standard development verification command.',
  };
}
