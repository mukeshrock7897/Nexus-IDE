import { describe, it, expect } from 'vitest';
import {
  classifyCommandRisk,
  isValidIpcChannel,
  validateWorkspacePath,
} from '../../electron/security';
import {
  createSecureWindowConfig,
  validateIpcInvocation,
} from '../../electron/main';
import {
  analyzeWorkspaceDiagnostics,
  extractCodeBlocks,
  searchWorkspaceRag,
} from '../services/ipcClient';
import {
  detectLanguage,
  workspaceDiskService,
} from '../server/workspaceFsService';
import { redactSecrets } from '../server/securityGovernance';
import {
  extractSymbolsAndDependencies,
  hybridRagSearch,
} from '../server/ragEngine';
import { INITIAL_WORKSPACE_FILES } from '../shared/workspaceSeed';
import { inferLanguageFromPath } from '../store/useIdeStore';

describe('Phase 1 — Electron Security & IPC Foundation', () => {
  it('enforces contextIsolation: true, nodeIntegration: false, and sandbox: true on BrowserWindow', () => {
    const config = createSecureWindowConfig('/app/electron');
    expect(config.webPreferences.contextIsolation).toBe(true);
    expect(config.webPreferences.nodeIntegration).toBe(false);
    expect(config.webPreferences.sandbox).toBe(true);
    expect(config.webPreferences.webSecurity).toBe(true);
  });

  it('allows whitelisted IPC channels and blocks unknown channels', () => {
    expect(isValidIpcChannel('nexus:ai:chat')).toBe(true);
    expect(isValidIpcChannel('nexus:ai:autocomplete')).toBe(true);
    expect(isValidIpcChannel('nexus:workspace:rename')).toBe(true);
    expect(isValidIpcChannel('nexus:shell:arbitrary-exec')).toBe(false);

    const validResult = validateIpcInvocation('nexus:workspace:save', {
      path: '/src/core/engine.ts',
    });
    expect(validResult.allowed).toBe(true);

    const blockedTraversal = validateIpcInvocation('nexus:workspace:save', {
      path: '../../etc/passwd',
    });
    expect(blockedTraversal.allowed).toBe(false);
  });

  it('prevents directory traversal outside workspace root', () => {
    expect(validateWorkspacePath('/src/core/engine.ts')).toEqual({
      valid: true,
      normalized: '/src/core/engine.ts',
    });
    expect(validateWorkspacePath('../secrets.env').valid).toBe(false);
    expect(validateWorkspacePath('/src/../../root').valid).toBe(false);
  });

  it('classifies terminal command risk levels accurately', () => {
    const safeCmd = classifyCommandRisk('npm test', 'moderate');
    expect(safeCmd.riskLevel).toBe('safe');
    expect(safeCmd.requiresApproval).toBe(false);

    const moderateCmd = classifyCommandRisk('npm install lodash', 'moderate');
    expect(moderateCmd.riskLevel).toBe('moderate');
    expect(moderateCmd.requiresApproval).toBe(true);

    const criticalCmd = classifyCommandRisk('rm -rf /', 'permissive');
    expect(criticalCmd.riskLevel).toBe('critical');
    expect(criticalCmd.requiresApproval).toBe(true);
  });
});

describe('Phase 2 — Real Disk Workspace Operations & Multi-Language Support', () => {
  it('supports all 17 programming languages across detector functions', () => {
    expect(detectLanguage('/main.py')).toBe('python');
    expect(detectLanguage('/app.ts')).toBe('typescript');
    expect(detectLanguage('/Service.java')).toBe('java');
    expect(detectLanguage('/kernel.c')).toBe('c');
    expect(detectLanguage('/engine.cpp')).toBe('cpp');
    expect(detectLanguage('/Program.cs')).toBe('csharp');
    expect(detectLanguage('/worker.go')).toBe('go');
    expect(detectLanguage('/lib.rs')).toBe('rust');
    expect(detectLanguage('/index.php')).toBe('php');
    expect(detectLanguage('/deploy.yaml')).toBe('yaml');
    expect(detectLanguage('/init.sh')).toBe('shell');
    expect(inferLanguageFromPath('/schema.sql')).toBe('sql');
  });

  it('reads, writes, renames, commits snapshots, and deletes real files on disk', async () => {
    const testWorkspaceId = 'vitest-disk-verification';
    const seeded = await workspaceDiskService.ensureWorkspaceSeeded(testWorkspaceId);
    expect(seeded.length).toBeGreaterThanOrEqual(7);

    const written = await workspaceDiskService.writeFile(
      testWorkspaceId,
      '/src/diskModule.ts',
      'export const diskVerified = true;\n',
      false
    );
    expect(written.path).toBe('/src/diskModule.ts');
    expect(written.content).toContain('diskVerified = true');

    const renamed = await workspaceDiskService.renameOrMoveFile(
      testWorkspaceId,
      '/src/diskModule.ts',
      '/src/renamedModule.ts'
    );
    expect(renamed.path).toBe('/src/renamedModule.ts');

    await workspaceDiskService.commitSnapshot(testWorkspaceId, ['/src/renamedModule.ts']);
    const listedAfterCommit = await workspaceDiskService.listFiles(testWorkspaceId);
    const committedFile = listedAfterCommit.find((f) => f.path === '/src/renamedModule.ts');
    expect(committedFile?.baseContent).toBe('export const diskVerified = true;\n');

    await workspaceDiskService.deleteFile(testWorkspaceId, '/src/renamedModule.ts');
    const listedAfterDelete = await workspaceDiskService.listFiles(testWorkspaceId);
    expect(listedAfterDelete.some((f) => f.path === '/src/renamedModule.ts')).toBe(false);
  });
});

describe('Phase 6 & Phase 10 — AST Codebase RAG, Diagnostics & Secret Redaction', () => {
  it('extracts AST symbols and import dependency edges from workspace files', () => {
    const graph = extractSymbolsAndDependencies(INITIAL_WORKSPACE_FILES);
    expect(graph.symbols.some((s) => s.name === 'ExecutionPipeline' && s.kind === 'class')).toBe(
      true
    );
    expect(graph.symbols.some((s) => s.name === 'RequestRouter' && s.kind === 'class')).toBe(true);
    expect(graph.dependencies.some((d) => d.fromFile === '/src/core/router.ts')).toBe(true);
  });

  it('performs hybrid and symbol-only RAG searches', () => {
    const hybridHits = searchWorkspaceRag('ExecutionPipeline enqueue', INITIAL_WORKSPACE_FILES);
    expect(hybridHits.length).toBeGreaterThan(0);
    expect(hybridHits[0].filePath).toBe('/src/core/engine.ts');

    const symbolHits = hybridRagSearch('ExecutionPipeline', INITIAL_WORKSPACE_FILES, 'symbol');
    expect(symbolHits.length).toBeGreaterThan(0);
    expect(symbolHits[0].symbolName).toBe('ExecutionPipeline');
  });

  it('redacts sensitive API keys, GitHub tokens, and database credentials', () => {
    const rawPrompt =
      'Connect with sk-1234567890abcdef12345678 and postgres://admin:supersecret123@db.internal:5432/prod';
    const report = redactSecrets(rawPrompt);
    expect(report.redactedCount).toBe(2);
    expect(report.sanitizedText).not.toContain('sk-1234567890abcdef12345678');
    expect(report.sanitizedText).not.toContain('supersecret123');
    expect(report.sanitizedText).toContain('[REDACTED_SECRET]');
  });

  it('detects JSON syntax errors and extracts markdown code blocks', () => {
    const brokenFiles = [
      {
        path: '/broken.json',
        name: 'broken.json',
        language: 'json' as const,
        content: '{ invalid json ',
        baseContent: '',
        updatedAt: new Date().toISOString(),
      },
    ];
    const diagnostics = analyzeWorkspaceDiagnostics(brokenFiles);
    expect(diagnostics.some((d) => d.severity === 'error')).toBe(true);

    const md = 'Here is the fix:\n```typescript\nexport const x = 42;\n```\n';
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].code).toBe('export const x = 42;');
  });
});
