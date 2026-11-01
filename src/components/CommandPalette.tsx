import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Bug,
  Columns2,
  Command,
  FileCode,
  FileText,
  Play,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Terminal,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    files,
    activeFilePath,
    selectFile,
    saveFileToDisk,
    toggleSidebar,
    toggleAiSidebar,
    toggleBottomPanel,
    toggleSplitEditor,
    toggleTheme,
    setInlineEditOpen,
    setSettingsModalOpen,
    setMacInstallerOpen,
    setOnboardingOpen,
    setActiveActivityView,
    runTerminalCommand,
    runAiCodeReview,
    runAiDebugger,
    generateProjectDocumentation,
    generateAndRunTestsWithAi,
    setDiffMode,
    diffMode,
  } = useIdeStore();

  const [query, setQuery] = useState('');

  const actions = [
    {
      id: 'cmd-mac-installer',
      label: 'macOS: Download Nexus-IDE-macOS.dmg & Install to Applications',
      shortcut: 'DMG / .app',
      icon: Command,
      run: () => setMacInstallerOpen(true),
    },
    {
      id: 'cmd-onboarding',
      label: 'Welcome: Open First-Time User Setup & AI Onboarding Wizard',
      shortcut: 'Setup',
      icon: Sparkles,
      run: () => setOnboardingOpen(true),
    },
    {
      id: 'cmd-diagnostics',
      label: 'Diagnostics: View Real-Time Memory, Latency & Token Telemetry',
      shortcut: '1000+ Scale',
      icon: ShieldCheck,
      run: () => toggleBottomPanel('diagnostics'),
    },
    {
      id: 'cmd-save-disk',
      label: 'File: Save Active File to Disk',
      shortcut: 'Ctrl+S',
      icon: FileCode,
      run: () => activeFilePath && void saveFileToDisk(activeFilePath),
    },
    {
      id: 'cmd-inline-ai',
      label: 'AI: Inline Code Transform & Diff Preview',
      shortcut: 'Ctrl+K',
      icon: Sparkles,
      run: () => setInlineEditOpen(true),
    },
    {
      id: 'cmd-ai-debug',
      label: 'AI Debugger: Diagnose & Patch Active File',
      shortcut: 'Alt+B',
      icon: Bug,
      run: () => void runAiDebugger(),
    },
    {
      id: 'cmd-ai-review',
      label: 'AI Code Reviewer: Run Deep Security & Quality Audit',
      shortcut: 'Alt+R',
      icon: ShieldCheck,
      run: () => void runAiCodeReview(),
    },
    {
      id: 'cmd-ai-docs',
      label: 'AI Documentation: Generate Project README.md',
      shortcut: 'Alt+M',
      icon: FileText,
      run: () => void generateProjectDocumentation(),
    },
    {
      id: 'cmd-ai-tests',
      label: 'AI Test Engineer: Generate & Run Vitest Unit Tests',
      shortcut: 'Alt+T',
      icon: Play,
      run: () => void generateAndRunTestsWithAi(),
    },
    {
      id: 'cmd-split-editor',
      label: 'Editor: Toggle Side-by-Side Split Editor',
      shortcut: 'Ctrl+\\',
      icon: Columns2,
      run: () => toggleSplitEditor(),
    },
    {
      id: 'cmd-run-tests',
      label: 'Terminal: Execute Workspace Test Suite (npm test)',
      shortcut: 'Ctrl+Shift+T',
      icon: Terminal,
      run: () => runTerminalCommand('npm test'),
    },
    {
      id: 'cmd-toggle-diff',
      label: diffMode ? 'Git: Exit Diff Comparison View' : 'Git: Compare Active File with HEAD',
      shortcut: 'Alt+D',
      icon: Command,
      run: () => setDiffMode(!diffMode),
    },
    {
      id: 'cmd-governance',
      label: 'Security: Open Enterprise AI Governance & Audit Trail',
      shortcut: 'Ctrl+Shift+S',
      icon: ShieldCheck,
      run: () => setActiveActivityView('governance'),
    },
    {
      id: 'cmd-toggle-theme',
      label: 'View: Switch Color Theme (Dark / Light)',
      shortcut: 'Ctrl+Shift+L',
      icon: SunMoon,
      run: () => toggleTheme(),
    },
    {
      id: 'cmd-toggle-sidebar',
      label: 'View: Toggle Primary Explorer Sidebar',
      shortcut: 'Ctrl+B',
      icon: Command,
      run: () => toggleSidebar(),
    },
    {
      id: 'cmd-toggle-bottom',
      label: 'View: Toggle Integrated Terminal & Bottom Dock',
      shortcut: 'Ctrl+J',
      icon: Terminal,
      run: () => toggleBottomPanel(),
    },
    {
      id: 'cmd-toggle-ai',
      label: 'View: Toggle AI Assistant Sidebar',
      shortcut: 'Ctrl+I',
      icon: Sparkles,
      run: () => toggleAiSidebar(),
    },
    {
      id: 'cmd-settings',
      label: 'Preferences: Open IDE & AI Model Gateway Settings',
      shortcut: 'Ctrl+,',
      icon: Settings,
      run: () => setSettingsModalOpen(true),
    },
    ...files.map((f) => ({
      id: `file-${f.path}`,
      label: `File: Open ${f.path}`,
      shortcut: f.language,
      icon: FileCode,
      run: () => selectFile(f.path),
    })),
  ];

  const filtered = actions.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Dialog.Root open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50" />
        <Dialog.Content className="fixed top-[14%] left-1/2 -translate-x-1/2 w-full max-w-xl rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden outline-none">
          <Dialog.Title className="sr-only">Nexus IDE Command Palette</Dialog.Title>
          <Dialog.Description className="sr-only">
            Search and execute IDE commands or jump to workspace files.
          </Dialog.Description>

          <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or file name to open..."
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white outline-none"
              autoFocus
            />
            <span className="font-mono text-[10px] text-slate-400">ESC</span>
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching commands or files found.
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.run();
                      setCommandPaletteOpen(false);
                      setQuery('');
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-left text-xs text-slate-800 dark:text-slate-200 hover:bg-blue-600 hover:text-white group transition-colors"
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon className="w-3.5 h-3.5 text-slate-400 group-hover:text-white shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 group-hover:text-blue-100 shrink-0">
                      {item.shortcut}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
