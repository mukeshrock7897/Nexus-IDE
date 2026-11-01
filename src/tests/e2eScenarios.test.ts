import { describe, expect, it } from 'vitest';
import { workspaceDiskService } from '../server/workspaceFsService';
import { realGitService } from '../server/gitService';
import { executeWorkspaceTerminalCommand } from '../server/terminalService';
import { persistenceService } from '../server/persistenceService';
import { extractSymbolsAndDependencies, hybridRagSearch } from '../server/ragEngine';
import { redactSecrets } from '../server/securityGovernance';
import { useIdeStore } from '../store/useIdeStore';
import type { GitCommitRecord, WorkspaceFile } from '../shared/ipc-types';

describe('Nexus IDE — Final Phase End-to-End Scenarios (Real Local Workspace)', () => {
  const testWorkspaceId = 'nexus-e2e-audit-workspace';

  it('Scenario 1: Open a Python project, index AST symbols & dependencies, and verify RAG references actual source files', async () => {
    await workspaceDiskService.deleteFile(testWorkspaceId, '/docs/GENERATED_ARCHITECTURE.md');
    await workspaceDiskService.writeFile(
      testWorkspaceId,
      '/pipeline/processor.py',
      `from typing import List\n\nclass DataPipeline:\n    def transform_batch(self, items: List[str]) -> List[str]:\n        return [item.strip().lower() for item in items if item.strip()]\n`,
      true
    );

    const files = await workspaceDiskService.listFiles(testWorkspaceId);
    const pythonFile = files.find((f: WorkspaceFile) => f.path === '/pipeline/processor.py');
    expect(pythonFile).toBeDefined();
    expect(pythonFile?.language).toBe('python');

    const graph = extractSymbolsAndDependencies(files);
    const classSym = graph.symbols.find((s) => s.name === 'DataPipeline');
    const fnSym = graph.symbols.find((s) => s.name === 'transform_batch');
    expect(classSym?.filePath).toBe('/pipeline/processor.py');
    expect(fnSym?.filePath).toBe('/pipeline/processor.py');

    const ragHits = hybridRagSearch('DataPipeline transform_batch', files, 'hybrid');
    expect(ragHits.length).toBeGreaterThan(0);
    expect(ragHits.some((h) => h.filePath === '/pipeline/processor.py')).toBe(true);
  });

  it('Scenario 2: Scaffold a FastAPI application and verify generated files on disk', async () => {
    const store = useIdeStore.getState();
    store.scaffoldCompleteApplication('fastapi-auth');

    const mainPy = useIdeStore.getState().files.find((f) => f.path === '/app/main.py');
    const dockerfile = useIdeStore.getState().files.find((f) => f.path === '/app/Dockerfile');
    expect(mainPy).toBeDefined();
    expect(mainPy?.content).toContain('class AuthService');
    expect(dockerfile).toBeDefined();
    expect(dockerfile?.content).toContain('FROM python:3.12-slim');

    // Persist generated files to real disk workspace and verify
    await workspaceDiskService.writeFile(testWorkspaceId, '/app/main.py', mainPy!.content, true);
    await workspaceDiskService.writeFile(
      testWorkspaceId,
      '/app/Dockerfile',
      dockerfile!.content,
      true
    );
    const diskFiles = await workspaceDiskService.listFiles(testWorkspaceId);
    expect(diskFiles.some((f: WorkspaceFile) => f.path === '/app/main.py')).toBe(true);
    expect(diskFiles.some((f: WorkspaceFile) => f.path === '/app/Dockerfile')).toBe(true);
  });

  it('Scenario 3: Agent modifies multiple files with checkpoint creation, diff verification, and rollback', () => {
    const store = useIdeStore.getState();
    const originalEngine = store.files.find((f) => f.path === '/src/core/engine.ts')?.content || '';
    const checkpoint = store.createCheckpoint('Before Multi-File Agent Refactor');

    store.updateFileContent(
      '/src/core/engine.ts',
      `${originalEngine}\n// Agent multi-file enhancement v1\n`
    );
    store.createFile('/src/core/telemetry.ts', 'export const TELEMETRY_ENABLED = true;\n');

    expect(
      useIdeStore.getState().files.find((f) => f.path === '/src/core/engine.ts')?.content
    ).toContain('Agent multi-file enhancement v1');
    expect(
      useIdeStore.getState().files.some((f) => f.path === '/src/core/telemetry.ts')
    ).toBe(true);

    // Rollback to checkpoint and verify restoration
    store.rollbackToCheckpoint(checkpoint.id);
    expect(
      useIdeStore.getState().files.find((f) => f.path === '/src/core/engine.ts')?.content
    ).toBe(originalEngine);
  });

  it('Scenario 4: Introduce a syntax/test failure, detect via diagnostics, apply fix, and rerun tests', () => {
    const store = useIdeStore.getState();
    store.createFile('/config/broken.json', '{ "invalidJson": true, ');

    const errorDiag = useIdeStore
      .getState()
      .problems.find((p) => p.filePath === '/config/broken.json' && p.severity === 'error');
    expect(errorDiag).toBeDefined();

    // Apply fix and verify error is cleared
    store.updateFileContent('/config/broken.json', '{\n  "invalidJson": false\n}\n');
    const postFixDiag = useIdeStore
      .getState()
      .problems.find((p) => p.filePath === '/config/broken.json' && p.severity === 'error');
    expect(postFixDiag).toBeUndefined();

    // Rerun test suite
    store.runTestSuite();
    const allPassed = useIdeStore.getState().testResults.every((t) => t.status === 'passed');
    expect(allPassed).toBe(true);
    store.deleteFile('/config/broken.json');
  });

  it('Scenario 5: Generate architecture documentation from existing codebase and persist to workspace', async () => {
    const files = await workspaceDiskService.listFiles(testWorkspaceId);
    const graph = extractSymbolsAndDependencies(files);
    const generatedDoc = `# ${testWorkspaceId} Architecture\n\nIndexed Files: ${graph.fileCount}\nExtracted Symbols: ${graph.symbols.map((s) => s.name).join(', ')}\n`;

    const saved = await workspaceDiskService.writeFile(
      testWorkspaceId,
      '/docs/GENERATED_ARCHITECTURE.md',
      generatedDoc,
      true
    );
    expect(saved.path).toBe('/docs/GENERATED_ARCHITECTURE.md');
    expect(saved.content).toContain('DataPipeline');
  });

  it('Scenario 6: Connect an MCP server and execute an approved tool with governance audit logging', () => {
    const store = useIdeStore.getState();
    const beforeAuditCount = store.auditLogs.length;

    store.invokeMcpTool('mcp-filesystem', 'fs_list_symbols', { directory: '/src' });

    const afterState = useIdeStore.getState();
    expect(afterState.auditLogs.length).toBeGreaterThan(beforeAuditCount);
    expect(afterState.auditLogs[0].category).toBe('mcp-tool');
    expect(afterState.auditLogs[0].outcome).toBe('allowed');
  });

  it('Scenario 7: Open a real Git repository on disk, stage changes, commit, and switch branches', async () => {
    await realGitService.ensureRepoInitialized(testWorkspaceId);
    await workspaceDiskService.writeFile(
      testWorkspaceId,
      '/src/git_feature.ts',
      `export const gitFeature = "v-${Date.now()}";\n`,
      false
    );

    await realGitService.stageFile(testWorkspaceId, '/src/git_feature.ts');
    const statusAfterCommit = await realGitService.commit(
      testWorkspaceId,
      'feat(git): add real git feature module'
    );
    expect(statusAfterCommit.commits.length).toBeGreaterThan(0);
    expect(
      statusAfterCommit.commits.some((c: GitCommitRecord) =>
        c.message.includes('git feature module')
      )
    ).toBe(true);

    const branchStatus = await realGitService.checkoutBranch(
      testWorkspaceId,
      'feat/e2e-branch',
      true
    );
    expect(branchStatus.branch).toBe('feat/e2e-branch');
  });

  it('Scenario 8: Execute real shell commands inside the workspace through the integrated terminal service', async () => {
    const execRes = await executeWorkspaceTerminalCommand(
      testWorkspaceId,
      'node -e "console.log(21 * 2)"',
      'moderate',
      true
    );
    expect(execRes.exitCode).toBe(0);
    expect(execRes.stdout.trim()).toBe('42');
  });

  it('Scenario 9: Switch AI providers/models per task role and verify outbound secret redaction', () => {
    const store = useIdeStore.getState();
    store.updateSettings({
      aiRoleModels: {
        ...store.settings.aiRoleModels,
        reasoning: { providerId: 'anthropic', modelId: 'claude-3-7-sonnet' },
        autocomplete: { providerId: 'gemini', modelId: 'gemini-3.1-flash-lite' },
      },
    });

    const updated = useIdeStore.getState().settings.aiRoleModels;
    expect(updated.reasoning.providerId).toBe('anthropic');
    expect(updated.autocomplete.modelId).toBe('gemini-3.1-flash-lite');

    const redaction = redactSecrets(
      'Authorization: Bearer sk-1234567890abcdefghijklmnop and AIzaSyD-1234567890abcdefghijk_123456789'
    );
    expect(redaction.redactedCount).toBe(2);
    expect(redaction.sanitizedText).not.toContain('sk-1234567890');
  });

  it('Scenario 10: Persist IDE settings, chat history, and MCP servers to disk and restore after restart', async () => {
    const store = useIdeStore.getState();
    store.updateSettings({ fontSize: 16, tabSize: 4 });

    await persistenceService.saveState({
      workspaceName: testWorkspaceId,
      settings: useIdeStore.getState().settings,
      chatThreads: useIdeStore.getState().chatThreads,
      mcpServers: useIdeStore.getState().mcpServers,
    });

    const restored = await persistenceService.loadState();
    expect(restored?.settings?.fontSize).toBe(16);
    expect(restored?.settings?.tabSize).toBe(4);
    expect(restored?.workspaceName).toBe(testWorkspaceId);
  });

  it('Scenario 11 (Phase 12): Verify macOS Keychain Vault, Application Support separation, Menu Bar, and DMG / .app artifacts', async () => {
    const {
      createMacOSMenuTemplate,
      getMacOSAppSupportDirectories,
      macOSKeychainVault,
      NEXUS_MACOS_METADATA,
    } = await import('../../electron/main');
    const fs = await import('fs');
    const path = await import('path');

    expect(NEXUS_MACOS_METADATA.appId).toBe('com.nexuside.desktop');
    expect(NEXUS_MACOS_METADATA.appName).toBe('Nexus IDE');

    // Verify macOS Menu Bar Template
    const menu = createMacOSMenuTemplate();
    expect(menu.map((m) => m.label)).toEqual([
      'Nexus IDE',
      'File',
      'Edit',
      'View',
      'Window',
      'Help',
    ]);

    // Verify macOS Keychain safeStorage Vault encryption & decryption
    const vaultRes = macOSKeychainVault.setProviderSecret('openai', 'sk-test-macos-keychain-999');
    expect(vaultRes.stored).toBe(true);
    expect(macOSKeychainVault.hasProviderSecret('openai')).toBe(true);
    expect(macOSKeychainVault.decryptForMainProcessOnly('openai')).toBe(
      'sk-test-macos-keychain-999'
    );

    // Verify macOS Application Support directory separation
    const testSupportRoot = path.resolve(process.cwd(), '.nexus-workspaces', 'test-macos-support');
    const dirs = getMacOSAppSupportDirectories(testSupportRoot);
    expect(fs.existsSync(dirs.preferences)).toBe(true);
    expect(fs.existsSync(dirs.conversations)).toBe(true);
    expect(fs.existsSync(dirs.workspaces)).toBe(true);
    expect(fs.existsSync(dirs.indexes)).toBe(true);
    expect(fs.existsSync(dirs.logs)).toBe(true);

    // Verify built macOS .app bundle and DMG / ZIP / .command artifacts exist and are valid binaries
    const releaseDir = path.resolve(process.cwd(), 'release', 'mac');
    if (fs.existsSync(path.join(releaseDir, 'manifest.json'))) {
      expect(
        fs.existsSync(path.join(releaseDir, 'Nexus IDE.app', 'Contents', 'Info.plist'))
      ).toBe(true);
      expect(
        fs.existsSync(
          path.join(releaseDir, 'Nexus IDE.app', 'Contents', 'Resources', 'app', 'macos_server.py')
        )
      ).toBe(true);

      const dmgPath = path.join(releaseDir, 'Nexus-IDE-macOS-arm64.dmg');
      expect(fs.existsSync(dmgPath)).toBe(true);
      const dmgBuf = fs.readFileSync(dmgPath);
      expect(dmgBuf.byteLength).toBeGreaterThan(500_000);
      // Verify Apple UDIF 'koly' trailer at last 512 bytes
      const kolyMagic = dmgBuf.subarray(dmgBuf.byteLength - 512, dmgBuf.byteLength - 508).toString('ascii');
      expect(kolyMagic).toBe('koly');

      const zipPath = path.join(releaseDir, 'Nexus-IDE-macOS-arm64.zip');
      expect(fs.existsSync(zipPath)).toBe(true);
      const zipBuf = fs.readFileSync(zipPath);
      expect(zipBuf[0]).toBe(0x50);
      expect(zipBuf[1]).toBe(0x4b);

      expect(fs.existsSync(path.join(releaseDir, 'Nexus-IDE-macOS-x64.dmg'))).toBe(true);
      expect(fs.existsSync(path.join(releaseDir, 'Nexus-IDE-Mac-Installer.command'))).toBe(true);
      expect(fs.existsSync(path.join(releaseDir, 'SHA256SUMS.txt'))).toBe(true);
    }

    // Verify automatic Mac system detector
    const { detectCurrentMacSystem } = await import('../utils/macSystemDetector');
    const detected = await detectCurrentMacSystem();
    expect(['arm64', 'x64']).toContain(detected.arch);
    expect(detected.recommendedDmg).toContain(detected.arch);
    expect(detected.recommendedCommand).toBe('Nexus-IDE-Mac-Installer.command');
  });
});
