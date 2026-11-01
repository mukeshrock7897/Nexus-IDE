# Nexus IDE — Packaging, Deployment & Operations Guide

## 1. Environment & AI Provider Configuration
- Nexus IDE routes all AI model calls through its server-side gateway (`server.ts`).
- Provider credentials (`GEMINI_API_KEY`, etc.) are injected via environment variables or operating-system secret storage and are never exposed to the client renderer bundle.
- Supported Task Roles (`coding`, `reasoning`, `chat`, `inline_edit`, `autocomplete`, `agent`, `review`, `embeddings`) can be routed independently in **Settings (`Ctrl+,`)**.

## 2. Real Disk Workspace Storage
- Workspace projects are persisted on disk under `.nexus-workspaces/<workspaceId>/`.
- Git base snapshots are stored alongside in `.nexus-workspaces/<workspaceId>/.nexus-base/` to compute unified diffs and support working tree rollbacks.
- All file paths are validated via `validateWorkspacePath` to block directory traversal (`..`) and null-byte injection.

## 3. Model Context Protocol (MCP) Integration
- Built-in MCP servers (`mcp-filesystem`, `mcp-git`, `mcp-database`, `mcp-devops`) and custom `stdio`, `sse`, or `http` servers can be registered and toggled in the **MCP Ecosystem (`Ctrl+Shift+M`)** sidebar.
- Every MCP tool invocation is recorded in the **Enterprise Security & Governance Audit Trail (`Ctrl+Shift+S`)**.

## 4. Desktop Packaging (Windows, macOS, Linux)
- Packaging is configured via `electron-builder.json` targeting macOS (`dmg`, `zip`), Windows (`nsis` x64/arm64), and Linux (`AppImage`, `deb`).
- Before packaging, run:
  ```bash
  npm run lint
  npm test
  npm run build
  ```
