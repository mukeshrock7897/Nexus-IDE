/**
 * Real Git Repository Service for Nexus IDE (Phase 9 & Final Audit)
 * Executes real git commands inside .nexus-workspaces/<workspaceId>
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import type { GitCommitRecord, GitFileChange, GitStatusReport } from '../shared/ipc-types';

const execFileAsync = promisify(execFile);
const WORKSPACE_ROOT_DIR = path.resolve(process.cwd(), '.nexus-workspaces');

function getWorkspaceDir(workspaceId: string): string {
  const clean = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
  return path.join(WORKSPACE_ROOT_DIR, clean);
}

async function runGit(workspaceId: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  const cwd = getWorkspaceDir(workspaceId);
  await fs.mkdir(cwd, { recursive: true });
  return execFileAsync('git', args, { cwd, timeout: 10000, maxBuffer: 2 * 1024 * 1024 });
}

export class RealGitService {
  public async ensureRepoInitialized(workspaceId: string): Promise<void> {
    const cwd = getWorkspaceDir(workspaceId);
    const gitDir = path.join(cwd, '.git');
    try {
      await fs.access(gitDir);
    } catch {
      await runGit(workspaceId, ['init', '-b', 'main']).catch(async () => {
        await runGit(workspaceId, ['init']);
      });
      await runGit(workspaceId, ['config', 'user.name', 'Nexus Developer']);
      await runGit(workspaceId, ['config', 'user.email', 'developer@nexuside.local']);
      await runGit(workspaceId, ['add', '.']);
      await runGit(workspaceId, [
        'commit',
        '-m',
        'chore: initialize workspace repository',
        '--allow-empty',
      ]).catch(() => undefined);
    }
  }

  public async getStatus(workspaceId: string): Promise<GitStatusReport> {
    await this.ensureRepoInitialized(workspaceId);

    let branch = 'main';
    try {
      const branchRes = await runGit(workspaceId, ['rev-parse', '--abbrev-ref', 'HEAD']);
      branch = branchRes.stdout.trim() || 'main';
    } catch {
      branch = 'main';
    }

    let branches = ['main'];
    try {
      const branchListRes = await runGit(workspaceId, [
        'branch',
        '--format=%(refname:short)',
      ]);
      const parsed = branchListRes.stdout
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);
      if (parsed.length > 0) branches = parsed;
    } catch {
      branches = [branch];
    }

    const changes: GitFileChange[] = [];
    try {
      const statusRes = await runGit(workspaceId, ['status', '--porcelain']);
      const lines = statusRes.stdout.split('\n').filter(Boolean);
      for (const line of lines) {
        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const rawPath = line.slice(3).trim();
        if (rawPath.startsWith('.nexus-base')) continue;
        const filePath = '/' + rawPath.replace(/^"+|"+$/g, '');
        const staged = indexStatus !== ' ' && indexStatus !== '?';
        const status =
          indexStatus === 'A' || indexStatus === '?'
            ? 'added'
            : indexStatus === 'D' || workTreeStatus === 'D'
            ? 'deleted'
            : 'modified';
        changes.push({
          path: filePath,
          status,
          staged,
          additions: 1,
          deletions: 0,
        });
      }
    } catch {
      // Ignore if status empty
    }

    const commits: GitCommitRecord[] = [];
    try {
      const logRes = await runGit(workspaceId, [
        'log',
        '-n',
        '15',
        '--pretty=format:%h|%s|%an|%cr',
      ]);
      const lines = logRes.stdout.split('\n').filter(Boolean);
      for (const line of lines) {
        const [hash, message, author, timestamp] = line.split('|');
        if (hash && message) {
          commits.push({
            hash,
            message,
            author: author || 'Developer',
            timestamp: timestamp || ' recently',
            filesChanged: 1,
          });
        }
      }
    } catch {
      // No commits yet
    }

    return {
      branch,
      branches,
      changes,
      commits,
    };
  }

  public async stageFile(workspaceId: string, virtualPath: string): Promise<GitStatusReport> {
    await this.ensureRepoInitialized(workspaceId);
    const relPath = virtualPath.replace(/^\//, '');
    await runGit(workspaceId, ['add', relPath]);
    return this.getStatus(workspaceId);
  }

  public async unstageFile(workspaceId: string, virtualPath: string): Promise<GitStatusReport> {
    await this.ensureRepoInitialized(workspaceId);
    const relPath = virtualPath.replace(/^\//, '');
    await runGit(workspaceId, ['reset', 'HEAD', relPath]).catch(() => undefined);
    return this.getStatus(workspaceId);
  }

  public async commit(workspaceId: string, message: string): Promise<GitStatusReport> {
    await this.ensureRepoInitialized(workspaceId);
    await runGit(workspaceId, ['add', '-A']);
    await runGit(workspaceId, ['commit', '-m', message.trim() || 'chore: update workspace']);
    return this.getStatus(workspaceId);
  }

  public async checkoutBranch(
    workspaceId: string,
    branchName: string,
    createNew = false
  ): Promise<GitStatusReport> {
    await this.ensureRepoInitialized(workspaceId);
    const clean = branchName.trim().replace(/\s+/g, '-');
    if (createNew) {
      await runGit(workspaceId, ['checkout', '-b', clean]).catch(async () => {
        await runGit(workspaceId, ['checkout', clean]);
      });
    } else {
      await runGit(workspaceId, ['checkout', clean]).catch(async () => {
        await runGit(workspaceId, ['checkout', '-b', clean]);
      });
    }
    return this.getStatus(workspaceId);
  }

  public async getDiff(workspaceId: string, virtualPath?: string): Promise<string> {
    await this.ensureRepoInitialized(workspaceId);
    const args = ['diff', 'HEAD'];
    if (virtualPath) {
      args.push('--', virtualPath.replace(/^\//, ''));
    }
    try {
      const res = await runGit(workspaceId, args);
      return res.stdout;
    } catch {
      return '';
    }
  }
}

export const realGitService = new RealGitService();
