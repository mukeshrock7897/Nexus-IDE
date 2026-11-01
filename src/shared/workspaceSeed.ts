import type {
  WorkspaceFile,
  GitCommitRecord,
  McpServerDescriptor,
  AiProviderDescriptor,
} from './ipc-types';

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    path: '/src/core/engine.ts',
    name: 'engine.ts',
    language: 'typescript',
    updatedAt: new Date(Date.now() - 3600_000).toISOString(),
    baseContent: `export interface TaskPayload {
  id: string;
  priority: 'low' | 'normal' | 'high';
  command: string;
  retries: number;
}

export class ExecutionPipeline {
  private queue: TaskPayload[] = [];

  public enqueue(task: TaskPayload): number {
    this.queue.push(task);
    this.queue.sort((a, b) => this.rank(b.priority) - this.rank(a.priority));
    return this.queue.length;
  }

  public dequeue(): TaskPayload | undefined {
    return this.queue.shift();
  }

  public size(): number {
    return this.queue.length;
  }

  private rank(priority: TaskPayload['priority']): number {
    switch (priority) {
      case 'high':
        return 3;
      case 'normal':
        return 2;
      default:
        return 1;
    }
  }
}
`,
    content: `export interface TaskPayload {
  id: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  command: string;
  retries: number;
  timeoutMs?: number;
}

export class ExecutionPipeline {
  private queue: TaskPayload[] = [];

  public enqueue(task: TaskPayload): number {
    if (!task.command.trim()) {
      throw new Error('Task command cannot be empty');
    }
    this.queue.push(task);
    this.queue.sort((a, b) => this.rank(b.priority) - this.rank(a.priority));
    return this.queue.length;
  }

  public dequeue(): TaskPayload | undefined {
    return this.queue.shift();
  }

  public peek(): TaskPayload | undefined {
    return this.queue[0];
  }

  public size(): number {
    return this.queue.length;
  }

  private rank(priority: TaskPayload['priority']): number {
    switch (priority) {
      case 'critical':
        return 4;
      case 'high':
        return 3;
      case 'normal':
        return 2;
      default:
        return 1;
    }
  }
}
`,
  },
  {
    path: '/src/core/router.ts',
    name: 'router.ts',
    language: 'typescript',
    updatedAt: new Date(Date.now() - 7200_000).toISOString(),
    baseContent: `import { ExecutionPipeline, TaskPayload } from './engine';

export interface RouteResponse {
  accepted: boolean;
  queueDepth: number;
  taskId: string;
}

export class RequestRouter {
  private pipeline = new ExecutionPipeline();

  public dispatch(payload: TaskPayload): RouteResponse {
    const depth = this.pipeline.enqueue(payload);
    return {
      accepted: true,
      queueDepth: depth,
      taskId: payload.id,
    };
  }

  public nextTask(): TaskPayload | undefined {
    return this.pipeline.dequeue();
  }
}
`,
    content: `import { ExecutionPipeline, TaskPayload } from './engine';

export interface RouteResponse {
  accepted: boolean;
  queueDepth: number;
  taskId: string;
}

export class RequestRouter {
  private pipeline = new ExecutionPipeline();

  public dispatch(payload: TaskPayload): RouteResponse {
    const depth = this.pipeline.enqueue(payload);
    return {
      accepted: true,
      queueDepth: depth,
      taskId: payload.id,
    };
  }

  public nextTask(): TaskPayload | undefined {
    return this.pipeline.dequeue();
  }
}
`,
  },
  {
    path: '/src/agents/ragIndexer.py',
    name: 'ragIndexer.py',
    language: 'python',
    updatedAt: new Date(Date.now() - 5400_000).toISOString(),
    baseContent: `from dataclasses import dataclass
from typing import List

@dataclass
class CodeChunk:
    file_path: str
    start_line: int
    end_line: int
    content: str

class VectorStoreIndex:
    def __init__(self) -> None:
        self.chunks: List[CodeChunk] = []

    def index_document(self, file_path: str, source: str, chunk_size: int = 25) -> int:
        lines = source.splitlines()
        for idx in range(0, len(lines), chunk_size):
            segment = "\\n".join(lines[idx:idx + chunk_size])
            self.chunks.append(
                CodeChunk(
                    file_path=file_path,
                    start_line=idx + 1,
                    end_line=min(idx + chunk_size, len(lines)),
                    content=segment,
                )
            )
        return len(self.chunks)
`,
    content: `from dataclasses import dataclass
from typing import List

@dataclass
class CodeChunk:
    file_path: str
    start_line: int
    end_line: int
    content: str

class VectorStoreIndex:
    def __init__(self) -> None:
        self.chunks: List[CodeChunk] = []

    def index_document(self, file_path: str, source: str, chunk_size: int = 25) -> int:
        lines = source.splitlines()
        for idx in range(0, len(lines), chunk_size):
            segment = "\\n".join(lines[idx:idx + chunk_size])
            self.chunks.append(
                CodeChunk(
                    file_path=file_path,
                    start_line=idx + 1,
                    end_line=min(idx + chunk_size, len(lines)),
                    content=segment,
                )
            )
        return len(self.chunks)
`,
  },
  {
    path: '/src/native/tokenizer.rs',
    name: 'tokenizer.rs',
    language: 'rust',
    updatedAt: new Date(Date.now() - 8600_000).toISOString(),
    baseContent: `pub struct TokenStats {
    pub character_count: usize,
    pub estimated_tokens: usize,
    pub line_count: usize,
}

pub fn estimate_bpe_tokens(input: &str) -> TokenStats {
    let character_count = input.chars().count();
    let line_count = input.lines().count().max(1);
    let estimated_tokens = (character_count + 3) / 4;

    TokenStats {
        character_count,
        estimated_tokens,
        line_count,
    }
}
`,
    content: `pub struct TokenStats {
    pub character_count: usize,
    pub estimated_tokens: usize,
    pub line_count: usize,
}

pub fn estimate_bpe_tokens(input: &str) -> TokenStats {
    let character_count = input.chars().count();
    let line_count = input.lines().count().max(1);
    let estimated_tokens = (character_count + 3) / 4;

    TokenStats {
        character_count,
        estimated_tokens,
        line_count,
    }
}
`,
  },
  {
    path: '/src/services/workerPool.go',
    name: 'workerPool.go',
    language: 'go',
    updatedAt: new Date(Date.now() - 6100_000).toISOString(),
    baseContent: `package services

type WorkerMetric struct {
	ActiveWorkers int
	ProcessedJobs int
}

func ComputeUtilization(active int, capacity int) float64 {
	if capacity <= 0 {
		return 0.0
	}
	return float64(active) / float64(capacity)
}
`,
    content: `package services

type WorkerMetric struct {
	ActiveWorkers int
	ProcessedJobs int
}

func ComputeUtilization(active int, capacity int) float64 {
	if capacity <= 0 {
		return 0.0
	}
	return float64(active) / float64(capacity)
}
`,
  },
  {
    path: '/db/schema.sql',
    name: 'schema.sql',
    language: 'sql',
    updatedAt: new Date(Date.now() - 9200_000).toISOString(),
    baseContent: `CREATE TABLE IF NOT EXISTS workspace_sessions (
  id TEXT PRIMARY KEY,
  workspace_name TEXT NOT NULL,
  active_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_invocation_ledger (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  role TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES workspace_sessions(id)
);
`,
    content: `CREATE TABLE IF NOT EXISTS workspace_sessions (
  id TEXT PRIMARY KEY,
  workspace_name TEXT NOT NULL,
  active_branch TEXT NOT NULL DEFAULT 'main',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_invocation_ledger (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  role TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES workspace_sessions(id)
);
`,
  },
  {
    path: '/tests/engine.spec.ts',
    name: 'engine.spec.ts',
    language: 'typescript',
    updatedAt: new Date(Date.now() - 1800_000).toISOString(),
    baseContent: `import { describe, it, expect } from 'vitest';
import { ExecutionPipeline } from '../src/core/engine';

describe('ExecutionPipeline', () => {
  it('orders high priority tasks ahead of normal tasks', () => {
    const pipeline = new ExecutionPipeline();
    pipeline.enqueue({ id: 't-1', priority: 'normal', command: 'npm run lint', retries: 0 });
    pipeline.enqueue({ id: 't-2', priority: 'high', command: 'npm test', retries: 1 });

    expect(pipeline.dequeue()?.id).toBe('t-2');
    expect(pipeline.dequeue()?.id).toBe('t-1');
  });
});
`,
    content: `import { describe, it, expect } from 'vitest';
import { ExecutionPipeline } from '../src/core/engine';

describe('ExecutionPipeline', () => {
  it('orders critical and high priority tasks ahead of normal tasks', () => {
    const pipeline = new ExecutionPipeline();
    pipeline.enqueue({ id: 't-1', priority: 'normal', command: 'npm run lint', retries: 0 });
    pipeline.enqueue({ id: 't-2', priority: 'critical', command: 'npm test', retries: 1 });

    expect(pipeline.peek()?.id).toBe('t-2');
    expect(pipeline.dequeue()?.id).toBe('t-2');
    expect(pipeline.dequeue()?.id).toBe('t-1');
  });
});
`,
  },
  {
    path: '/nexus.config.json',
    name: 'nexus.config.json',
    language: 'json',
    updatedAt: new Date(Date.now() - 12000_000).toISOString(),
    baseContent: `{
  "workspace": "nexus-runtime-core",
  "version": "2.0.0",
  "aiGateway": {
    "defaultProvider": "gemini",
    "models": {
      "coding": "gemini-3.8-flash",
      "reasoning": "gemini-3.8-flash",
      "chat": "gemini-3.8-flash",
      "autocomplete": "gemini-3.1-flash-lite",
      "embeddings": "gemini-embedding-2-preview"
    }
  },
  "security": {
    "contextIsolation": true,
    "nodeIntegration": false,
    "commandApprovalPolicy": "moderate",
    "secretRedaction": true
  }
}
`,
    content: `{
  "workspace": "nexus-runtime-core",
  "version": "2.0.0",
  "aiGateway": {
    "defaultProvider": "gemini",
    "models": {
      "coding": "gemini-3.8-flash",
      "reasoning": "gemini-3.8-flash",
      "chat": "gemini-3.8-flash",
      "autocomplete": "gemini-3.1-flash-lite",
      "embeddings": "gemini-embedding-2-preview"
    }
  },
  "security": {
    "contextIsolation": true,
    "nodeIntegration": false,
    "commandApprovalPolicy": "moderate",
    "secretRedaction": true
  }
}
`,
  },
];

export const INITIAL_GIT_COMMITS: GitCommitRecord[] = [
  {
    hash: 'a84f92c',
    message: 'feat(engine): add priority queue sorting and router dispatch',
    author: 'Elena Vance',
    timestamp: '2 hours ago',
    filesChanged: 3,
  },
  {
    hash: '7d19e04',
    message: 'feat(rag): implement sliding window document chunker and symbol index',
    author: 'Marcus Sterling',
    timestamp: '5 hours ago',
    filesChanged: 2,
  },
  {
    hash: '3c08b11',
    message: 'chore(security): enforce Electron contextIsolation and IPC channel whitelist',
    author: 'Elena Vance',
    timestamp: 'Yesterday',
    filesChanged: 4,
  },
];

export const INITIAL_MCP_SERVERS: McpServerDescriptor[] = [
  {
    id: 'mcp-filesystem',
    name: 'Workspace Filesystem MCP',
    category: 'filesystem',
    transport: 'stdio',
    status: 'connected',
    tools: [
      {
        name: 'fs_read_file',
        description: 'Read contents of a validated workspace file path from disk.',
        enabled: true,
        inputSchema: { path: 'string' },
      },
      {
        name: 'fs_list_symbols',
        description: 'Extract exported classes, functions, and interfaces across workspace files.',
        enabled: true,
        inputSchema: { directory: 'string' },
      },
    ],
  },
  {
    id: 'mcp-git',
    name: 'Git & Pull Request Inspector MCP',
    category: 'git',
    transport: 'stdio',
    status: 'connected',
    tools: [
      {
        name: 'git_diff_summary',
        description: 'Compute line additions, deletions, and modified chunks across tracked files.',
        enabled: true,
        inputSchema: { branch: 'string' },
      },
      {
        name: 'git_log_recent',
        description: 'Retrieve recent commit history with author and file counts.',
        enabled: true,
        inputSchema: { limit: 'number' },
      },
    ],
  },
  {
    id: 'mcp-database',
    name: 'PostgreSQL & SQLite Schema Inspector',
    category: 'database',
    transport: 'sse',
    endpoint: 'http://localhost:3000/api/mcp/sqlite',
    status: 'connected',
    tools: [
      {
        name: 'db_inspect_tables',
        description: 'Inspect SQL table definitions and foreign key relations in /db/schema.sql.',
        enabled: true,
        inputSchema: { schemaFile: 'string' },
      },
    ],
  },
  {
    id: 'mcp-devops',
    name: 'Docker & CI/CD Pipeline Inspector',
    category: 'devops',
    transport: 'http',
    endpoint: 'http://localhost:3000/api/mcp/devops',
    status: 'connected',
    tools: [
      {
        name: 'devops_audit_containers',
        description: 'Verify container build manifests, ports, and GitHub Actions workflow steps.',
        enabled: true,
        inputSchema: { target: 'string' },
      },
    ],
  },
];

export const AI_PROVIDER_CATALOG: AiProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini Gateway',
    status: 'connected',
    defaultModel: 'gemini-3.8-flash',
    supportsStreaming: true,
    latencyMs: 210,
    models: [
      {
        modelId: 'gemini-3.8-flash',
        contextWindow: 1048576,
        maxOutputTokens: 65536,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.00015,
        tier: 'balanced',
      },
      {
        modelId: 'gemini-3.1-flash-lite',
        contextWindow: 1048576,
        maxOutputTokens: 32768,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.000075,
        tier: 'fast',
      },
      {
        modelId: 'gemini-embedding-2-preview',
        contextWindow: 8192,
        maxOutputTokens: 768,
        supportsStreaming: false,
        supportsTools: false,
        costPer1kTokensUsd: 0.00002,
        tier: 'fast',
      },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama Local Runtime',
    status: 'local',
    defaultModel: 'qwen2.5-coder:14b',
    supportsStreaming: true,
    latencyMs: 95,
    models: [
      {
        modelId: 'qwen2.5-coder:14b',
        contextWindow: 131072,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0,
        tier: 'local',
      },
      {
        modelId: 'deepseek-coder-v2:local',
        contextWindow: 131072,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsTools: false,
        costPer1kTokensUsd: 0,
        tier: 'local',
      },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude Gateway',
    status: 'standby',
    defaultModel: 'claude-3-7-sonnet',
    supportsStreaming: true,
    models: [
      {
        modelId: 'claude-3-7-sonnet',
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.003,
        tier: 'deep-reasoning',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI Compatible Gateway',
    status: 'standby',
    defaultModel: 'gpt-4o',
    supportsStreaming: true,
    models: [
      {
        modelId: 'gpt-4o',
        contextWindow: 128000,
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.0025,
        tier: 'balanced',
      },
    ],
  },
  {
    id: 'groq',
    name: 'Groq LPU Inference',
    status: 'standby',
    defaultModel: 'qwen-2.5-coder-32b',
    supportsStreaming: true,
    models: [
      {
        modelId: 'qwen-2.5-coder-32b',
        contextWindow: 128000,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.0005,
        tier: 'fast',
      },
    ],
  },
  {
    id: 'mistral',
    name: 'Mistral Codestral',
    status: 'standby',
    defaultModel: 'codestral-latest',
    supportsStreaming: true,
    models: [
      {
        modelId: 'codestral-latest',
        contextWindow: 256000,
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.0003,
        tier: 'fast',
      },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter Unified Mesh',
    status: 'standby',
    defaultModel: 'openrouter/auto',
    supportsStreaming: true,
    models: [
      {
        modelId: 'openrouter/auto',
        contextWindow: 200000,
        maxOutputTokens: 16384,
        supportsStreaming: true,
        supportsTools: true,
        costPer1kTokensUsd: 0.001,
        tier: 'balanced',
      },
    ],
  },
];
