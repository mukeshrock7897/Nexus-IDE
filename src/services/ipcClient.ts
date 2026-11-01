import { classifyCommandRisk, validateWorkspacePath } from '../../electron/security';
import { extractSymbolsAndDependencies, hybridRagSearch } from '../server/ragEngine';
import type {
  AiAutocompleteRequest,
  AiAutocompleteResponse,
  AiAgentPlan,
  AiChatRequest,
  AiChatResponse,
  AiChatThread,
  AiInlineEditRequest,
  AiInlineEditResponse,
  AuditLogEntry,
  CommandRiskAssessment,
  DiagnosticProblem,
  GitCommitRecord,
  IdeSettings,
  McpServerDescriptor,
  RagSearchResult,
  TerminalExecutionResult,
  WorkspaceFile,
} from '../shared/ipc-types';

const autocompleteCache = new Map<string, string>();

/**
 * Extracts markdown fenced code blocks from an AI assistant message.
 */
export function extractCodeBlocks(markdown: string): Array<{ language: string; code: string }> {
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const blocks: Array<{ language: string; code: string }> = [];
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      language: (match[1] || 'typescript').toLowerCase(),
      code: match[2].trim(),
    });
  }
  return blocks;
}

/**
 * Performs fast static analysis & syntax checks across workspace files to populate the Problems panel.
 */
export function analyzeWorkspaceDiagnostics(files: WorkspaceFile[]): DiagnosticProblem[] {
  const problems: DiagnosticProblem[] = [];

  for (const file of files) {
    const lines = file.content.split('\n');

    if (file.language === 'json') {
      try {
        JSON.parse(file.content);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Invalid JSON syntax';
        problems.push({
          id: `diag-json-${file.path}`,
          filePath: file.path,
          line: 1,
          column: 1,
          severity: 'error',
          message: msg,
          source: 'JSON Parser',
        });
      }
    }

    lines.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      if (/\bconsole\.log\(/.test(lineText) && file.path.startsWith('/src/')) {
        problems.push({
          id: `diag-log-${file.path}-${lineNum}`,
          filePath: file.path,
          line: lineNum,
          column: lineText.indexOf('console.log') + 1,
          severity: 'info',
          message: 'Unstructured console.log statement in production module.',
          source: 'Nexus Linter',
        });
      }
      if (/\bany\b/.test(lineText) && file.language === 'typescript' && /:\s*any\b/.test(lineText)) {
        problems.push({
          id: `diag-any-${file.path}-${lineNum}`,
          filePath: file.path,
          line: lineNum,
          column: lineText.indexOf('any') + 1,
          severity: 'warning',
          message: 'Unexpected explicit "any" type. Prefer strict TypeScript interfaces.',
          source: 'TypeScript Strict',
        });
      }
      if (/\bTODO\b|\bFIXME\b/.test(lineText)) {
        problems.push({
          id: `diag-todo-${file.path}-${lineNum}`,
          filePath: file.path,
          line: lineNum,
          column: 1,
          severity: 'info',
          message: `Unresolved developer annotation on line ${lineNum}.`,
          source: 'Workspace Scanner',
        });
      }
    });
  }

  return problems;
}

/**
 * Performs Hybrid RAG semantic + AST symbol search across all indexed workspace files.
 */
export function searchWorkspaceRag(
  query: string,
  files: WorkspaceFile[],
  mode: 'hybrid' | 'semantic' | 'symbol' = 'hybrid'
): RagSearchResult[] {
  return hybridRagSearch(query, files, mode);
}

export { extractSymbolsAndDependencies };

/**
 * Unified IPC & Backend Service Client (Phases 1–12 Full Production Integration)
 */
export const nexusClient = {
  validatePath(filePath: string) {
    return validateWorkspacePath(filePath);
  },

  classifyCommand(
    command: string,
    policy: 'strict' | 'moderate' | 'permissive'
  ): CommandRiskAssessment {
    return classifyCommandRisk(command, policy);
  },

  // Disk-Backed Persistent IDE State
  async loadPersistedIdeState(): Promise<{
    settings: IdeSettings | null;
    chatThreads: AiChatThread[] | null;
    mcpServers: McpServerDescriptor[] | null;
    recentWorkspaces: string[] | null;
    auditLogs: AuditLogEntry[] | null;
  }> {
    const response = await fetch('/api/state');
    if (!response.ok) {
      throw new Error('Failed to load persisted IDE state');
    }
    return response.json();
  },

  async savePersistedIdeState(partial: {
    settings?: IdeSettings | null;
    chatThreads?: AiChatThread[] | null;
    mcpServers?: McpServerDescriptor[] | null;
    recentWorkspaces?: string[] | null;
    auditLogs?: AuditLogEntry[] | null;
  }): Promise<void> {
    await fetch('/api/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial),
    });
  },

  // Real Disk Workspace Operations
  async fetchWorkspaceFiles(workspaceId: string): Promise<WorkspaceFile[]> {
    const response = await fetch(
      `/api/workspace/files?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    if (!response.ok) {
      throw new Error('Failed to load workspace files from disk');
    }
    const data = (await response.json()) as { files: WorkspaceFile[] };
    return data.files;
  },

  async saveWorkspaceFile(
    workspaceId: string,
    filePath: string,
    content: string,
    updateBaseSnapshot = false
  ): Promise<WorkspaceFile> {
    const response = await fetch('/api/workspace/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, path: filePath, content, updateBaseSnapshot }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to write file to disk');
    }
    return data as WorkspaceFile;
  },

  async deleteWorkspaceFile(workspaceId: string, filePath: string): Promise<void> {
    await fetch('/api/workspace/file', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, path: filePath }),
    });
  },

  async renameWorkspaceFile(
    workspaceId: string,
    oldPath: string,
    newPath: string
  ): Promise<WorkspaceFile> {
    const response = await fetch('/api/workspace/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, oldPath, newPath }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to rename file on disk');
    }
    return data as WorkspaceFile;
  },

  async commitWorkspaceSnapshot(workspaceId: string, paths: string[]): Promise<void> {
    await fetch('/api/workspace/commit-snapshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, paths }),
    });
  },

  // Real Git SCM Operations
  async getGitStatus(workspaceId: string): Promise<{
    currentBranch: string;
    branches: string[];
    stagedPaths: string[];
    modifiedPaths: string[];
    untrackedPaths: string[];
    commits: GitCommitRecord[];
  }> {
    const response = await fetch(
      `/api/git/status?workspaceId=${encodeURIComponent(workspaceId)}`
    );
    if (!response.ok) {
      throw new Error('Failed to read Git repository status');
    }
    return response.json();
  },

  async stageGitFile(workspaceId: string, filePath: string): Promise<void> {
    await fetch('/api/git/stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, path: filePath }),
    });
  },

  async unstageGitFile(workspaceId: string, filePath: string): Promise<void> {
    await fetch('/api/git/unstage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, path: filePath }),
    });
  },

  async commitGitChanges(
    workspaceId: string,
    message: string
  ): Promise<{
    hash: string;
    message: string;
    filesChanged: number;
    status: {
      currentBranch: string;
      branches: string[];
      stagedPaths: string[];
      commits: GitCommitRecord[];
    };
  }> {
    const response = await fetch('/api/git/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, message }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Git commit failed');
    }
    return data;
  },

  async checkoutGitBranch(
    workspaceId: string,
    branch: string,
    createNew = false
  ): Promise<{
    currentBranch: string;
    branches: string[];
  }> {
    const response = await fetch('/api/git/branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, branch, createNew }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Git branch switch failed');
    }
    return data;
  },

  // Real Process Terminal Execution
  async executeTerminalCommand(
    workspaceId: string,
    command: string,
    policy: 'strict' | 'moderate' | 'permissive',
    approved = false
  ): Promise<{
    blocked: boolean;
    requiresApproval?: boolean;
    assessment?: CommandRiskAssessment;
    result?: TerminalExecutionResult;
  }> {
    const response = await fetch('/api/terminal/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, command, policy, approved }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Terminal command execution failed');
    }
    return data;
  },

  // Real MCP Server Tool Execution
  async invokeMcpToolRemote(
    workspaceId: string,
    serverId: string,
    toolName: string,
    args: Record<string, string>
  ): Promise<{ ok: boolean; serverId: string; toolName: string; output: string }> {
    const response = await fetch('/api/mcp/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, serverId, toolName, args }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'MCP tool execution failed');
    }
    return data;
  },

  // AI Chat (Standard & Streaming SSE with AbortSignal)
  async sendAiChat(payload: AiChatRequest): Promise<AiChatResponse> {
    if (window.nexusAPI?.isElectron) {
      return window.nexusAPI.invoke<AiChatRequest, AiChatResponse>('nexus:ai:chat', payload);
    }
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI Chat request failed');
    }
    return data as AiChatResponse;
  },

  async streamAiChat(
    payload: AiChatRequest,
    onDelta: (chunkText: string) => void,
    signal?: AbortSignal
  ): Promise<AiChatResponse> {
    const response = await fetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok || !response.body) {
      return this.sendAiChat(payload);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let accumulated = '';
    let finalMeta: Partial<AiChatResponse> = {};

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const evt of events) {
        const line = evt.trim();
        if (!line.startsWith('data:')) continue;
        const jsonStr = line.slice(5).trim();
        try {
          const parsed = JSON.parse(jsonStr) as {
            type: 'delta' | 'done' | 'error';
            text?: string;
            modelUsed?: string;
            tokensUsed?: number;
            latencyMs?: number;
            redactedSecretsCount?: number;
            error?: string;
          };
          if (parsed.type === 'delta' && parsed.text) {
            accumulated += parsed.text;
            onDelta(accumulated);
          } else if (parsed.type === 'done') {
            finalMeta = parsed;
          } else if (parsed.type === 'error') {
            throw new Error(parsed.error || 'Streaming AI error');
          }
        } catch (err) {
          if (err instanceof Error && err.message !== 'Unexpected end of JSON input') {
            throw err;
          }
        }
      }
    }

    return {
      reply: accumulated || 'Response completed.',
      modelUsed: finalMeta.modelUsed || payload.modelId,
      providerId: payload.providerId,
      tokensUsed: finalMeta.tokensUsed || Math.max(32, Math.round(accumulated.length / 4)),
      latencyMs: finalMeta.latencyMs || 180,
      redactedSecretsCount: finalMeta.redactedSecretsCount || 0,
    };
  },

  // Fast Autocomplete with Caching
  async getAutocompleteSuggestion(
    payload: AiAutocompleteRequest,
    signal?: AbortSignal
  ): Promise<AiAutocompleteResponse> {
    const cacheKey = `${payload.filePath}:${payload.prefix.slice(-160)}`;
    const cached = autocompleteCache.get(cacheKey);
    if (cached) {
      return {
        suggestion: cached,
        modelUsed: 'gemini-3.1-flash-lite (cached)',
        latencyMs: 2,
      };
    }

    const response = await fetch('/api/ai/autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Autocomplete failed');
    }
    if (data.suggestion) {
      autocompleteCache.set(cacheKey, data.suggestion);
    }
    return data as AiAutocompleteResponse;
  },

  async runInlineEdit(payload: AiInlineEditRequest): Promise<AiInlineEditResponse> {
    if (window.nexusAPI?.isElectron) {
      return window.nexusAPI.invoke<AiInlineEditRequest, AiInlineEditResponse>(
        'nexus:ai:inline-edit',
        payload
      );
    }
    const response = await fetch('/api/ai/inline-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Inline edit request failed');
    }
    return data as AiInlineEditResponse;
  },

  async generateAgentPlan(
    goal: string,
    checkpointId: string,
    workspaceFiles: Array<{ path: string; language: string; content: string }>
  ): Promise<AiAgentPlan> {
    const response = await fetch('/api/ai/agent-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, checkpointId, workspaceFiles }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Agent plan request failed');
    }
    return data as AiAgentPlan;
  },

  async reviewFile(
    filePath: string,
    language: string,
    content: string
  ): Promise<{ summary: string; problems: DiagnosticProblem[] }> {
    const response = await fetch('/api/ai/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, language, content }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI review failed');
    }
    return data;
  },

  async generateUnitTests(
    filePath: string,
    language: string,
    content: string
  ): Promise<{
    testFilePath: string;
    testFileContent: string;
    cases: Array<{ name: string; assertionDetail: string }>;
  }> {
    const response = await fetch('/api/ai/generate-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, language, content }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unit test generation failed');
    }
    return data;
  },

  async debugActiveFile(
    filePath: string,
    language: string,
    content: string,
    errorContext: string
  ): Promise<{ rootCause: string; patchedContent: string }> {
    const response = await fetch('/api/ai/debug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, language, content, errorContext }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI debug failed');
    }
    return data;
  },

  async generateProjectDocs(
    workspaceName: string,
    files: Array<{ path: string; language: string; content: string }>
  ): Promise<{ docPath: string; content: string }> {
    const response = await fetch('/api/ai/docs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceName, files }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Documentation generation failed');
    }
    return data;
  },

  async runGitAssistant(
    action: 'commit_message' | 'pr_description' | 'risk_review',
    branch: string,
    modifiedFiles: Array<{ path: string; baseContent: string; content: string }>
  ): Promise<{ result: string }> {
    const response = await fetch('/api/ai/git-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, branch, modifiedFiles }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI Git Assistant failed');
    }
    return data;
  },

  async askTerminalAssistant(
    requestText: string,
    policy: 'strict' | 'moderate' | 'permissive'
  ): Promise<{ command: string; explanation: string; assessment: CommandRiskAssessment }> {
    const response = await fetch('/api/ai/terminal-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestText, policy }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'AI Terminal Assistant failed');
    }
    return data;
  },
};
