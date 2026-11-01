/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { TitleBar } from './components/TitleBar';
import { ActivityBar } from './components/ActivityBar';
import { Sidebar } from './components/Sidebar';
import { EditorWorkspace } from './components/EditorWorkspace';
import { AiSidebar } from './components/AiSidebar';
import { BottomPanel } from './components/BottomPanel';
import { StatusBar } from './components/StatusBar';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { MacInstallerModal } from './components/MacInstallerModal';
import { OnboardingModal } from './components/OnboardingModal';
import { applyDocumentTheme, useIdeStore } from './store/useIdeStore';

export default function App() {
  const {
    settings,
    activeFilePath,
    sidebarVisible,
    aiSidebarVisible,
    bottomPanelVisible,
    setSidebarWidth,
    setAiSidebarWidth,
    setBottomPanelHeight,
    toggleSidebar,
    toggleAiSidebar,
    toggleBottomPanel,
    toggleSplitEditor,
    setCommandPaletteOpen,
    setSettingsModalOpen,
    setInlineEditOpen,
    inlineEditOpen,
    diffMode,
    setDiffMode,
    syncWorkspaceFromDisk,
    saveFileToDisk,
  } = useIdeStore();

  const dragModeRef = useRef<'left' | 'right' | 'bottom' | null>(null);

  useEffect(() => {
    void syncWorkspaceFromDisk();
  }, [syncWorkspaceFromDisk]);

  useEffect(() => {
    applyDocumentTheme(settings.theme);
  }, [settings.theme]);

  // Global IDE Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeFilePath) {
          void saveFileToDisk(activeFilePath);
        }
        return;
      }
      if (mod && e.key === '\\') {
        e.preventDefault();
        toggleSplitEditor();
        return;
      }
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setInlineEditOpen(!inlineEditOpen);
        return;
      }
      if (mod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggleBottomPanel();
        return;
      }
      if (mod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        toggleAiSidebar();
        return;
      }
      if (mod && e.key === ',') {
        e.preventDefault();
        setSettingsModalOpen(true);
        return;
      }
      if (e.altKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setDiffMode(!diffMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeFilePath,
    diffMode,
    inlineEditOpen,
    saveFileToDisk,
    setCommandPaletteOpen,
    setDiffMode,
    setInlineEditOpen,
    setSettingsModalOpen,
    toggleAiSidebar,
    toggleBottomPanel,
    toggleSidebar,
    toggleSplitEditor,
  ]);

  // Interactive Panel Drag Resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragModeRef.current) return;
      if (dragModeRef.current === 'left') {
        setSidebarWidth(e.clientX - 48);
      } else if (dragModeRef.current === 'right') {
        setAiSidebarWidth(window.innerWidth - e.clientX);
      } else if (dragModeRef.current === 'bottom') {
        setBottomPanelHeight(window.innerHeight - e.clientY - 24);
      }
    };

    const handleMouseUp = () => {
      dragModeRef.current = null;
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setAiSidebarWidth, setBottomPanelHeight, setSidebarWidth]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Menu & Command Bar */}
      <TitleBar />

      {/* Central Workspace Row */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Leftmost Activity Bar */}
        <ActivityBar />

        {/* Left Explorer / Search / Git / Agent / MCP / Governance Sidebar */}
        <Sidebar />

        {/* Left Sidebar Resize Handle */}
        {sidebarVisible && (
          <div
            onMouseDown={() => {
              dragModeRef.current = 'left';
              document.body.style.cursor = 'col-resize';
            }}
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/60 transition-colors"
            title="Drag to resize sidebar"
          />
        )}

        {/* Center Editor + Bottom Panel Stack */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <EditorWorkspace />

          {/* Bottom Panel Resize Handle */}
          {bottomPanelVisible && (
            <div
              onMouseDown={() => {
                dragModeRef.current = 'bottom';
                document.body.style.cursor = 'row-resize';
              }}
              className="h-1 shrink-0 cursor-row-resize bg-transparent hover:bg-blue-500/60 transition-colors"
              title="Drag to resize bottom panel"
            />
          )}

          <BottomPanel />
        </div>

        {/* Right AI Sidebar Resize Handle */}
        {aiSidebarVisible && (
          <div
            onMouseDown={() => {
              dragModeRef.current = 'right';
              document.body.style.cursor = 'col-resize';
            }}
            className="w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/60 transition-colors"
            title="Drag to resize AI Assistant panel"
          />
        )}

        {/* Right AI Assistant Sidebar */}
        <AiSidebar />
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Modals & Overlays */}
      <CommandPalette />
      <SettingsModal />
      <MacInstallerModal />
      <OnboardingModal />
    </div>
  );
}
