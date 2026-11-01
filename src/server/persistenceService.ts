/**
 * Persistent IDE State Service (Phase 10 & Scenario 10 Audit)
 * Saves and restores user settings, AI provider routing, chat conversation history,
 * and MCP configurations on disk across restarts.
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  AiChatThread,
  AiUsageRecord,
  AuditLogEntry,
  IdeSettings,
  McpServerDescriptor,
} from '../shared/ipc-types';

const STATE_FILE_PATH = path.resolve(process.cwd(), '.nexus-workspaces', '.ide-state.json');

export interface PersistedIdeStateSnapshot {
  workspaceName?: string;
  settings?: IdeSettings;
  chatThreads?: AiChatThread[];
  activeThreadId?: string;
  mcpServers?: McpServerDescriptor[];
  usageLedger?: AiUsageRecord[];
  auditLogs?: AuditLogEntry[];
  updatedAt: string;
}

export class PersistenceService {
  public async loadState(): Promise<PersistedIdeStateSnapshot | null> {
    try {
      const raw = await fs.readFile(STATE_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as PersistedIdeStateSnapshot;
    } catch {
      return null;
    }
  }

  public async saveState(partial: Partial<PersistedIdeStateSnapshot>): Promise<PersistedIdeStateSnapshot> {
    await fs.mkdir(path.dirname(STATE_FILE_PATH), { recursive: true });
    const current = (await this.loadState()) || { updatedAt: new Date().toISOString() };
    const merged: PersistedIdeStateSnapshot = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await fs.writeFile(STATE_FILE_PATH, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  }
}

export const persistenceService = new PersistenceService();
