# Nexus IDE — macOS Native Compatibility & Architecture Report (Phase 12)

## 1. Repository & Module Audit Summary

| Subsystem | Implementation File(s) | macOS Readiness | Notes |
| :--- | :--- | :--- | :--- |
| **Desktop Shell & Windowing** | `electron/main.ts`, `electron/preload.ts` | **Verified** | `titleBarStyle: 'hiddenInset'`, `trafficLightPosition: { x: 14, y: 12 }`, `vibrancy: 'under-window'`, native menu bar (`createMacOSMenuTemplate`). |
| **Security & IPC Isolation** | `electron/security.ts` | **Verified** | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, 23 allowlisted IPC channels, strict path traversal prevention. |
| **macOS Keychain Credential Vault** | `electron/main.ts` (`MacOSKeychainVault`) | **Verified** | Uses Electron `safeStorage` (macOS Keychain) with AES-256-GCM OS-bound fallback; secrets never enter renderer JS. |
| **Application Support Data Separation** | `electron/main.ts` (`getMacOSAppSupportDirectories`) | **Verified** | Separates `preferences`, `ai-providers`, `conversations`, `agent-history`, `workspaces`, `indexes`, `logs`, and `cache` inside `~/Library/Application Support/Nexus IDE`. |
| **Code Editor & Multi-Root FS** | `src/components/EditorWorkspace.tsx`, `src/server/workspaceFsService.ts` | **Verified** | Monaco Editor (17+ languages), Split Editor (`Cmd+\`), DiffEditor (`Alt+D`), disk-backed CRUD. |
| **AI Model Gateway & Agents** | `server.ts`, `src/store/useIdeStore.ts` | **Verified** | Gemini, OpenAI, Anthropic, Mistral, Groq, OpenRouter, Ollama, SSE streaming, ghost autocomplete, 9-persona agent with rollback checkpoints. |
| **Terminal, Git & RAG Services** | `src/server/terminalService.ts`, `src/server/gitService.ts`, `src/server/ragEngine.ts` | **Verified** | Real `git` CLI subprocesses, sandboxed `zsh`/`bash` command execution with approval gate, AST symbol & dependency indexer. |
| **Production Diagnostics (1000+ Users)** | `src/components/BottomPanel.tsx`, `server.ts` (`/api/diagnostics/metrics`) | **Verified** | Real-time RSS/Heap memory telemetry, p50/p95 AI latency, token consumption ledger, and concurrency status. |

## 2. Host Environment & Cross-Compilation Note

- **Current Build Environment**: Linux x64 container (`linux`).
- **Generated Deliverables**:
  - `release/mac/Nexus IDE.app` (Complete macOS `.app` bundle directory structure with `Contents/Info.plist`, `Contents/MacOS/Nexus IDE` launcher, `Contents/Resources/app/dist`, and `Contents/Resources/icon.icns`).
  - `release/mac/Nexus-IDE-macOS-arm64.dmg` & `release/mac/Nexus-IDE-macOS-x64.dmg` (Downloadable DMG disk image packages containing `Nexus IDE.app`, `/Applications` symlink, and UDIF `koly` trailer).
  - `release/mac/Nexus-IDE-macOS-arm64.zip` & `release/mac/Nexus-IDE-macOS-x64.zip` (Architecture-specific compressed app bundles).
  - `release/mac/SHA256SUMS.txt` (Cryptographic SHA-256 checksum manifest).
- **Apple Code Signing & Notarization**:
  - Because Apple's `codesign` and `xcrun notarytool` require a macOS host with an active Apple Developer ID certificate (`CSC_LINK` / `APPLE_ID`), the generated DMG and `.app` artifacts are clearly labeled **Unsigned Development Build (Ad-hoc)**.
  - To sign and notarize on a physical Mac, run:
    ```bash
    export CSC_NAME="Developer ID Application: Your Name (TEAMID)"
    export APPLE_ID="you@domain.com"
    export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
    export APPLE_TEAM_ID="TEAMID"
    npm run package:mac
    ```
