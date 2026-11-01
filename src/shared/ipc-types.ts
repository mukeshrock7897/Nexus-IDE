/**
 * Shared Typed IPC Contracts for Nexus IDE (Phases 1–12)
 * Used across Electron Main, Preload, Backend Server, and React Renderer.
 */

export type SupportedLanguage =
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'html'
  | 'css'
  | 'json'
  | 'yaml'
  | 'sql'
  | 'markdown'
  | 'shell';

export interface WorkspaceFile {
  path: string;
  name: string;
  language: SupportedLanguage;
  content: string;
  baseContent: string; // Snapshot used for Git diff & dirty state calculation
  updatedAt: string;
}

export interface DiagnosticProblem {
  id: string;
  filePath: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  source: string;
}

export type GitFileStatus = 'modified' | 'added' | 'deleted' | 'staged' | 'unmodified';

export interface GitFileChange {
  path: string;
  status: GitFileStatus;
  staged: boolean;
  additions: number;
  deletions: number;
}

export interface GitCommitRecord {
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  filesChanged: number;
}

export interface GitStashRecord {
  id: string;
  message: string;
  branch: string;
  timestamp: string;
  filesSnapshot: WorkspaceFile[];
}

export interface GitStatusReport {
  branch: string;
  branches: string[];
  changes: GitFileChange[];
  commits: GitCommitRecord[];
}

export type CommandRiskLevel = 'safe' | 'moderate' | 'critical';

export interface CommandRiskAssessment {
  command: string;
  riskLevel: CommandRiskLevel;
  requiresApproval: boolean;
  reason: string;
}

export interface TerminalExecutionRequest {
  command: string;
  cwd?: string;
  approved?: boolean;
}

export interface TerminalExecutionResult {
  id: string;
  command: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  riskAssessment: CommandRiskAssessment;
  pendingApproval?: boolean;
  timestamp: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  shell: 'bash' | 'zsh' | 'node' | 'python';
  cwd: string;
  history: TerminalExecutionResult[];
}

export type AiProviderId =
  | 'gemini'
  | 'openai'
  | 'anthropic'
  | 'mistral'
  | 'groq'
  | 'openrouter'
  | 'ollama'
  | 'custom';

export type AiModelRole =
  | 'chat'
  | 'reasoning'
  | 'coding'
  | 'inline_edit'
  | 'autocomplete'
  | 'embeddings'
  | 'agent'
  | 'review';

export interface AiModelCapability {
  modelId: string;
  contextWindow: number;
  maxOutputTokens: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  costPer1kTokensUsd: number;
  tier: 'fast' | 'balanced' | 'deep-reasoning' | 'local';
}

export interface AiProviderDescriptor {
  id: AiProviderId;
  name: string;
  models: AiModelCapability[];
  status: 'connected' | 'standby' | 'local';
  defaultModel: string;
  supportsStreaming: boolean;
  latencyMs?: number;
}

export interface AiUsageRecord {
  id: string;
  timestamp: string;
  providerId: AiProviderId;
  modelId: string;
  role: AiModelRole;
  tokensUsed: number;
  estimatedCostUsd: number;
  latencyMs: number;
  redactedSecretsCount: number;
}

export type ContextAttachmentType =
  | 'active_file'
  | 'selection'
  | 'open_tabs'
  | 'workspace'
  | 'terminal'
  | 'problems'
  | 'git_diff';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  tokensUsed?: number;
  latencyMs?: number;
  contextSources?: ContextAttachmentType[];
  codeBlocks?: Array<{
    language: string;
    code: string;
    targetPath?: string;
  }>;
}

export interface AiChatThread {
  id: string;
  title: string;
  createdAt: string;
  messages: AiChatMessage[];
}

export interface AiChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  activeFile?: {
    path: string;
    content: string;
    language: string;
    selectedText?: string;
  };
  workspaceFiles?: Array<{ path: string; language: string; preview: string }>;
  terminalOutput?: string;
  problemsSummary?: string;
  gitDiffSummary?: string;
  attachedContexts?: ContextAttachmentType[];
  role: AiModelRole;
  providerId: AiProviderId;
  modelId: string;
}

export interface AiChatResponse {
  reply: string;
  modelUsed: string;
  providerId: AiProviderId;
  tokensUsed: number;
  latencyMs: number;
  redactedSecretsCount?: number;
}

export interface AiInlineEditRequest {
  filePath: string;
  language: string;
  fullContent: string;
  selectedText?: string;
  instruction: string;
  modelId?: string;
}

export interface AiInlineEditResponse {
  updatedContent: string;
  explanation: string;
  modelUsed: string;
  latencyMs: number;
}

export interface AiAutocompleteRequest {
  filePath: string;
  language: string;
  prefix: string;
  suffix: string;
  modelId?: string;
}

export interface AiAutocompleteResponse {
  suggestion: string;
  modelUsed: string;
  latencyMs: number;
}

export type SpecializedAgentPersona =
  | 'Planner Agent'
  | 'Repository Analysis Agent'
  | 'Architect Agent'
  | 'Coding Agent'
  | 'Testing Agent'
  | 'Debugging Agent'
  | 'Code Review Agent'
  | 'Documentation Agent'
  | 'Security Review Agent';

export interface AiAgentStep {
  id: string;
  title: string;
  agentPersona: SpecializedAgentPersona;
  type: 'analyze' | 'edit_file' | 'create_file' | 'run_command' | 'verify';
  targetPath?: string;
  command?: string;
  proposedContent?: string;
  previousContent?: string;
  status: 'pending' | 'running' | 'awaiting_approval' | 'completed' | 'rejected' | 'skipped';
  summary: string;
}

export interface AiAgentPlan {
  id: string;
  goal: string;
  checkpointId: string;
  steps: AiAgentStep[];
  createdAt: string;
}

export interface AgentCheckpoint {
  id: string;
  label: string;
  timestamp: string;
  filesSnapshot: WorkspaceFile[];
}

export interface RagSearchResult {
  filePath: string;
  line: number;
  snippet: string;
  score: number;
  symbolName?: string;
  symbolKind?: 'function' | 'class' | 'interface' | 'variable';
}

export interface McpToolDefinition {
  name: string;
  description: string;
  enabled: boolean;
  inputSchema: Record<string, string>;
}

export interface McpServerDescriptor {
  id: string;
  name: string;
  category: 'filesystem' | 'git' | 'database' | 'devops' | 'browser' | 'custom';
  transport: 'stdio' | 'sse' | 'http';
  endpoint?: string;
  status: 'connected' | 'disconnected';
  tools: McpToolDefinition[];
}

export interface TestCaseResult {
  id: string;
  suite: string;
  name: string;
  status: 'passed' | 'failed';
  durationMs: number;
  assertionDetail: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: 'security' | 'ai-governance' | 'mcp-tool' | 'terminal-gate' | 'git-ops';
  actor: string;
  action: string;
  outcome: 'allowed' | 'blocked' | 'redacted' | 'approved';
  detail: string;
}

export interface IdeSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  minimapEnabled: boolean;
  lineNumbers: 'on' | 'off' | 'relative';
  autoSave: boolean;
  autocompleteEnabled: boolean;
  localOnlyPrivacyMode: boolean;
  secretRedactionEnabled: boolean;
  tokenBudgetLimit: number;
  vectorStoreBackend: 'local-memory' | 'chromadb' | 'qdrant' | 'faiss';
  terminalApprovalPolicy: 'strict' | 'moderate' | 'permissive';
  aiRoleModels: Record<AiModelRole, { providerId: AiProviderId; modelId: string }>;
}

export interface MacReleaseArtifact {
  filename: string;
  path: string;
  arch: 'arm64' | 'x64' | 'universal' | 'checksum';
  format: 'dmg' | 'zip' | 'command' | 'app' | 'sha256';
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  signingStatus: string;
  notarizationStatus: string;
  downloadUrl: string;
}

export interface SystemDiagnosticMetrics {
  timestamp: string;
  uptimeSeconds: number;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
  };
  cpuLoadPercent: number;
  concurrencyCapacity: {
    targetConcurrentUsers: number;
    activeWorkerPool: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    errorRatePercent: number;
    status: 'healthy' | 'degraded';
  };
  macOSAppInfo: {
    appId: string;
    productName: string;
    version: string;
    keychainEncryption: string;
    appSupportDir: string;
  };
}

export type IpcChannel =
  | 'nexus:workspace:list'
  | 'nexus:workspace:save'
  | 'nexus:workspace:delete'
  | 'nexus:workspace:rename'
  | 'nexus:terminal:execute'
  | 'nexus:terminal:classify'
  | 'nexus:git:status'
  | 'nexus:git:stage'
  | 'nexus:git:commit'
  | 'nexus:ai:chat'
  | 'nexus:ai:inline-edit'
  | 'nexus:ai:autocomplete'
  | 'nexus:ai:agent-plan'
  | 'nexus:ai:review'
  | 'nexus:ai:generate-tests'
  | 'nexus:rag:search'
  | 'nexus:mcp:list'
  | 'nexus:mcp:invoke'
  | 'nexus:window:control'
  | 'nexus:macos:open-dialog'
  | 'nexus:macos:save-dialog'
  | 'nexus:macos:keychain-status'
  | 'nexus:macos:app-paths';

export interface NexusDesktopAPI {
  platform: string;
  isElectron: boolean;
  invoke: <TReq = unknown, TRes = unknown>(channel: IpcChannel, payload?: TReq) => Promise<TRes>;
}

declare global {
  interface Window {
    nexusAPI?: NexusDesktopAPI;
  }
}
