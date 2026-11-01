import { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Activity,
  Bug,
  Columns2,
  Command,
  Download,
  FileText,
  Moon,
  PanelBottom,
  PanelLeft,
  PanelRight,
  Play,
  Search,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import { detectCurrentMacSystem, type DetectedMacSystem } from '../utils/macSystemDetector';

export function TitleBar() {
  const [detectedMac, setDetectedMac] = useState<DetectedMacSystem | null>(null);

  useEffect(() => {
    void detectCurrentMacSystem().then(setDetectedMac);
  }, []);
  const {
    workspaceName,
    activeFilePath,
    sidebarVisible,
    aiSidebarVisible,
    bottomPanelVisible,
    splitEditorOpen,
    settings,
    toggleSidebar,
    toggleAiSidebar,
    toggleBottomPanel,
    toggleSplitEditor,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    setMacInstallerOpen,
    setOnboardingOpen,
    setInlineEditOpen,
    setDiffMode,
    diffMode,
    toggleTheme,
    runTerminalCommand,
    runAiCodeReview,
    runAiDebugger,
    generateProjectDocumentation,
    scaffoldCompleteApplication,
    generateAndRunTestsWithAi,
    loadWorkspacePreset,
    saveFileToDisk,
  } = useIdeStore();

  const menuContentClass =
    'min-w-[240px] rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg z-50 text-xs text-slate-800 dark:text-slate-200';
  const menuItemClass =
    'flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer outline-none hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors';

  return (
    <header className="h-10 shrink-0 flex items-center justify-between gap-4 px-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 select-none">
      {/* Zone 1: Brand & Top Menu Bar */}
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          Nexus IDE
        </span>

        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
          {/* FILE MENU */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0">
                File
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={4} className={menuContentClass}>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => activeFilePath && void saveFileToDisk(activeFilePath)}
                >
                  <span>Save Active File to Disk</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+S</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setCommandPaletteOpen(true)}
                >
                  <span>Open Command Palette...</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+Shift+P</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => loadWorkspacePreset('runtime-core')}
                >
                  <span>Workspace: Runtime Core</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => loadWorkspacePreset('fullstack-api')}
                >
                  <span>Workspace: Full-Stack Gateway</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => loadWorkspacePreset('ai-rag-pipeline')}
                >
                  <span>Workspace: RAG Intelligence</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => scaffoldCompleteApplication('fastapi-auth')}
                >
                  <span>AI App Builder: FastAPI + Auth + Docker</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => scaffoldCompleteApplication('express-microservice')}
                >
                  <span>AI App Builder: TypeScript Microservice</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => scaffoldCompleteApplication('rust-cli')}
                >
                  <span>AI App Builder: Rust Native CLI</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setMacInstallerOpen(true)}
                >
                  <span>Download macOS Installer (.dmg / .app)</span>
                  <span className="font-mono text-[11px] text-emerald-500">macOS</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setOnboardingOpen(true)}
                >
                  <span>First-Time Setup & Onboarding Wizard...</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setSettingsModalOpen(true)}
                >
                  <span>Preferences & AI Gateway Settings</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+,</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* EDIT MENU */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0">
                Edit
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={4} className={menuContentClass}>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setInlineEditOpen(true)}
                >
                  <span>Inline AI Code Transform & Preview</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+K</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => toggleSplitEditor()}
                >
                  <span>{splitEditorOpen ? 'Close Split Editor' : 'Split Editor Side-by-Side'}</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+\</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => setDiffMode(!diffMode)}
                >
                  <span>{diffMode ? 'Exit Git Diff Comparison' : 'Compare File with Git Base'}</span>
                  <span className="font-mono text-[11px] text-slate-400">Alt+D</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* VIEW MENU */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0">
                View
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={4} className={menuContentClass}>
                <DropdownMenu.Item className={menuItemClass} onSelect={() => toggleSidebar()}>
                  <span>Toggle Primary Sidebar</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+B</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItemClass} onSelect={() => toggleBottomPanel()}>
                  <span>Toggle Terminal & Bottom Dock</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+J</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item className={menuItemClass} onSelect={() => toggleAiSidebar()}>
                  <span>Toggle AI Assistant Sidebar</span>
                  <span className="font-mono text-[11px] text-slate-400">Ctrl+I</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <DropdownMenu.Item className={menuItemClass} onSelect={() => toggleTheme()}>
                  <span>Switch Theme ({settings.theme === 'dark' ? 'Light' : 'Dark'})</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          {/* RUN & AI ENGINEERING MENU */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="px-2 py-1 rounded hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0">
                Engineering & AI
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content align="start" sideOffset={4} className={menuContentClass}>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => runTerminalCommand('npm test')}
                >
                  <span>Run Workspace Test Suite</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => runTerminalCommand('npm run lint')}
                >
                  <span>Run Static Type & Lint Check</span>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => void runAiDebugger()}
                >
                  <span>AI Debugger: Diagnose & Patch Active File</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => void runAiCodeReview()}
                >
                  <span>AI Code Reviewer: Security & Quality Audit</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => void generateAndRunTestsWithAi()}
                >
                  <span>AI Test Engineer: Generate Vitest Suite</span>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className={menuItemClass}
                  onSelect={() => void generateProjectDocumentation()}
                >
                  <span>AI Documentation: Generate README.md</span>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>
      </div>

      {/* Zone 2: Command Palette & Breadcrumb Search Bar */}
      <div className="flex items-center gap-2 flex-1 max-w-xl justify-center">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full max-w-md flex items-center justify-between gap-3 px-3 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          title="Open Command Palette (Ctrl+Shift+P)"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate font-mono text-[11px]">
              {workspaceName} · {activeFilePath || 'No file selected'}
            </span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 shrink-0">
            <Command className="w-3 h-3" />
            <span>K / Ctrl+Shift+P</span>
          </span>
        </button>
      </div>

      {/* Zone 3: Workspace Controls & Theme Switch */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setMacInstallerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors whitespace-nowrap shrink-0"
          title={
            detectedMac
              ? `Auto-Detected ${detectedMac.archLabel} (${detectedMac.cpuModel}) — Click to Download ${detectedMac.recommendedDmg}`
              : 'Download Nexus-IDE-macOS.dmg & Install to Applications'
          }
        >
          <Download className="w-3.5 h-3.5" />
          <span>macOS .dmg ({detectedMac?.arch || 'arm64'})</span>
        </button>

        <button
          onClick={() => toggleBottomPanel('diagnostics')}
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          title="Open Real-Time Production Diagnostics & Token Telemetry"
        >
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>Diagnostics</span>
        </button>

        <button
          onClick={() => runTerminalCommand('npm test')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors whitespace-nowrap shrink-0"
          title="Execute Workspace Tests"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Run Tests</span>
        </button>

        <button
          onClick={() => void runAiDebugger()}
          className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          title="AI Debugger: Diagnose & Patch Active File"
        >
          <Bug className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Debug</span>
        </button>

        <button
          onClick={() => void generateProjectDocumentation()}
          className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          title="Generate Project README.md with AI"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-500" />
          <span>Gen Docs</span>
        </button>

        <button
          onClick={() => setInlineEditOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          title="Inline AI Code Edit (Ctrl+K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Inline AI</span>
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

        <button
          onClick={toggleSplitEditor}
          className={`p-1.5 rounded transition-colors ${
            splitEditorOpen
              ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Toggle Split Editor (Ctrl+\)"
          aria-label="Toggle Split Editor"
        >
          <Columns2 className="w-4 h-4" />
        </button>

        <button
          onClick={toggleSidebar}
          className={`p-1.5 rounded transition-colors ${
            sidebarVisible
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Toggle Explorer Sidebar (Ctrl+B)"
          aria-label="Toggle Explorer Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => toggleBottomPanel()}
          className={`p-1.5 rounded transition-colors ${
            bottomPanelVisible
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Toggle Bottom Panel (Ctrl+J)"
          aria-label="Toggle Bottom Panel"
        >
          <PanelBottom className="w-4 h-4" />
        </button>

        <button
          onClick={toggleAiSidebar}
          className={`p-1.5 rounded transition-colors ${
            aiSidebarVisible
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
          title="Toggle AI Assistant Sidebar (Ctrl+I)"
          aria-label="Toggle AI Assistant Sidebar"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          aria-label="Toggle Theme"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={() => setSettingsModalOpen(true)}
          className="p-1.5 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
          title="IDE Settings & Model Configuration (Ctrl+,)"
          aria-label="Open Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
