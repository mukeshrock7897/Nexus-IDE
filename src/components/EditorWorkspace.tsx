import { useEffect, useRef, useState } from 'react';
import Editor, { DiffEditor, type OnMount } from '@monaco-editor/react';
import {
  Bug,
  Check,
  Columns2,
  FileCode,
  FlaskConical,
  GitCompare,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import { nexusClient } from '../services/ipcClient';

export function EditorWorkspace() {
  const {
    workspaceName,
    files,
    openTabPaths,
    activeFilePath,
    secondaryFilePath,
    splitEditorOpen,
    toggleSplitEditor,
    setSecondaryFilePath,
    selectFile,
    closeTab,
    updateFileContent,
    setCursorPosition,
    targetJumpLine,
    settings,
    inlineEditOpen,
    setInlineEditOpen,
    inlineEditPreview,
    applyInlineEdit,
    acceptInlinePreview,
    rejectInlinePreview,
    diffMode,
    setDiffMode,
    runAiCodeReview,
    runAiDebugger,
    generateAndRunTestsWithAi,
    aiBusy,
  } = useIdeStore();

  const [inlinePrompt, setInlinePrompt] = useState(
    'Add comprehensive input validation, error handling, and JSDoc comments'
  );
  const [inlineStatus, setInlineStatus] = useState<string | null>(null);
  const [goToLineOpen, setGoToLineOpen] = useState(false);
  const [goToLineInput, setGoToLineInput] = useState('1');
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const inlineProviderDisposableRef = useRef<{ dispose: () => void } | null>(null);

  const activeFile = files.find((f) => f.path === activeFilePath);
  const secondaryFile =
    files.find((f) => f.path === secondaryFilePath) ||
    files.find((f) => f.path !== activeFilePath) ||
    activeFile;

  useEffect(() => {
    if (targetJumpLine && editorRef.current) {
      editorRef.current.revealLineInCenter(targetJumpLine);
      editorRef.current.setPosition({ lineNumber: targetJumpLine, column: 1 });
      editorRef.current.focus();
    }
  }, [targetJumpLine, activeFilePath]);

  useEffect(() => {
    return () => {
      inlineProviderDisposableRef.current?.dispose();
    };
  }, []);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      const model = editor.getModel();
      const selection = editor.getSelection();
      const selectedText =
        model && selection && !selection.isEmpty()
          ? model.getValueInRange(selection)
          : '';
      setCursorPosition(e.position.lineNumber, e.position.column, selectedText);
    });

    editor.onDidChangeCursorSelection((e) => {
      const model = editor.getModel();
      const selectedText =
        model && !e.selection.isEmpty() ? model.getValueInRange(e.selection) : '';
      setCursorPosition(
        e.selection.positionLineNumber,
        e.selection.positionColumn,
        selectedText
      );
    });

    // Register low-latency AI Ghost Autocomplete provider across languages
    inlineProviderDisposableRef.current?.dispose();
    inlineProviderDisposableRef.current =
      monaco.languages.registerInlineCompletionsProvider(
        [
          'typescript',
          'javascript',
          'python',
          'rust',
          'go',
          'java',
          'sql',
          'json',
        ],
        {
          provideInlineCompletions: async (
            model: {
              getLineContent: (lineNumber: number) => string;
              getValue: () => string;
              getOffsetAt: (pos: { lineNumber: number; column: number }) => number;
              getLanguageId: () => string;
            },
            position: { lineNumber: number; column: number },
            _context: unknown,
            token: { isCancellationRequested: boolean }
          ) => {
            const storeState = useIdeStore.getState();
            if (!storeState.settings.autocompleteEnabled) {
              return { items: [] };
            }
            const lineContent = model.getLineContent(position.lineNumber);
            if (lineContent.trim().length < 3) {
              return { items: [] };
            }

            await new Promise((r) => setTimeout(r, 320));
            if (token.isCancellationRequested) {
              return { items: [] };
            }

            const fullText = model.getValue();
            const offset = model.getOffsetAt(position);
            const prefix = fullText.slice(Math.max(0, offset - 800), offset);
            const suffix = fullText.slice(offset, offset + 250);

            try {
              const res = await nexusClient.getAutocompleteSuggestion({
                filePath: storeState.activeFilePath,
                language: model.getLanguageId(),
                prefix,
                suffix,
              });
              if (!res.suggestion.trim()) return { items: [] };
              return {
                items: [
                  {
                    insertText: res.suggestion,
                    range: new monaco.Range(
                      position.lineNumber,
                      position.column,
                      position.lineNumber,
                      position.column
                    ),
                  },
                ],
              };
            } catch {
              return { items: [] };
            }
          },
          freeInlineCompletions: () => undefined,
        }
      );
  };

  const handleInlineTransform = async () => {
    if (!inlinePrompt.trim() || aiBusy) return;
    setInlineStatus(null);
    const res = await applyInlineEdit(inlinePrompt);
    if (!res.ok) {
      setInlineStatus(res.error || 'Transformation failed');
    } else {
      setInlineStatus(res.explanation || 'Preview ready — review diff below.');
    }
  };

  const handleGoToLine = () => {
    const lineNum = Math.max(1, parseInt(goToLineInput, 10) || 1);
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNum);
      editorRef.current.setPosition({ lineNumber: lineNum, column: 1 });
      editorRef.current.focus();
    }
    setGoToLineOpen(false);
  };

  if (!activeFile) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 p-8 select-none">
        <div className="max-w-md text-center space-y-3">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No Active File Open
          </h2>
          <p className="text-xs leading-relaxed">
            Select a file from the Project Explorer on the left or press{' '}
            <kbd className="font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
              Ctrl+Shift+P
            </kbd>{' '}
            to launch the Command Palette.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 overflow-hidden">
      {/* Open Editor Tabs Bar */}
      <div className="h-9 shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/90 px-1 select-none overflow-x-auto">
        <div className="flex items-center gap-0.5 min-w-0 overflow-x-auto">
          {openTabPaths.map((tabPath) => {
            const tabFile = files.find((f) => f.path === tabPath);
            if (!tabFile) return null;
            const isActive = tabPath === activeFilePath;
            const isModified = tabFile.content !== tabFile.baseContent;
            return (
              <div
                key={tabPath}
                onClick={() => selectFile(tabPath)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t text-xs cursor-pointer border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-950 border-blue-600 text-slate-900 dark:text-white font-medium'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-mono text-[12px]">{tabFile.name}</span>
                {isModified && (
                  <span
                    className="font-mono text-[10px] text-amber-600 dark:text-amber-400"
                    title="Uncommitted changes"
                  >
                    M
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tabPath);
                  }}
                  className="p-0.5 rounded opacity-60 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-opacity"
                  aria-label={`Close ${tabFile.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Editor Contextual Actions */}
        <div className="flex items-center gap-1 px-2 shrink-0">
          <button
            onClick={() => setInlineEditOpen(!inlineEditOpen)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              inlineEditOpen
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Inline AI Code Edit (Ctrl+K)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit (Ctrl+K)</span>
          </button>

          <button
            onClick={toggleSplitEditor}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              splitEditorOpen
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Split Editor Side-by-Side (Ctrl+\)"
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span>Split</span>
          </button>

          <button
            onClick={() => setDiffMode(!diffMode)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              diffMode
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="Toggle Git Diff Comparison"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Diff</span>
          </button>

          <button
            disabled={aiBusy}
            onClick={() => void runAiDebugger()}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            title="AI Debugger: Diagnose & Patch Active File"
          >
            <Bug className="w-3.5 h-3.5 text-amber-500" />
            <span>Debug</span>
          </button>

          <button
            disabled={aiBusy}
            onClick={() => void runAiCodeReview()}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            title="Run AI Code Review on Active File"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Review</span>
          </button>

          <button
            disabled={aiBusy}
            onClick={() => void generateAndRunTestsWithAi()}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            title="Generate Vitest Suite with AI"
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-500" />
            <span>Gen Tests</span>
          </button>
        </div>
      </div>

      {/* Breadcrumb Bar + Go To Line */}
      <div className="h-7 shrink-0 flex items-center justify-between px-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-[11px] text-slate-500 dark:text-slate-400 select-none">
        <div className="flex items-center gap-1.5 font-mono truncate">
          <span>{workspaceName}</span>
          <span>/</span>
          <span className="text-slate-800 dark:text-slate-200">
            {activeFile.path.replace(/^\//, '')}
          </span>
          <span>·</span>
          <span>{activeFile.language}</span>
        </div>

        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
          {goToLineOpen ? (
            <div className="flex items-center gap-1">
              <span>Go to Ln:</span>
              <input
                type="number"
                min={1}
                value={goToLineInput}
                onChange={(e) => setGoToLineInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGoToLine()}
                className="w-14 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 text-[11px]"
                autoFocus
              />
              <button
                onClick={handleGoToLine}
                className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[10px]"
              >
                Go
              </button>
            </div>
          ) : (
            <button
              onClick={() => setGoToLineOpen(true)}
              className="hover:text-slate-900 dark:hover:text-white"
              title="Go to Line (Ctrl+G)"
            >
              Go to Line
            </button>
          )}
          <span>·</span>
          <span>
            {diffMode
              ? 'Comparing Working Tree vs Git HEAD'
              : `${activeFile.content.split('\n').length} lines`}
          </span>
        </div>
      </div>

      {/* Inline AI Code Transform Bar (Ctrl+K) + Accept/Reject Preview Banner */}
      {(inlineEditOpen || inlineEditPreview) && (
        <div className="shrink-0 p-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <input
              type="text"
              value={inlinePrompt}
              onChange={(e) => setInlinePrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleInlineTransform()}
              placeholder="Describe how Nexus AI should transform this file..."
              className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              disabled={aiBusy}
              onClick={() => void handleInlineTransform()}
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
            >
              {aiBusy ? 'Synthesizing Diff...' : 'Preview Transform'}
            </button>
            <button
              onClick={() => {
                rejectInlinePreview();
                setInlineEditOpen(false);
              }}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
              aria-label="Close Inline Edit"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {inlineEditPreview && (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded border border-blue-500/40 bg-blue-500/10 text-xs">
              <span className="text-slate-800 dark:text-slate-200 truncate">
                <strong>Proposed Change:</strong> {inlineEditPreview.explanation}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={acceptInlinePreview}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept Changes</span>
                </button>
                <button
                  onClick={rejectInlinePreview}
                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {inlineStatus && !inlineEditPreview && (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
              {inlineStatus}
            </div>
          )}
        </div>
      )}

      {/* Monaco Editor / DiffEditor / Split Editor Viewport */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Primary Editor Pane */}
        <div className="flex-1 min-w-0 h-full relative">
          {inlineEditPreview && inlineEditPreview.filePath === activeFile.path ? (
            <DiffEditor
              height="100%"
              language={activeFile.language}
              original={activeFile.content}
              modified={inlineEditPreview.proposedContent}
              theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: settings.fontSize,
                fontFamily: "'JetBrains Mono', monospace",
                renderSideBySide: true,
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          ) : diffMode ? (
            <DiffEditor
              height="100%"
              language={activeFile.language}
              original={activeFile.baseContent}
              modified={activeFile.content}
              theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
              options={{
                fontSize: settings.fontSize,
                fontFamily: "'JetBrains Mono', monospace",
                renderSideBySide: true,
                readOnly: false,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
              }}
            />
          ) : (
            <Editor
              height="100%"
              path={activeFile.path}
              language={activeFile.language}
              value={activeFile.content}
              theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
              onMount={handleEditorMount}
              onChange={(val) => updateFileContent(activeFile.path, val ?? '')}
              options={{
                fontSize: settings.fontSize,
                tabSize: settings.tabSize,
                wordWrap: settings.wordWrap,
                lineNumbers: settings.lineNumbers,
                minimap: { enabled: settings.minimapEnabled },
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                bracketPairColorization: { enabled: true },
                folding: true,
                multiCursorModifier: 'alt',
                inlineSuggest: { enabled: settings.autocompleteEnabled },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
              }}
            />
          )}
        </div>

        {/* Secondary Split Editor Pane */}
        {splitEditorOpen && secondaryFile && (
          <div className="flex-1 min-w-0 h-full border-l border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="h-7 shrink-0 px-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-xs">
              <select
                aria-label="Secondary Split Editor File"
                value={secondaryFile.path}
                onChange={(e) => setSecondaryFilePath(e.target.value)}
                className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-0.5 font-mono text-[11px]"
              >
                {files.map((f) => (
                  <option key={f.path} value={f.path}>
                    Split Pane: {f.path}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleSplitEditor}
                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                title="Close Split Editor"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                path={`split-${secondaryFile.path}`}
                language={secondaryFile.language}
                value={secondaryFile.content}
                theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
                onChange={(val) => updateFileContent(secondaryFile.path, val ?? '')}
                options={{
                  fontSize: settings.fontSize,
                  tabSize: settings.tabSize,
                  wordWrap: settings.wordWrap,
                  minimap: { enabled: false },
                  fontFamily: "'JetBrains Mono', monospace",
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                }}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
