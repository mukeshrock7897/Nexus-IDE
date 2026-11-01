# Nexus IDE — Engineering Checklist (`TODO.md`)

- [x] **Phase 1**: Electron main/preload security boundary (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`), 19 allowlisted IPC channels, and path traversal validation.
- [x] **Phase 2**: Monaco Editor with syntax highlighting for 17+ languages, side-by-side Split Editor (`Ctrl+\`), Monaco `DiffEditor` (`Alt+D`), Go-to-Line, Breadcrumbs, and real disk-backed File Explorer (`src/server/workspaceFsService.ts`).
- [x] **Phase 3**: Multi-Provider AI Gateway supporting Gemini, OpenAI, Anthropic, Mistral, Groq, OpenRouter, Ollama, and Custom OpenAI endpoints with per-task model routing and token/cost ledger.
- [x] **Phase 4**: Multi-thread AI Chat with `@active_file`, `@selection`, `@workspace`, `@git_diff`, `@terminal`, and `@problems` context chips, SSE streaming, ghost text autocomplete, and `Ctrl+K` inline diff preview.
- [x] **Phase 5**: 9-Persona Autonomous Coding Agent (`Planner`, `Architect`, `Coder`, `Refactor`, `Debugger`, `Test`, `Reviewer`, `Documentation`, `DevOps`) with pre-execution workspace checkpoints and single-click rollback.
- [x] **Phase 6**: Hybrid RAG Engine (`src/server/ragEngine.ts`) extracting AST classes, interfaces, functions, and import dependency edges with semantic + lexical + symbol search modes.
- [x] **Phase 7**: Model Context Protocol (MCP) Hub with custom server registration (`stdio`, `sse`, `http`), per-tool permission toggles, and real backend tool execution (`/api/mcp/invoke`).
- [x] **Phase 8**: Real Git CLI integration (`src/server/gitService.ts`), real process terminal execution (`src/server/terminalService.ts`), AI Debugger, AI Test Generator, and AI Documentation Generator.
- [x] **Phase 9**: Outbound secret redaction scanner (`src/server/securityGovernance.ts`), terminal command risk gate (`safe`, `moderate`, `high`, `critical`), and immutable Governance Audit Log.
- [x] **Phase 10**: Cross-platform `electron-builder.json` and `.github/workflows/nexus-ci.yml` release pipeline for Windows, macOS, and Linux.
- [x] **Phase 11**: End-to-End integration tests (`src/tests/e2eScenarios.test.ts`) verifying all 10 user scenarios against real disk workspaces.
