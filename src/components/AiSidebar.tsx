import { useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  FilePlus,
  History,
  Play,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import type { AiModelRole, ContextAttachmentType } from '../shared/ipc-types';

export function AiSidebar() {
  const {
    aiSidebarVisible,
    aiSidebarWidth,
    aiTab,
    setAiTab,
    activeAiRole,
    setActiveAiRole,
    chatThreads,
    activeThreadId,
    createChatThread,
    switchChatThread,
    deleteChatThread,
    attachedContexts,
    toggleContextAttachment,
    sendChatPrompt,
    stopAiGeneration,
    retryLastChatPrompt,
    aiBusy,
    activeFilePath,
    updateFileContent,
    createFile,
    agentPlan,
    checkpoints,
    rollbackToCheckpoint,
    createAutonomousPlan,
    executeAgentStep,
    rejectAgentStep,
    runAiCodeReview,
    runAiDebugger,
    generateProjectDocumentation,
    problems,
    selectFile,
    providers,
    usageLedger,
    settings,
  } = useIdeStore();

  const [promptInput, setPromptInput] = useState('');
  const [agentObjective, setAgentObjective] = useState(
    'Implement a priority queue drain() method in engine.ts and verify with tests'
  );
  const [appliedBlockId, setAppliedBlockId] = useState<string | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  if (!aiSidebarVisible) return null;

  const activeRoleConfig = settings.aiRoleModels[activeAiRole];
  const currentThread =
    chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];

  const contextOptions: Array<{ id: ContextAttachmentType; label: string }> = [
    { id: 'active_file', label: '@file' },
    { id: 'selection', label: '@selection' },
    { id: 'workspace', label: '@workspace' },
    { id: 'git_diff', label: '@git-diff' },
    { id: 'terminal', label: '@terminal' },
    { id: 'problems', label: '@problems' },
  ];

  const handleSend = async () => {
    if (!promptInput.trim() || aiBusy) return;
    const text = promptInput;
    setPromptInput('');
    await sendChatPrompt(text);
  };

  return (
    <aside
      style={{ width: `${aiSidebarWidth}px` }}
      className="shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 select-none overflow-hidden"
    >
      {/* Header & Mode Switcher */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
          Nexus AI
        </span>

        <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800">
          {(['chat', 'agent', 'review', 'gateway'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setAiTab(t)}
              className={`px-2 py-1 rounded text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                aiTab === t
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Role & Model Routing Bar */}
      <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-[11px] bg-white/60 dark:bg-slate-950/60">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Task:</span>
          <select
            aria-label="Select AI Task Role"
            value={activeAiRole}
            onChange={(e) => setActiveAiRole(e.target.value as AiModelRole)}
            className="rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 py-0.5 font-medium text-slate-800 dark:text-slate-200 outline-none"
          >
            <option value="coding">Code Gen</option>
            <option value="reasoning">Reasoning</option>
            <option value="chat">Chat</option>
            <option value="inline_edit">Inline Edit</option>
            <option value="autocomplete">Autocomplete</option>
            <option value="agent">Agent</option>
            <option value="review">Code Review</option>
          </select>
        </div>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {activeRoleConfig.providerId}:{activeRoleConfig.modelId}
        </span>
      </div>

      {/* 1. CONTEXTUAL AI CHAT TAB */}
      {aiTab === 'chat' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Multi-Session Conversation Thread Selector */}
          <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1.5 bg-slate-100/50 dark:bg-slate-950/40">
            <select
              aria-label="Active Chat Session"
              value={currentThread.id}
              onChange={(e) => switchChatThread(e.target.value)}
              className="flex-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-0.5 text-xs outline-none truncate"
            >
              {chatThreads.map((th) => (
                <option key={th.id} value={th.id}>
                  {th.title} ({th.messages.length} msgs)
                </option>
              ))}
            </select>
            <button
              onClick={createChatThread}
              className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="New Chat Session"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            {chatThreads.length > 1 && (
              <button
                onClick={() => deleteChatThread(currentThread.id)}
                className="p-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:text-red-500"
                title="Delete Chat Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Coding Action Prompts */}
          <div className="px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto">
            <button
              disabled={aiBusy}
              onClick={() =>
                void sendChatPrompt(
                  `Explain the architecture and key methods of ${activeFilePath} concisely.`
                )
              }
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[11px] whitespace-nowrap shrink-0"
            >
              Explain
            </button>
            <button
              disabled={aiBusy}
              onClick={() =>
                void sendChatPrompt(
                  `Refactor ${activeFilePath} for cleaner modularity, strict types, and error handling.`
                )
              }
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[11px] whitespace-nowrap shrink-0"
            >
              Refactor
            </button>
            <button
              disabled={aiBusy}
              onClick={() =>
                void sendChatPrompt(
                  `Optimize time and memory complexity in ${activeFilePath}.`
                )
              }
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[11px] whitespace-nowrap shrink-0"
            >
              Optimize
            </button>
            <button
              disabled={aiBusy}
              onClick={() =>
                void sendChatPrompt(
                  `Convert ${activeFilePath} to idiomatic Rust and explain the ownership mapping.`
                )
              }
              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 text-[11px] whitespace-nowrap shrink-0"
            >
              Convert Language
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text">
            {currentThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2.5 rounded-md border text-xs space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-600/10 border-blue-500/30 text-slate-900 dark:text-slate-100'
                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {msg.role === 'user' ? 'Developer' : 'Nexus AI'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {msg.modelUsed ? `${msg.modelUsed} · ` : ''}
                    {msg.latencyMs ? `${msg.latencyMs}ms · ` : ''}
                    {msg.tokensUsed ? `${msg.tokensUsed} tok` : msg.timestamp}
                  </span>
                </div>

                {msg.contextSources && msg.contextSources.length > 0 && (
                  <div className="font-mono text-[10px] text-slate-400">
                    Context: {msg.contextSources.join(' · ')}
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed text-xs">
                  {msg.content}
                </div>

                {/* Actionable Code Blocks */}
                {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {msg.codeBlocks.map((block, idx) => {
                      const blockKey = `${msg.id}-block-${idx}`;
                      const isApplied = appliedBlockId === blockKey;
                      const isCopied = copiedBlockId === blockKey;
                      return (
                        <div
                          key={blockKey}
                          className="rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-2 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-500">
                              {block.language} ({block.code.split('\n').length} lines)
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  void navigator.clipboard?.writeText(block.code);
                                  setCopiedBlockId(blockKey);
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px]"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (activeFilePath) {
                                    updateFileContent(activeFilePath, block.code);
                                    setAppliedBlockId(blockKey);
                                  }
                                }}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium transition-colors"
                              >
                                {isApplied ? (
                                  <>
                                    <Check className="w-3 h-3" />
                                    <span>Applied</span>
                                  </>
                                ) : (
                                  <>
                                    <Code2 className="w-3 h-3" />
                                    <span>Apply</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const ext =
                                    block.language === 'python'
                                      ? 'py'
                                      : block.language === 'rust'
                                      ? 'rs'
                                      : 'ts';
                                  createFile(
                                    `/src/generated_${Date.now().toString().slice(-4)}.${ext}`,
                                    block.code
                                  );
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-[10px] transition-colors"
                              >
                                <FilePlus className="w-3 h-3" />
                                <span>New File</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Context Selection Chips + Prompt Composer Box */}
          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
            {/* Attached Context Sources */}
            <div className="flex items-center gap-1 flex-wrap">
              {contextOptions.map((opt) => {
                const active = attachedContexts.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleContextAttachment(opt.id)}
                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] border transition-colors ${
                      active
                        ? 'border-blue-500 bg-blue-600/10 text-blue-600 dark:text-blue-400 font-medium'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-end gap-1.5">
              <textarea
                rows={2}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Ask Nexus AI about your project or request code..."
                className="flex-1 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
              />
              {aiBusy ? (
                <button
                  onClick={stopAiGeneration}
                  className="p-2 rounded bg-red-600 hover:bg-red-500 text-white transition-colors"
                  title="Stop Generation"
                  aria-label="Stop Generation"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <div className="flex flex-col gap-1">
                  <button
                    disabled={!promptInput.trim()}
                    onClick={() => void handleSend()}
                    className="p-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
                    aria-label="Send Prompt"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void retryLastChatPrompt()}
                    className="p-1.5 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                    title="Retry Last Response"
                    aria-label="Retry Last Response"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. AUTONOMOUS MULTI-AGENT ENGINE TAB */}
      {aiTab === 'agent' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3 overflow-y-auto">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
              Autonomous Multi-Agent Workflow (9 Specialized Personas)
            </label>
            <textarea
              rows={3}
              value={agentObjective}
              onChange={(e) => setAgentObjective(e.target.value)}
              className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500 resize-none"
            />
            <button
              disabled={aiBusy}
              onClick={() => void createAutonomousPlan(agentObjective)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>{aiBusy ? 'Orchestrating Agents...' : 'Launch Multi-Agent Workflow'}</span>
            </button>
          </div>

          {agentPlan && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Execution Timeline ({agentPlan.steps.length} steps)</span>
                <button
                  onClick={() => rollbackToCheckpoint(agentPlan.checkpointId)}
                  className="text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Rollback Plan
                </button>
              </div>
              {agentPlan.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {step.agentPersona}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {step.status}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    0{index + 1}. {step.title}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    {step.summary}
                  </p>
                  {step.targetPath && (
                    <div className="font-mono text-[11px] text-blue-500">
                      File: {step.targetPath}
                    </div>
                  )}
                  {step.command && (
                    <div className="font-mono text-[11px] text-amber-500">
                      Command: $ {step.command}
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={() => void executeAgentStep(step.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        <span>Accept & Run</span>
                      </button>
                      <button
                        onClick={() => rejectAgentStep(step.id)}
                        className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Checkpoints List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              <span>Saved Checkpoints ({checkpoints.length})</span>
            </div>
            {checkpoints.map((chk) => (
              <div
                key={chk.id}
                className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs"
              >
                <span className="truncate">{chk.label}</span>
                <button
                  onClick={() => rollbackToCheckpoint(chk.id)}
                  className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px]"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AI CODE REVIEW, DEBUGGER & DOCS TAB */}
      {aiTab === 'review' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3 overflow-y-auto">
          <div className="p-3 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              AI Engineering Suite
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Audit <span className="font-mono">{activeFilePath}</span> for defects, patch runtime bugs, or generate project documentation.
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                disabled={aiBusy}
                onClick={() => void runAiCodeReview()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Run Deep AI Code Review</span>
              </button>
              <button
                disabled={aiBusy}
                onClick={() => void runAiDebugger()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Debugger: Diagnose & Patch</span>
              </button>
              <button
                disabled={aiBusy}
                onClick={() => void generateProjectDocumentation()}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Generate Repository README.md</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-500 tabular-nums">
              Current Findings ({problems.length})
            </div>
            {problems.map((prob) => (
              <button
                key={prob.id}
                onClick={() => selectFile(prob.filePath, prob.line)}
                className="w-full text-left p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-blue-500 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span
                    className={`font-mono font-semibold ${
                      prob.severity === 'error'
                        ? 'text-red-500'
                        : prob.severity === 'warning'
                        ? 'text-amber-500'
                        : 'text-blue-500'
                    }`}
                  >
                    {prob.severity.toUpperCase()} · {prob.source}
                  </span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {prob.filePath}:Ln {prob.line}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{prob.message}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. AI MODEL GATEWAY & USAGE LEDGER TAB (Phase 3) */}
      {aiTab === 'gateway' && (
        <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3 overflow-y-auto">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Multi-Provider AI Gateway Status
            </div>
            {providers.map((prov) => (
              <div
                key={prov.id}
                className="p-2.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {prov.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                    {prov.status.toUpperCase()}
                    {prov.latencyMs ? ` · ${prov.latencyMs}ms` : ''}
                  </span>
                </div>
                <div className="space-y-1">
                  {prov.models.map((m) => (
                    <div
                      key={m.modelId}
                      className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{m.modelId}</span>
                      <span>
                        {(m.contextWindow / 1024).toFixed(0)}k ctx · {m.tier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Token & Cost Usage Ledger
            </div>
            {usageLedger.map((u) => (
              <div
                key={u.id}
                className="p-2 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-between text-[11px] font-mono tabular-nums"
              >
                <div>
                  <div className="text-slate-800 dark:text-slate-200">{u.modelId}</div>
                  <div className="text-[10px] text-slate-400">
                    {u.role} · {u.timestamp}
                  </div>
                </div>
                <div className="text-right">
                  <div>{u.tokensUsed} tok</div>
                  <div className="text-[10px] text-slate-400">{u.latencyMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
