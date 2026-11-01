# Nexus IDE — System Architecture

## 1. Architectural Overview

Nexus IDE is an AI-native desktop development environment engineered with strict separation of concerns across the Desktop Shell, Renderer UI, Editor Engine, Workspace & File Services, Integrated Terminal, Git Source Control, Multi-Provider AI Gateway, Agentic AI Orchestrator, Codebase RAG Indexer, and Security/Permission Management.

```
+-----------------------------------------------------------------------------------+
|                                  NEXUS IDE SHELL                                  |
|  +-----------------------------------------------------------------------------+  |
|  |Renderer Process (React 19 + TypeScript + Tailwind v4 + Radix UI + Zustand)  |  |
|  |                                                                             |  |
|  |  +-------------+  +-------------------+  +---------------+  +------------+  |  |
|  |  | ActivityBar |  |Main Monaco Editor |  |  AI Assistant |  |Command     |  |  |
|  |  | & Explorer  |  | (Multi-Tab, Diff, |  |  & Autonomous |  |Palette &   |  |  |
|  |  | Sidebar     |  |  Inline Cmd+K AI) |  |  Agent Panel  |  |Settings    |  |  |
|  |  +-------------+  +-------------------+  +---------------+  +------------+  |  |
|  |                   | Bottom Panel: Terminal | Problems | Output | Tests    |  |  |
|  +-----------------------------------------------------------------------------+  |
|                                         |                                         |
|                 Typed IPC Contract (contextBridge / Preload / HTTP Bridge)        |
|                                         v                                         |
|  +-----------------------------------------------------------------------------+  |
|  | Main Process & Backend Core Services (Electron Main / Node.js Server)       |  |
|  |                                                                             |  |
|  |  +----------------+ +----------------+ +----------------+ +--------------+  |  |
|  |  | Workspace & FS | | Terminal & Cmd | | Git Service    | | Security &   |  |  |
|  |  | Service        | | Approval Guard | | (Diff/Commit)  | | IPC Validator|  |  |
|  |  +----------------+ +----------------+ +----------------+ +--------------+  |  |
|  |  +----------------+ +----------------+ +----------------+ +--------------+  |  |
|  |  | Multi-Provider | | Autonomous AI  | | Codebase RAG   | | MCP Server   |  |  |
|  |  | AI Gateway     | | Agent Engine   | | & Symbol Index | | Orchestrator |  |  |
|  |  +----------------+ +----------------+ +----------------+ +--------------+  |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
```

## 2. Core Architectural Boundaries

### 2.1 Desktop Application Shell (`/electron`)
- **`electron/main.ts`**: Manages native `BrowserWindow` lifecycle, enforces strict Chromium security flags (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), registers validated IPC handlers, and manages native window state.
- **`electron/preload.ts`**: Exposes a minimal, strictly typed `window.nexusAPI` surface via `contextBridge.exposeInMainWorld`. Raw `ipcRenderer` or Node.js primitives are never exposed to the renderer.
- **`electron/security.ts`**: Performs IPC channel allowlisting, workspace path traversal validation (`validateWorkspacePath`), and shell command risk classification (`classifyCommandRisk`: `safe`, `moderate`, `critical`).

### 2.2 Shared Typed IPC Contract (`/src/shared/ipc-types.ts`)
- Defines all request/response contracts between Renderer and Main/Backend services:
  - `WorkspaceFile`, `FileNode`, `GitStatusReport`, `GitCommitRecord`
  - `TerminalExecutionRequest`, `TerminalExecutionResult`, `CommandRiskAssessment`
  - `AiModelRole` (`chat`, `coding`, `reasoning`, `autocomplete`, `embeddings`)
  - `AiChatRequest`, `AiInlineEditRequest`, `AiAgentPlan`, `AiAgentStep`
  - `McpServerDescriptor`, `RagSearchResult`, `IdeSettings`

### 2.3 Unified Service Client (`/src/services/ipcClient.ts`)
- Provides a single typed client interface to the React application.
- Automatically routes through `window.nexusAPI` when running inside the Electron desktop runtime, or through `/api/*` REST/streaming endpoints when running in the web preview runtime.

### 2.4 Backend & Core Services (`/server.ts` & `/src/server/`)
- **Workspace & File System Service**: Manages multi-file project trees, file CRUD operations, symbol extraction, and starter templates.
- **Git Source Control Service**: Computes unified line diffs against base snapshots, manages staged/unstaged file states, branches, and commit history.
- **Terminal & Command Approval Service**: Evaluates commands against security policies, requires explicit user confirmation for high-risk or mutating shell operations, and executes workspace commands and test runners.
- **Multi-Provider AI Gateway**: Routes requests by task role (`chat`, `coding`, `reasoning`, `autocomplete`) to configured providers (Google Gemini via `@google/genai` server-side SDK, Ollama, OpenRouter, OpenAI-compatible endpoints) with token accounting, latency tracking, and retry logic.
- **RAG Codebase Intelligence & MCP Registry**: Indexes project files into searchable chunks and symbols, and exposes Model Context Protocol (MCP) tools for filesystem, git, and test runner operations.

### 2.5 Renderer UI & State Management (`/src/store` & `/src/components`)
- **`src/store/useIdeStore.ts`**: Zustand store managing workspace files, open tabs, active editor state, panel visibility and dimensions, terminal history, command approval queue, Git status, AI conversation threads, agent execution steps, problems/diagnostics, and persistent user preferences.
- **Resizable IDE Layout**: Custom drag-resize handles with keyboard accessibility and layout persistence.
