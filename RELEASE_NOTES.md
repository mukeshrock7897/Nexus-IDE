# Nexus IDE v2.4.0 — Release Notes (macOS Native Edition)

- **Application Name**: Nexus IDE
- **Bundle Identifier**: `com.nexuside.desktop`
- **Version**: `2.4.0` (`2026.11.01`)
- **Minimum macOS Version**: macOS 12.0 (Monterey or newer)
- **Supported Architectures**: Apple Silicon (`arm64`) & Intel (`x64`)

## What's New in v2.4.0 (Phase 12)

1. **Native macOS Application Bundle (`Nexus IDE.app`) & DMG Installers**:
   - Added `Nexus-IDE-macOS-arm64.dmg`, `Nexus-IDE-macOS-x64.dmg`, `Nexus-IDE-macOS-arm64.zip`, `Nexus-IDE-macOS-x64.zip`, and `SHA256SUMS.txt`.
   - Native macOS menu bar, `hiddenInset` window chrome, `nexus://` deep-link handler, and Hardened Runtime entitlements (`build/entitlements.mac.plist`).
2. **macOS Keychain & Application Support Data Separation**:
   - Implemented `MacOSKeychainVault` (`safeStorage` / AES-256-GCM) and isolated `~/Library/Application Support/Nexus IDE` directories.
3. **Real-Time Production Diagnostics Dashboard (1,000+ Concurrent Users)**:
   - Added the **Diagnostics & Telemetry** tab in the bottom panel displaying live RSS/Heap memory usage, p50/p95 AI Gateway latency, and per-role AI model token consumption.
4. **First-Time User Onboarding & Interactive macOS DMG Download Center**:
   - Added 4-step Onboarding Wizard and in-app macOS DMG Installer & Download modal.
