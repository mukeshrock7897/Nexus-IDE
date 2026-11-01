/**
 * Real Disk-Backed Workspace File System Service for Nexus IDE
 * Persists all workspace files and directories to disk under .nexus-workspaces/<workspaceId>
 * with strict path traversal protection.
 */

import fs from 'fs/promises';
import path from 'path';
import { validateWorkspacePath } from '../../electron/security';
import { INITIAL_WORKSPACE_FILES } from '../shared/workspaceSeed';
import type { SupportedLanguage, WorkspaceFile } from '../shared/ipc-types';

const WORKSPACE_ROOT_DIR = path.resolve(process.cwd(), '.nexus-workspaces');

export function detectLanguage(filePath: string): SupportedLanguage {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs')) return 'javascript';
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.rs')) return 'rust';
  if (lower.endsWith('.go')) return 'go';
  if (lower.endsWith('.java')) return 'java';
  if (lower.endsWith('.c') || lower.endsWith('.h')) return 'c';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.cs')) return 'csharp';
  if (lower.endsWith('.php')) return 'php';
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) return 'yaml';
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'css';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh')) return 'shell';
  return 'markdown';
}

function getSafeDiskPath(workspaceId: string, virtualPath: string): string {
  const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
  const check = validateWorkspacePath(virtualPath);
  if (!check.valid) {
    throw new Error(check.error || 'Invalid workspace file path');
  }
  const workspaceDir = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
  const resolved = path.resolve(workspaceDir, '.' + check.normalized);
  if (!resolved.startsWith(workspaceDir)) {
    throw new Error('Security violation: Path escapes workspace root directory.');
  }
  return resolved;
}

async function walkDirectory(dir: string, baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.nexus-base') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkDirectory(fullPath, baseDir);
      files.push(...nested);
    } else if (entry.isFile()) {
      const rel = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      files.push(rel);
    }
  }
  return files;
}

export class WorkspaceDiskService {
  public async ensureWorkspaceSeeded(
    workspaceId: string,
    seedFiles: WorkspaceFile[] = INITIAL_WORKSPACE_FILES
  ): Promise<WorkspaceFile[]> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const workspaceDir = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
    const baseSnapshotDir = path.join(workspaceDir, '.nexus-base');

    await fs.mkdir(workspaceDir, { recursive: true });
    await fs.mkdir(baseSnapshotDir, { recursive: true });

    const existingPaths = await walkDirectory(workspaceDir, workspaceDir);
    if (existingPaths.length === 0) {
      for (const seed of seedFiles) {
        const diskPath = getSafeDiskPath(cleanWorkspace, seed.path);
        const snapshotPath = path.join(baseSnapshotDir, '.' + seed.path);
        await fs.mkdir(path.dirname(diskPath), { recursive: true });
        await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
        await fs.writeFile(diskPath, seed.content, 'utf-8');
        await fs.writeFile(snapshotPath, seed.baseContent ?? seed.content, 'utf-8');
      }
    }

    return this.listFiles(cleanWorkspace);
  }

  public async listFiles(workspaceId: string): Promise<WorkspaceFile[]> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const workspaceDir = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
    const baseSnapshotDir = path.join(workspaceDir, '.nexus-base');

    await fs.mkdir(workspaceDir, { recursive: true });
    const virtualPaths = await walkDirectory(workspaceDir, workspaceDir);
    const results: WorkspaceFile[] = [];

    for (const vPath of virtualPaths) {
      const diskPath = getSafeDiskPath(cleanWorkspace, vPath);
      const snapshotPath = path.join(baseSnapshotDir, '.' + vPath);
      const [content, stat] = await Promise.all([
        fs.readFile(diskPath, 'utf-8'),
        fs.stat(diskPath),
      ]);
      let baseContent = '';
      try {
        baseContent = await fs.readFile(snapshotPath, 'utf-8');
      } catch {
        baseContent = '';
      }
      results.push({
        path: vPath,
        name: path.posix.basename(vPath),
        language: detectLanguage(vPath),
        content,
        baseContent,
        updatedAt: stat.mtime.toISOString(),
      });
    }

    return results.sort((a, b) => a.path.localeCompare(b.path));
  }

  public async writeFile(
    workspaceId: string,
    virtualPath: string,
    content: string,
    updateBaseSnapshot = false
  ): Promise<WorkspaceFile> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const check = validateWorkspacePath(virtualPath);
    if (!check.valid) {
      throw new Error(check.error || 'Invalid file path');
    }

    const diskPath = getSafeDiskPath(cleanWorkspace, check.normalized);
    const workspaceDir = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
    const snapshotPath = path.join(workspaceDir, '.nexus-base', '.' + check.normalized);

    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, content, 'utf-8');

    let baseContent = '';
    if (updateBaseSnapshot) {
      await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
      await fs.writeFile(snapshotPath, content, 'utf-8');
      baseContent = content;
    } else {
      try {
        baseContent = await fs.readFile(snapshotPath, 'utf-8');
      } catch {
        baseContent = '';
      }
    }

    return {
      path: check.normalized,
      name: path.posix.basename(check.normalized),
      language: detectLanguage(check.normalized),
      content,
      baseContent,
      updatedAt: new Date().toISOString(),
    };
  }

  public async deleteFile(workspaceId: string, virtualPath: string): Promise<void> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const diskPath = getSafeDiskPath(cleanWorkspace, virtualPath);
    await fs.rm(diskPath, { force: true });
  }

  public async renameOrMoveFile(
    workspaceId: string,
    oldVirtualPath: string,
    newVirtualPath: string
  ): Promise<WorkspaceFile> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const oldDiskPath = getSafeDiskPath(cleanWorkspace, oldVirtualPath);
    const content = await fs.readFile(oldDiskPath, 'utf-8');
    const created = await this.writeFile(cleanWorkspace, newVirtualPath, content, false);
    await fs.rm(oldDiskPath, { force: true });
    return created;
  }

  public async commitSnapshot(workspaceId: string, paths: string[]): Promise<void> {
    const cleanWorkspace = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'nexus-runtime-core';
    const workspaceDir = path.join(WORKSPACE_ROOT_DIR, cleanWorkspace);
    const baseSnapshotDir = path.join(workspaceDir, '.nexus-base');

    for (const vPath of paths) {
      const diskPath = getSafeDiskPath(cleanWorkspace, vPath);
      const snapshotPath = path.join(baseSnapshotDir, '.' + vPath);
      try {
        const content = await fs.readFile(diskPath, 'utf-8');
        await fs.mkdir(path.dirname(snapshotPath), { recursive: true });
        await fs.writeFile(snapshotPath, content, 'utf-8');
      } catch {
        // Ignore deleted files
      }
    }
  }
}

export const workspaceDiskService = new WorkspaceDiskService();
