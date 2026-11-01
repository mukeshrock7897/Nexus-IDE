import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { Database, Settings, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import type { AiModelRole, AiProviderId } from '../shared/ipc-types';

const PROVIDER_MODELS: Record<AiProviderId, string[]> = {
  gemini: [
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-embedding-2-preview',
  ],
  openai: ['gpt-4o', 'o3-mini', 'text-embedding-3-small'],
  anthropic: ['claude-3-7-sonnet', 'claude-3-5-haiku'],
  mistral: ['codestral-latest', 'mistral-large'],
  groq: ['llama-3.3-70b-versatile', 'qwen-2.5-coder-32b'],
  openrouter: ['openrouter/auto', 'deepseek/deepseek-r1'],
  ollama: ['qwen2.5-coder:14b', 'deepseek-coder-v2:local', 'nomic-embed-text'],
  custom: ['custom-openai-endpoint'],
};

export function SettingsModal() {
  const { settingsModalOpen, setSettingsModalOpen, settings, updateSettings } =
    useIdeStore();

  const roles: Array<{ role: AiModelRole; label: string; desc: string }> = [
    {
      role: 'coding',
      label: 'Code Generation',
      desc: 'Primary model for code synthesis and module generation.',
    },
    {
      role: 'reasoning',
      label: 'Advanced Reasoning',
      desc: 'Deep architectural planning and root-cause analysis.',
    },
    {
      role: 'chat',
      label: 'Contextual Project Chat',
      desc: 'Interactive multi-turn Q&A with workspace context.',
    },
    {
      role: 'inline_edit',
      label: 'Inline Code Transformation (Ctrl+K)',
      desc: 'In-place file transformation with live diff preview.',
    },
    {
      role: 'autocomplete',
      label: 'Low-Latency Ghost Autocomplete',
      desc: 'Fast inline completion model while typing in Monaco.',
    },
    {
      role: 'agent',
      label: 'Autonomous Multi-Agent Orchestrator',
      desc: 'Drives the 9-persona LangGraph-style execution pipeline.',
    },
    {
      role: 'review',
      label: 'AI Code Review & Static Audit',
      desc: 'Security, complexity, and maintainability line diagnostics.',
    },
    {
      role: 'embeddings',
      label: 'Codebase RAG Embeddings',
      desc: 'Vector representation model for hybrid repository retrieval.',
    },
  ];

  return (
    <Dialog.Root open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-50" />
        <Dialog.Content className="fixed top-[6%] left-1/2 -translate-x-1/2 w-full max-w-2xl max-h-[88vh] flex flex-col rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-2xl z-50 overflow-hidden outline-none">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Settings className="w-4 h-4 text-blue-500" />
              <span>Nexus IDE Preferences, AI Gateway & Enterprise Governance</span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close Settings"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Configure editor appearance, vector RAG backends, security policies, and multi-provider AI task routing.
          </Dialog.Description>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
            {/* Section 1: Editor & Appearance */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                01. Editor & Workspace Preferences
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Color Theme
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sync UI shell and Monaco Editor theme
                    </div>
                  </div>
                  <select
                    value={settings.theme}
                    onChange={(e) =>
                      updateSettings({ theme: e.target.value as 'dark' | 'light' })
                    }
                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                  >
                    <option value="dark">Nexus Dark</option>
                    <option value="light">Nexus Daylight</option>
                  </select>
                </div>

                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Font Size (px)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      JetBrains Mono ligature scale
                    </div>
                  </div>
                  <input
                    type="number"
                    min={11}
                    max={20}
                    value={settings.fontSize}
                    onChange={(e) =>
                      updateSettings({ fontSize: Number(e.target.value) || 13 })
                    }
                    className="w-16 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-xs tabular-nums"
                  />
                </div>

                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      AI Ghost Autocomplete
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Low-latency inline suggestions while typing
                    </div>
                  </div>
                  <Switch.Root
                    checked={settings.autocompleteEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings({ autocompleteEnabled: checked })
                    }
                    className="w-9 h-5 rounded-full bg-slate-300 dark:bg-slate-700 data-[state=checked]:bg-blue-600 relative transition-colors"
                  >
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4" />
                  </Switch.Root>
                </div>

                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Code Minimap
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Show high-level code overview rail
                    </div>
                  </div>
                  <Switch.Root
                    checked={settings.minimapEnabled}
                    onCheckedChange={(checked) =>
                      updateSettings({ minimapEnabled: checked })
                    }
                    className="w-9 h-5 rounded-full bg-slate-300 dark:bg-slate-700 data-[state=checked]:bg-blue-600 relative transition-colors"
                  >
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-4" />
                  </Switch.Root>
                </div>
              </div>
            </div>

            {/* Section 2: RAG Vector Store & Enterprise Security */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>02. Security, Privacy & RAG Vector Engine</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      Terminal Approval Gate
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Human-in-the-loop command policy
                    </div>
                  </div>
                  <select
                    value={settings.terminalApprovalPolicy}
                    onChange={(e) =>
                      updateSettings({
                        terminalApprovalPolicy: e.target.value as
                          | 'strict'
                          | 'moderate'
                          | 'permissive',
                      })
                    }
                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                  >
                    <option value="strict">Strict</option>
                    <option value="moderate">Moderate</option>
                    <option value="permissive">Permissive</option>
                  </select>
                </div>

                <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                      <Database className="w-3 h-3 text-blue-500" />
                      <span>Vector Store Adapter</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pluggable RAG retrieval engine
                    </div>
                  </div>
                  <select
                    value={settings.vectorStoreBackend}
                    onChange={(e) =>
                      updateSettings({
                        vectorStoreBackend: e.target.value as
                          | 'local-memory'
                          | 'chromadb'
                          | 'qdrant'
                          | 'faiss',
                      })
                    }
                    className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-xs"
                  >
                    <option value="local-memory">Local Memory</option>
                    <option value="chromadb">ChromaDB</option>
                    <option value="qdrant">Qdrant</option>
                    <option value="faiss">FAISS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Multi-Provider AI Gateway Routing (All 8 Task Roles) */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>03. Multi-Provider AI Task Routing (8 Task Roles)</span>
              </h3>
              <div className="space-y-2">
                {roles.map(({ role, label, desc }) => {
                  const current = settings.aiRoleModels[role];
                  const availableModels = PROVIDER_MODELS[current.providerId] || [
                    'gemini-3.8-flash',
                  ];
                  return (
                    <div
                      key={role}
                      className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {label}
                        </div>
                        <div className="text-[11px] text-slate-500">{desc}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          aria-label={`${label} Provider`}
                          value={current.providerId}
                          onChange={(e) => {
                            const nextProvider = e.target.value as AiProviderId;
                            const defaultModel =
                              PROVIDER_MODELS[nextProvider]?.[0] || 'gemini-3.8-flash';
                            updateSettings({
                              aiRoleModels: {
                                ...settings.aiRoleModels,
                                [role]: { providerId: nextProvider, modelId: defaultModel },
                              },
                            });
                          }}
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                        >
                          <option value="gemini">Google Gemini</option>
                          <option value="ollama">Ollama (Local)</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="openai">OpenAI</option>
                          <option value="groq">Groq</option>
                          <option value="mistral">Mistral</option>
                        </select>
                        <select
                          aria-label={`${label} Model`}
                          value={current.modelId}
                          onChange={(e) =>
                            updateSettings({
                              aiRoleModels: {
                                ...settings.aiRoleModels,
                                [role]: {
                                  ...current,
                                  modelId: e.target.value,
                                },
                              },
                            })
                          }
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 font-mono text-xs"
                        >
                          {availableModels.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
