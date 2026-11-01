import * as Tooltip from '@radix-ui/react-tooltip';
import {
  Bot,
  Cpu,
  Files,
  GitBranch,
  Search,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { useIdeStore, type ActivityViewId } from '../store/useIdeStore';

export function ActivityBar() {
  const {
    activeActivityView,
    sidebarVisible,
    setActiveActivityView,
    setSettingsModalOpen,
    files,
  } = useIdeStore();

  const modifiedCount = files.filter((f) => f.content !== f.baseContent).length;

  const items: Array<{
    id: ActivityViewId;
    label: string;
    shortcut: string;
    icon: typeof Files;
    count?: number;
  }> = [
    { id: 'explorer', label: 'Project Explorer', shortcut: 'Ctrl+Shift+E', icon: Files },
    { id: 'search', label: 'Codebase RAG & AST Index', shortcut: 'Ctrl+Shift+F', icon: Search },
    {
      id: 'git',
      label: 'Source Control & AI Git',
      shortcut: 'Ctrl+Shift+G',
      icon: GitBranch,
      count: modifiedCount > 0 ? modifiedCount : undefined,
    },
    { id: 'agent', label: 'Autonomous Multi-Agent Engine', shortcut: 'Ctrl+Shift+A', icon: Bot },
    { id: 'mcp', label: 'MCP Ecosystem & Tools', shortcut: 'Ctrl+Shift+M', icon: Cpu },
    {
      id: 'governance',
      label: 'Enterprise Security & AI Governance',
      shortcut: 'Ctrl+Shift+S',
      icon: ShieldCheck,
    },
  ];

  return (
    <Tooltip.Provider delayDuration={180}>
      <aside
        aria-label="Activity Bar"
        className="w-12 shrink-0 flex flex-col items-center justify-between py-2 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 select-none"
      >
        <div className="flex flex-col items-center gap-1.5 w-full">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = sidebarVisible && activeActivityView === item.id;
            return (
              <Tooltip.Root key={item.id}>
                <Tooltip.Trigger asChild>
                  <button
                    onClick={() => setActiveActivityView(item.id)}
                    className={`relative w-9 h-9 rounded-md flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900'
                    }`}
                    aria-label={item.label}
                  >
                    <Icon className="w-4 h-4" />
                    {item.count !== undefined && (
                      <span className="absolute -top-0.5 -right-0.5 font-mono text-[10px] font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                        {item.count}
                      </span>
                    )}
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    side="right"
                    sideOffset={8}
                    className="z-50 rounded bg-slate-900 text-white px-2.5 py-1 text-xs shadow-md"
                  >
                    <span>{item.label}</span>
                    <span className="ml-2 font-mono text-[10px] text-slate-400">
                      {item.shortcut}
                    </span>
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-1.5 w-full">
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-900 transition-colors"
                aria-label="IDE Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="right"
                sideOffset={8}
                className="z-50 rounded bg-slate-900 text-white px-2.5 py-1 text-xs shadow-md"
              >
                Settings & AI Model Gateway (Ctrl+,)
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </aside>
    </Tooltip.Provider>
  );
}
