import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  GitBranch,
  Sparkles,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import { detectCurrentMacSystem, type DetectedMacSystem } from '../utils/macSystemDetector';

export function StatusBar() {
  const {
    currentBranch,
    problems,
    cursorPosition,
    files,
    activeFilePath,
    settings,
    setActiveActivityView,
    setActiveBottomTab,
    setMacInstallerOpen,
    toggleAiSidebar,
    activeAiRole,
  } = useIdeStore();

  const [detectedMac, setDetectedMac] = useState<DetectedMacSystem | null>(null);

  useEffect(() => {
    void detectCurrentMacSystem().then(setDetectedMac);
  }, []);

  const activeFile = files.find((f) => f.path === activeFilePath);
  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;
  const roleModel = settings.aiRoleModels[activeAiRole];

  return (
    <footer className="h-6 shrink-0 flex items-center justify-between px-3 border-t border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-[11px] text-slate-600 dark:text-slate-400 select-none">
      {/* Left Zone: Git Branch, Diagnostics & Detected Mac Hardware */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveActivityView('git')}
          className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          title="Switch or Inspect Git Branch"
        >
          <GitBranch className="w-3 h-3 text-blue-500" />
          <span className="font-mono">{currentBranch}</span>
        </button>

        <button
          onClick={() => setActiveBottomTab('problems')}
          className="flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors tabular-nums"
          title="View Workspace Diagnostics"
        >
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="font-mono">
            {errorCount} errors · {warningCount} warnings
          </span>
        </button>

        {detectedMac && (
          <button
            onClick={() => setMacInstallerOpen(true)}
            className="hidden md:flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-mono"
            title={`Auto-Detected System: ${detectedMac.osName} · ${detectedMac.cpuModel} (${detectedMac.gpuRenderer})`}
          >
            <Cpu className="w-3 h-3" />
            <span>
              System: {detectedMac.archLabel} ({detectedMac.cpuCores} cores)
            </span>
          </button>
        )}
      </div>

      {/* Right Zone: Editor Telemetry & AI Model Role */}
      <div className="flex items-center gap-4 font-mono tabular-nums">
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="hidden sm:inline">Spaces: {settings.tabSize}</span>
        <span className="hidden sm:inline">UTF-8</span>
        {activeFile && (
          <span className="text-slate-800 dark:text-slate-200">
            {activeFile.language}
          </span>
        )}
        <button
          onClick={toggleAiSidebar}
          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-sans"
          title="Configure or Open Nexus AI Assistant"
        >
          <Sparkles className="w-3 h-3" />
          <span className="font-mono">
            {roleModel.providerId}:{roleModel.modelId}
          </span>
        </button>
      </div>
    </footer>
  );
}
