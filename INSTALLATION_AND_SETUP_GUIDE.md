# Nexus IDE — macOS Installation, First-Time Setup & Troubleshooting Guide

## 1. Downloading & Installing `Nexus-IDE-macOS.dmg`

1. **Download the Installer**:
   - In the Nexus IDE top bar, click **macOS .dmg** (or open `Ctrl+Shift+P` $\rightarrow$ `macOS: Download Nexus-IDE-macOS.dmg`).
   - Select your Mac architecture:
     - **Apple Silicon (M1 / M2 / M3 / M4)**: `Nexus-IDE-macOS-arm64.dmg`
     - **Intel Mac**: `Nexus-IDE-macOS-x64.dmg`
2. **Verify Checksum (Optional)**:
   ```bash
   shasum -a 256 -c SHA256SUMS.txt
   ```
3. **Install to `/Applications`**:
   - Double-click the downloaded `.dmg` or `.zip` archive.
   - Drag **Nexus IDE.app** into the **Applications** folder (`/Applications/Nexus IDE.app`).
4. **Launch Nexus IDE**:
   - Open **Applications** in Finder or Spotlight (`Cmd+Space`) and launch **Nexus IDE**.

---

## 2. First-Time Setup & AI Provider Configuration

On first launch (or via **File $\rightarrow$ First-Time Setup & Onboarding Wizard...**):

1. **Select or Create a Workspace**:
   - Choose `nexus-runtime-core`, `nexus-fullstack-gateway`, `nexus-rag-intelligence`, or open any local project folder (`Cmd+O`).
2. **Configure AI Providers**:
   - **Cloud Providers (Gemini, OpenAI, Anthropic, Mistral, Groq, OpenRouter)**: Credentials are encrypted in the macOS Keychain via Electron `safeStorage` (`com.nexuside.desktop`) or read from your environment.
   - **Local Offline Models (Ollama)**: Toggle **Local-Only Privacy Mode** in Settings (`Cmd+,`) to route coding, chat, and autocomplete requests to `http://127.0.0.1:11434`.
3. **Select Task Role Models**:
   - Assign dedicated models for `coding`, `reasoning`, `chat`, `inline_edit`, `autocomplete`, `embeddings`, `agent`, and `review`.

---

## 3. macOS Troubleshooting & Gatekeeper Guide

### Issue: "Nexus IDE.app cannot be opened because the developer cannot be verified"
Because development builds generated without an Apple Developer ID certificate are unsigned, macOS Gatekeeper may quarantine the downloaded bundle.

**Fix (Terminal)**:
```bash
xattr -cr "/Applications/Nexus IDE.app"
open -a "/Applications/Nexus IDE.app"
```

### Issue: Resetting Application Support Data
All user preferences, chat history, and workspace indexes are stored outside the app bundle at:
```text
~/Library/Application Support/Nexus IDE/
├── preferences/
├── ai-providers/
├── conversations/
├── agent-history/
├── workspaces/
├── indexes/
├── logs/
└── cache/
```
Uninstalling `/Applications/Nexus IDE.app` preserves your workspaces; delete `~/Library/Application Support/Nexus IDE/cache` to clear cached indexes.
