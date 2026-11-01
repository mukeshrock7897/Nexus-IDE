import { useState } from 'react';
import {
  Archive,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Edit3,
  FileCode,
  FilePlus,
  Folder,
  FolderOpen,
  GitBranch,
  GitCommit,
  History,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import {
  extractSymbolsAndDependencies,
  searchWorkspaceRag,
} from '../services/ipcClient';

export function Sidebar() {
  const {
    sidebarVisible,
    sidebarWidth,
    activeActivityView,
    workspaceName,
    files,
    activeFilePath,
    clipboardFilePath,
    selectFile,
    createFile,
    deleteFile,
    renameFile,
    copyFileToClipboard,
    pasteFileFromClipboard,
    moveFileToDirectory,
    loadWorkspacePreset,
    scaffoldCompleteApplication,
    currentBranch,
    branches,
    stagedPaths,
    commits,
    stashes,
    gitAiOutput,
    stageFile,
    unstageFile,
    stageAllModified,
    discardFileChanges,
    commitStagedChanges,
    switchBranch,
    createBranch,
    stashWorkingTree,
    popStash,
    runGitAiAssistant,
    setDiffMode,
    agentPlan,
    checkpoints,
    createCheckpoint,
    rollbackToCheckpoint,
    createAutonomousPlan,
    executeAgentStep,
    rejectAgentStep,
    aiBusy,
    mcpServers,
    invokeMcpTool,
    toggleMcpServerStatus,
    toggleMcpToolEnabled,
    addCustomMcpServer,
    usageLedger,
    auditLogs,
    settings,
    updateSettings,
  } = useIdeStore();

  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('/src/core/service.ts');
  const [fileError, setFileError] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [collapsedDirs, setCollapsedDirs] = useState<Record<string, boolean>>({});
  const [ragQuery, setRagQuery] = useState('ExecutionPipeline priority');
  const [ragMode, setRagMode] = useState<'hybrid' | 'semantic' | 'symbol'>('hybrid');
  const [commitMessage, setCommitMessage] = useState('');
  const [commitError, setCommitError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [agentGoalInput, setAgentGoalInput] = useState(
    'Add a batchEnqueue(tasks: TaskPayload[]) method to ExecutionPipeline and update unit tests'
  );
  const [newMcpName, setNewMcpName] = useState('');
  const [newMcpTransport, setNewMcpTransport] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [newMcpEndpoint, setNewMcpEndpoint] = useState('http://localhost:3000/api/mcp/custom');

  if (!sidebarVisible) return null;

  // Group files by directory for Explorer tree
  const directoryMap = new Map<string, typeof files>();
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);
    const dir = parts.length > 1 ? '/' + parts.slice(0, -1).join('/') : '/';
    const existing = directoryMap.get(dir) || [];
    existing.push(file);
    directoryMap.set(dir, existing);
  }

  const codebaseGraph = extractSymbolsAndDependencies(files);
  const activeSymbols = codebaseGraph.symbols.filter((s) => s.filePath === activeFilePath);
  const modifiedFiles = files.filter((f) => f.content !== f.baseContent);
  const ragResults = searchWorkspaceRag(ragQuery, files, ragMode);

  const handleCreateFile = () => {
    setFileError(null);
    const res = createFile(
      newFilePath,
      `export function initializeModule(): boolean {\n  return true;\n}\n`
    );
    if (!res.ok) {
      setFileError(res.error || 'Invalid file path');
      return;
    }
    setNewFileOpen(false);
    setNewFilePath('/src/core/newModule.ts');
  };

  const handleRenameConfirm = (oldPath: string) => {
    if (!renameValue.trim()) {
      setRenamingPath(null);
      return;
    }
    renameFile(oldPath, renameValue);
    setRenamingPath(null);
  };

  const handleCommit = () => {
    setCommitError(null);
    const res = commitStagedChanges(commitMessage);
    if (!res.ok) {
      setCommitError(res.error || 'Commit failed');
      return;
    }
    setCommitMessage('');
  };

  const totalTokensUsed = usageLedger.reduce((acc, u) => acc + u.tokensUsed, 0);
  const totalEstimatedCost = usageLedger.reduce((acc, u) => acc + u.estimatedCostUsd, 0);

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 select-none overflow-hidden"
    >
      {/* 1. PROJECT EXPLORER VIEW */}
      {activeActivityView === 'explorer' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              Explorer · {workspaceName}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNewFileOpen(!newFileOpen)}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Create New File or Folder Path"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Workspace Switcher & AI Application Builder */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <select
              aria-label="Select Workspace Project"
              value={
                workspaceName === 'nexus-runtime-core'
                  ? 'runtime-core'
                  : workspaceName === 'nexus-fullstack-gateway'
                  ? 'fullstack-api'
                  : 'ai-rag-pipeline'
              }
              onChange={(e) =>
                loadWorkspacePreset(
                  e.target.value as 'runtime-core' | 'fullstack-api' | 'ai-rag-pipeline'
                )
              }
              className="w-full rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500"
            >
              <option value="runtime-core">Workspace: nexus-runtime-core</option>
              <option value="fullstack-api">Workspace: nexus-fullstack-gateway</option>
              <option value="ai-rag-pipeline">Workspace: nexus-rag-intelligence</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                onClick={() => scaffoldCompleteApplication('fastapi-auth')}
                className="flex-1 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[10px] font-medium truncate transition-colors"
                title="Scaffold FastAPI + Auth + Docker"
              >
                + FastAPI App
              </button>
              <button
                onClick={() => scaffoldCompleteApplication('express-microservice')}
                className="flex-1 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[10px] font-medium truncate transition-colors"
                title="Scaffold TypeScript Service"
              >
                + TS Service
              </button>
              <button
                onClick={() => scaffoldCompleteApplication('rust-cli')}
                className="flex-1 px-1.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[10px] font-medium truncate transition-colors"
                title="Scaffold Rust Native CLI"
              >
                + Rust CLI
              </button>
            </div>
          </div>

          {/* Inline Create File Input */}
          {newFileOpen && (
            <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-500">
                New Workspace File Path (Persisted to Disk)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 font-mono text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  placeholder="/src/module.ts"
                />
                <button
                  onClick={handleCreateFile}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                >
                  Create
                </button>
              </div>
              {fileError && <p className="text-[11px] text-red-500">{fileError}</p>}
            </div>
          )}

          {/* Directory & File Tree with Drag-and-Drop, Copy/Paste, Rename */}
          <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-1">
            {Array.from(directoryMap.entries()).map(([dir, dirFiles]) => {
              const isCollapsed = Boolean(collapsedDirs[dir]);
              return (
                <div
                  key={dir}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedPath = e.dataTransfer.getData('text/plain');
                    if (draggedPath) {
                      moveFileToDirectory(draggedPath, dir);
                    }
                  }}
                  className="space-y-0.5"
                >
                  <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800/70 transition-colors">
                    <button
                      onClick={() =>
                        setCollapsedDirs((prev) => ({ ...prev, [dir]: !prev[dir] }))
                      }
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 truncate"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      )}
                      {isCollapsed ? (
                        <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      ) : (
                        <FolderOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      )}
                      <span className="font-mono text-[11px] truncate">{dir}</span>
                    </button>

                    {clipboardFilePath && (
                      <button
                        onClick={() => pasteFileFromClipboard(dir)}
                        className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        title={`Paste ${clipboardFilePath} into ${dir}`}
                      >
                        Paste
                      </button>
                    )}
                  </div>

                  {!isCollapsed && (
                    <div className="pl-4 space-y-0.5">
                      {dirFiles.map((file) => {
                        const isSelected = file.path === activeFilePath;
                        const isDirty = file.content !== file.baseContent;
                        const isRenaming = renamingPath === file.path;

                        return (
                          <div
                            key={file.path}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', file.path);
                            }}
                            onClick={() => selectFile(file.path)}
                            className={`group flex items-center justify-between gap-2 px-2 py-1.5 rounded cursor-pointer text-xs transition-colors ${
                              isSelected
                                ? 'bg-blue-600/15 text-blue-600 dark:text-blue-400 font-medium'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {isRenaming ? (
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameConfirm(file.path);
                                  if (e.key === 'Escape') setRenamingPath(null);
                                }}
                                onBlur={() => handleRenameConfirm(file.path)}
                                className="flex-1 rounded border border-blue-500 bg-white dark:bg-slate-950 px-1.5 py-0.5 font-mono text-[11px] text-slate-900 dark:text-white outline-none"
                                autoFocus
                              />
                            ) : (
                              <div className="flex items-center gap-2 min-w-0">
                                <FileCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span className="truncate font-mono text-[12px]">
                                  {file.name}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1 shrink-0">
                              {isDirty && (
                                <span
                                  className="font-mono text-[10px] text-amber-600 dark:text-amber-400"
                                  title="Modified against Git base"
                                >
                                  M
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyFileToClipboard(file.path);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-opacity"
                                title="Copy File"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenamingPath(file.path);
                                  setRenameValue(file.path);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-800 dark:hover:text-white transition-opacity"
                                title="Rename File"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              {files.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFile(file.path);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-opacity"
                                  title={`Delete ${file.name}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active File AST Symbol Outline */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-2.5 bg-slate-100/50 dark:bg-slate-950/50">
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              AST Symbol Outline ({activeSymbols.length})
            </div>
            {activeSymbols.length === 0 ? (
              <p className="text-[11px] text-slate-400">No exported symbols in active buffer.</p>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {activeSymbols.map((sym) => (
                  <button
                    key={`${sym.name}-${sym.line}`}
                    onClick={() => selectFile(sym.filePath, sym.line)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded text-left text-xs hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <Code2 className="w-3 h-3 text-blue-500 shrink-0" />
                      <span className="font-mono text-[11px] truncate">
                        {sym.name}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {sym.kind} · Ln {sym.line}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. CODEBASE RAG, AST SYMBOL INDEX & DEPENDENCY GRAPH VIEW */}
      {activeActivityView === 'search' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Codebase Intelligence (RAG)
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {settings.vectorStoreBackend}
            </span>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Search symbols, functions, or logic..."
                className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 pl-8 pr-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 p-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                {(['hybrid', 'semantic', 'symbol'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRagMode(m)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-colors ${
                      ragMode === m
                        ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-slate-500 tabular-nums">
                {ragResults.length} hits
              </span>
            </div>

            <div className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between tabular-nums">
              <span>
                {codebaseGraph.symbols.length} symbols · {codebaseGraph.dependencies.length} imports
              </span>
              <span>{codebaseGraph.chunkCount} chunks</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {ragResults.map((hit, idx) => (
              <button
                key={`${hit.filePath}-${hit.line}-${idx}`}
                onClick={() => selectFile(hit.filePath, hit.line)}
                className="w-full text-left p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500/60 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-mono truncate">{hit.filePath}</span>
                  <span className="font-mono tabular-nums shrink-0">
                    Ln {hit.line} · {Math.round(hit.score * 100)}%
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate">
                  {hit.snippet}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. GIT SOURCE CONTROL & AI GIT ASSISTANT VIEW */}
      {activeActivityView === 'git' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Source Control · Git
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => stashWorkingTree()}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white"
                title="Stash Working Tree Changes"
              >
                Stash
              </button>
              <button
                onClick={stageAllModified}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Stage All
              </button>
            </div>
          </div>

          {/* Branch, Create Branch & Commit Box */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                aria-label="Active Git Branch"
                value={currentBranch}
                onChange={(e) => switchBranch(e.target.value)}
                className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newBranchName.trim()) {
                    createBranch(newBranchName);
                    setNewBranchName('');
                  }
                }}
                placeholder="New branch name..."
                className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 font-mono text-[11px] outline-none"
              />
              <button
                onClick={() => {
                  if (newBranchName.trim()) {
                    createBranch(newBranchName);
                    setNewBranchName('');
                  }
                }}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
              >
                + Branch
              </button>
            </div>

            <textarea
              rows={2}
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message (e.g. feat: add task timeout support)"
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
            />
            {commitError && <p className="text-[11px] text-red-500">{commitError}</p>}

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCommit}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Commit ({stagedPaths.length || modifiedFiles.length})</span>
              </button>
              <button
                disabled={aiBusy}
                onClick={async () => {
                  await runGitAiAssistant('commit_message');
                  const generated = useIdeStore.getState().gitAiOutput;
                  if (generated) setCommitMessage(generated);
                }}
                className="px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-colors"
                title="AI Git Assistant: Generate Commit Message from Diff"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              </button>
            </div>

            {/* AI Git Assistant Actions */}
            <div className="flex items-center gap-1 pt-1">
              <button
                disabled={aiBusy}
                onClick={() => void runGitAiAssistant('risk_review')}
                className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[10px] font-medium transition-colors"
              >
                AI Diff Risk Audit
              </button>
              <button
                disabled={aiBusy}
                onClick={() => void runGitAiAssistant('pr_description')}
                className="flex-1 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[10px] font-medium transition-colors"
              >
                AI PR Summary
              </button>
            </div>

            {gitAiOutput && (
              <div className="p-2 rounded border border-blue-500/30 bg-blue-500/5 text-[11px] text-slate-700 dark:text-slate-300 max-h-28 overflow-y-auto whitespace-pre-wrap select-text">
                {gitAiOutput}
              </div>
            )}
          </div>

          {/* Working Tree Changes, Stashes & Commit Log */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 tabular-nums">
                Working Tree Changes ({modifiedFiles.length})
              </div>
              {modifiedFiles.length === 0 ? (
                <p className="text-xs text-slate-400">Working tree clean.</p>
              ) : (
                <div className="space-y-1">
                  {modifiedFiles.map((file) => {
                    const isStaged = stagedPaths.includes(file.path);
                    return (
                      <div
                        key={file.path}
                        className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                      >
                        <button
                          onClick={() => {
                            selectFile(file.path);
                            setDiffMode(true);
                          }}
                          className="font-mono text-[11px] truncate text-left hover:text-blue-500"
                          title="Open Git Diff View"
                        >
                          {file.path}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              isStaged ? unstageFile(file.path) : stageFile(file.path)
                            }
                            className="px-1.5 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {isStaged ? 'Unstage' : 'Stage'}
                          </button>
                          <button
                            onClick={() => discardFileChanges(file.path)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-red-500"
                            title="Revert file to base commit"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {stashes.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Git Stashes ({stashes.length})
                </div>
                <div className="space-y-1">
                  {stashes.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between gap-2 p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                    >
                      <span className="flex items-center gap-1.5 truncate text-[11px]">
                        <Archive className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{st.message}</span>
                      </span>
                      <button
                        onClick={() => popStash(st.id)}
                        className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-medium shrink-0"
                      >
                        Pop
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                Recent Commits
              </div>
              <div className="space-y-1.5">
                {commits.map((c) => (
                  <div
                    key={c.hash}
                    className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400">
                        <GitCommit className="w-3 h-3" />
                        {c.hash}
                      </span>
                      <span className="tabular-nums">{c.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                      {c.message}
                    </p>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {c.author} · {c.filesChanged} files
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. AUTONOMOUS MULTI-AGENT ENGINE & CHECKPOINTS VIEW */}
      {activeActivityView === 'agent' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Multi-Agent Graph Engine
            </span>
            <button
              onClick={() => createCheckpoint('Manual Checkpoint')}
              className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              title="Snapshot current workspace files"
            >
              + Checkpoint
            </button>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Multi-File Engineering Objective
            </label>
            <textarea
              rows={3}
              value={agentGoalInput}
              onChange={(e) => setAgentGoalInput(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
            />
            <button
              disabled={aiBusy}
              onClick={() => void createAutonomousPlan(agentGoalInput)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiBusy ? 'Orchestrating 9 Agents...' : 'Generate Multi-Agent Plan'}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
            {agentPlan && (
              <div className="space-y-2">
                {agentPlan.steps.map((step, i) => (
                  <div
                    key={step.id}
                    className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {step.agentPersona}
                      </span>
                      <span className="font-mono text-[10px]">{step.status}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      0{i + 1}. {step.title}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      {step.summary}
                    </p>
                    {step.targetPath && (
                      <div className="font-mono text-[11px] text-blue-500 truncate">
                        Target: {step.targetPath}
                      </div>
                    )}
                    {step.status === 'pending' && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          onClick={() => void executeAgentStep(step.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Accept & Run</span>
                        </button>
                        <button
                          onClick={() => rejectAgentStep(step.id)}
                          className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Checkpoints & Rollback History */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                <span>Workspace Rollback Checkpoints ({checkpoints.length})</span>
              </div>
              {checkpoints.map((chk) => (
                <div
                  key={chk.id}
                  className="flex items-center justify-between gap-2 p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{chk.label}</div>
                    <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {chk.timestamp} · {chk.filesSnapshot.length} files
                    </div>
                  </div>
                  <button
                    onClick={() => rollbackToCheckpoint(chk.id)}
                    className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium shrink-0"
                  >
                    Rollback
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. MODEL CONTEXT PROTOCOL (MCP) ECOSYSTEM & SERVER MANAGER VIEW */}
      {activeActivityView === 'mcp' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              MCP Marketplace & Server Registry
            </span>
          </div>

          {/* Register Custom MCP Server */}
          <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1.5">
            <div className="text-[11px] font-medium text-slate-500">
              Register MCP Server
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newMcpName}
                onChange={(e) => setNewMcpName(e.target.value)}
                placeholder="Server name (e.g. Jira MCP)"
                className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs outline-none"
              />
              <select
                value={newMcpTransport}
                onChange={(e) =>
                  setNewMcpTransport(e.target.value as 'stdio' | 'sse' | 'http')
                }
                className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-1.5 py-1 font-mono text-[11px]"
              >
                <option value="stdio">stdio</option>
                <option value="sse">sse</option>
                <option value="http">http</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={newMcpEndpoint}
                onChange={(e) => setNewMcpEndpoint(e.target.value)}
                placeholder="Endpoint or command"
                className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-2 py-1 font-mono text-[11px] outline-none"
              />
              <button
                onClick={() => {
                  if (newMcpName.trim()) {
                    addCustomMcpServer(newMcpName, newMcpTransport, newMcpEndpoint);
                    setNewMcpName('');
                  }
                }}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
            {mcpServers.map((server) => (
              <div
                key={server.id}
                className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{server.name}</span>
                  </span>
                  <button
                    onClick={() => toggleMcpServerStatus(server.id)}
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                      server.status === 'connected'
                        ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-300 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    {server.transport} · {server.status}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {server.tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <button
                          onClick={() => toggleMcpToolEnabled(server.id, tool.name)}
                          className={`font-mono text-[11px] font-medium truncate ${
                            tool.enabled
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'line-through text-slate-400'
                          }`}
                          title="Click to enable/disable tool"
                        >
                          {tool.name}
                        </button>
                        <button
                          disabled={!tool.enabled || server.status !== 'connected'}
                          onClick={() =>
                            invokeMcpTool(server.id, tool.name, {
                              path: activeFilePath,
                              branch: currentBranch,
                            })
                          }
                          className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-[11px] transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Invoke</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {tool.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ENTERPRISE SECURITY, AI GOVERNANCE & PRIVACY VIEW (Phase 10) */}
      {activeActivityView === 'governance' && (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Security & AI Governance</span>
            </span>
          </div>

          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span>Outbound Secret Redaction</span>
              <input
                type="checkbox"
                checked={settings.secretRedactionEnabled}
                onChange={(e) =>
                  updateSettings({ secretRedactionEnabled: e.target.checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span>Local-Only Privacy Mode (Ollama)</span>
              <input
                type="checkbox"
                checked={settings.localOnlyPrivacyMode}
                onChange={(e) =>
                  updateSettings({ localOnlyPrivacyMode: e.target.checked })
                }
              />
            </div>

            <div className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1 font-mono text-[11px] tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Tokens Used:</span>
                <span>
                  {totalTokensUsed.toLocaleString()} / {settings.tokenBudgetLimit.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Cost:</span>
                <span>${totalEstimatedCost.toFixed(5)} USD</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
              <span>Enterprise Security Audit Trail</span>
              <RefreshCw className="w-3 h-3" />
            </div>
            {auditLogs.map((entry) => (
              <div
                key={entry.id}
                className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 tabular-nums">
                  <span>
                    {entry.category.toUpperCase()} · {entry.outcome.toUpperCase()}
                  </span>
                  <span>{entry.timestamp}</span>
                </div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  {entry.action}
                </div>
                <div className="text-[11px] text-slate-500">{entry.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
