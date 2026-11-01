/**
 * Real Sandboxed Terminal Execution Service for Nexus IDE
 * Runs developer commands inside .nexus-workspaces/<workspaceId> with risk enforcement and timeout protection.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { classifyCommandRisk } from '../../electron/security';
import type { TerminalExecutionResult } from '../shared/ipc-types';

const execAsync = promisify(exec);
const WORKSPACE_ROOT_DIR = path.resolve(process.cwd(), '.nexus-workspaces');

export async function executeWorkspaceTerminalCommand(
  workspaceId: string,
  rawCommand: string,
  policy: 'strict' | 'moderate' | 'permissive' = 'moderate',
  approved = false
): Promise<TerminalExecutionResult> {
  const command = rawCommand.trim();
  const assessment = classifyCommandRisk(command, policy);

  if (assessment.requiresApproval && !approved) {
    return {
      id: `term-${Date.now()}`,
      command,
      exitCode: 126,
      stdout: '',
      stderr: `Execution paused: Command "${command}" requires explicit approval (${assessment.riskLevel} risk).`,
      durationMs: 1,
      riskAssessment: assessment,
      pendingApproval: true,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
  const cwd = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
  await fs.mkdir(cwd, { recursive: true });

  const startTime = Date.now();

  // Built-in IDE helper commands
  if (command === 'help') {
    return {
      id: `term-${Date.now()}`,
      command,
      exitCode: 0,
      stdout:
        'Nexus IDE Sandboxed Shell (Connected to Disk Workspace: ' +
        cleanWorkspace +
        ')\n' +
        'Supported Commands:\n' +
        '  ls -la                 List real files in workspace directory\n' +
        '  cat <file>             Display file contents from disk\n' +
        '  git status / git log   Run real Git SCM commands in workspace\n' +
        '  git diff               Show real unified Git diff\n' +
        '  python3 <file.py>      Execute Python script in workspace\n' +
        '  node -e "..."          Execute Node.js expression\n' +
        '  npm test               Run Vitest automated test suite\n' +
        '  npm run lint           Run TypeScript strict compiler verification',
      stderr: '',
      durationMs: Date.now() - startTime,
      riskAssessment: assessment,
      timestamp: new Date().toLocaleTimeString(),
    };
  }

  // Route `npm test` / `vitest` / `npm run lint` to the project root where node_modules & vitest live
  const runInProjectRoot = /^(npm\s+test|npx\s+vitest|vitest|npm\s+run\s+lint|tsc\s+--noEmit)/i.test(
    command
  );
  const effectiveCwd = runInProjectRoot ? process.cwd() : cwd;
  const effectiveCommand =
    command === 'npm test' || command === 'vitest' ? 'npx vitest run' : command;

  try {
    const { stdout, stderr } = await execAsync(effectiveCommand, {
      cwd: effectiveCwd,
      timeout: 15000,
      maxBuffer: 4 * 1024 * 1024,
      env: { ...process.env, FORCE_COLOR: '0', CI: 'true' },
    });

    return {
      id: `term-${Date.now()}`,
      command,
      exitCode: 0,
      stdout: stdout.trim() || `Command completed successfully in ${cleanWorkspace}.`,
      stderr: stderr.trim(),
      durationMs: Math.max(4, Date.now() - startTime),
      riskAssessment: assessment,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    const execErr = err as {
      code?: number;
      stdout?: string;
      stderr?: string;
      message?: string;
    };
    return {
      id: `term-${Date.now()}`,
      command,
      exitCode: typeof execErr.code === 'number' ? execErr.code : 1,
      stdout: (execErr.stdout || '').trim(),
      stderr: (execErr.stderr || execErr.message || 'Command execution failed').trim(),
      durationMs: Math.max(4, Date.now() - startTime),
      riskAssessment: assessment,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}
