import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  FolderOpen,
  HardDrive,
  Laptop,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { useIdeStore } from '../store/useIdeStore';
import type { MacReleaseArtifact } from '../shared/ipc-types';
import {
  detectCurrentMacSystem,
  downloadReleaseBinary,
  type DetectedMacSystem,
} from '../utils/macSystemDetector';

interface ReleaseManifest {
  appName: string;
  appId: string;
  version: string;
  builtAt?: string;
  appBundlePath?: string;
  signingStatus: string;
  notarizationStatus: string;
  artifacts: MacReleaseArtifact[];
}

export function MacInstallerModal() {
  const { macInstallerOpen, setMacInstallerOpen, appendOutputLog } = useIdeStore();
  const [manifest, setManifest] = useState<ReleaseManifest | null>(null);
  const [detectedSystem, setDetectedSystem] = useState<DetectedMacSystem | null>(null);
  const [selectedArch, setSelectedArch] = useState<'arm64' | 'x64'>('arm64');
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [copiedUnlockCmd, setCopiedUnlockCmd] = useState(false);

  useEffect(() => {
    void detectCurrentMacSystem().then((sys) => {
      setDetectedSystem(sys);
      setSelectedArch(sys.arch);
    });
  }, []);

  useEffect(() => {
    if (!macInstallerOpen) return;
    fetch('/api/release/artifacts')
      .then((r) => r.json())
      .then((data: ReleaseManifest) => setManifest(data))
      .catch(() => undefined);
  }, [macInstallerOpen]);

  const primaryDmg =
    manifest?.artifacts.find((a) => a.arch === selectedArch && a.format === 'dmg') ||
    manifest?.artifacts[0];

  const dmgFilename = primaryDmg?.filename || `Nexus-IDE-macOS-${selectedArch}.dmg`;

  // Universal 1-line Mac Terminal command:
  // Works whether the user only downloaded the .dmg to ~/Downloads OR already dragged Nexus IDE.app to /Applications.
  // Automatically mounts the latest downloaded DMG, copies Nexus IDE.app to /Applications, strips Gatekeeper quarantine,
  // applies a local ad-hoc signature, and launches Nexus IDE.app!
  const oneLineMacInstallAndLaunchCmd = `if [ ! -d "/Applications/Nexus IDE.app" ]; then DMG="$(ls -t ~/Downloads/Nexus-IDE-macOS*.dmg 2>/dev/null | head -n 1)"; xattr -cr "$DMG" 2>/dev/null; hdiutil attach "$DMG" -mountpoint /tmp/nexus_mnt -nobrowse -quiet && cp -R "/tmp/nexus_mnt/Nexus IDE.app" /Applications/ && hdiutil detach /tmp/nexus_mnt -quiet; fi; chmod +x "/Applications/Nexus IDE.app/Contents/MacOS/Nexus IDE" "/Applications/Nexus IDE.app/Contents/Resources/app/macos_server.py" 2>/dev/null; xattr -cr "/Applications/Nexus IDE.app" && codesign --force --deep --sign - "/Applications/Nexus IDE.app" 2>/dev/null && open "/Applications/Nexus IDE.app"`;

  const handleVerifiedDownload = async (filename: string) => {
    setDownloadingFile(filename);
    setDownloadStatus(`Preparing verified Apple UDIF disk image ${filename}...`);
    appendOutputLog('macOS Release Download', `Fetching verified binary ${filename}...`);

    const result = await downloadReleaseBinary(filename, (statusMsg) => {
      setDownloadStatus(statusMsg);
    });

    setDownloadingFile(null);
    if (result.ok) {
      const kb = (result.sizeBytes / 1024).toFixed(1);
      const msg = `Downloaded ${result.filename} (${kb} KB) to ~/Downloads. Now complete Step 2 below to install & launch!`;
      setDownloadStatus(msg);
      appendOutputLog('macOS Release Download', msg);
    } else {
      const errMsg = `Download error for ${filename}: ${result.error || 'Unknown error'}`;
      setDownloadStatus(errMsg);
      appendOutputLog('macOS Release Download', errMsg);
    }
  };

  const handleCopyUnlockCommand = () => {
    void navigator.clipboard?.writeText(oneLineMacInstallAndLaunchCmd);
    setCopiedUnlockCmd(true);
    appendOutputLog(
      'macOS Installer',
      'Copied 1-Line macOS Installer & Gatekeeper Unlocker command to clipboard.'
    );
    setTimeout(() => setCopiedUnlockCmd(false), 3000);
  };

  return (
    <Dialog.Root open={macInstallerOpen} onOpenChange={setMacInstallerOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/65 backdrop-blur-[2px] z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl z-50 overflow-hidden outline-none">
          {/* Top macOS Window Bar */}
          <div className="h-11 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <Dialog.Title className="ml-2 text-xs font-semibold tracking-tight text-slate-800 dark:text-slate-200">
                Install Nexus IDE on macOS (com.nexuside.desktop)
              </Dialog.Title>
            </div>
            <Dialog.Description className="sr-only">
              Download Nexus-IDE-macOS.dmg containing Nexus IDE.app and install it into /Applications on your Mac.
            </Dialog.Description>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                aria-label="Close macOS Installer"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Automatic Mac System Detection Bar */}
            {detectedSystem && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/25 p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Detected Your Mac: {detectedSystem.cpuModel}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        {detectedSystem.archLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {detectedSystem.osName} · GPU: {detectedSystem.gpuRenderer} · {detectedSystem.cpuCores} Cores
                    </div>
                  </div>
                </div>

                {/* Architecture Toggle */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedArch('arm64')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      selectedArch === 'arm64'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Apple Silicon (arm64)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArch('x64')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      selectedArch === 'x64'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Cpu className="w-3 h-3" />
                    <span>Intel Mac (x64)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Live Download Status */}
            {downloadStatus && (
              <div className="px-3.5 py-2.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 flex items-center justify-between gap-2 font-mono text-[11px]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{downloadStatus}</span>
                </div>
              </div>
            )}

            {/* STEP 1 & STEP 2: Single Unified DMG Download & Drag-to-Applications Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-5 space-y-5 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <HardDrive className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Step 1
                      </span>
                      <span className="text-sm font-bold font-mono">{dmgFilename}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Contains unpacked <code className="text-slate-200 font-mono">Nexus IDE.app</code> · {primaryDmg?.sizeFormatted || '635 KB'} · Mounts as <code className="text-slate-200 font-mono">NEXUS IDE</code>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloadingFile !== null}
                  onClick={() => void handleVerifiedDownload(dmgFilename)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold transition-colors cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {downloadingFile === dmgFilename
                      ? 'Downloading .DMG...'
                      : `Download ${dmgFilename}`}
                  </span>
                </button>
              </div>

              {/* Visual Drag Nexus IDE.app -> Applications */}
              <div className="py-2 flex items-center justify-center gap-8 sm:gap-16">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 border-2 border-blue-500/60 shadow-lg flex items-center justify-center">
                    <span className="font-mono text-xl font-bold text-sky-400">&lt;/&gt;</span>
                  </div>
                  <span className="text-sm font-semibold text-white">Nexus IDE.app</span>
                  <span className="text-[11px] text-slate-400">Inside Mounted DMG</span>
                </div>

                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">
                    Drag to Install
                  </span>
                  <ArrowRight className="w-6 h-6 text-blue-400" />
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 border-2 border-sky-300/50 shadow-lg flex items-center justify-center">
                    <FolderOpen className="w-10 h-10 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-white">Applications</span>
                  <span className="text-[11px] text-slate-400">/Applications</span>
                </div>
              </div>

              {/* STEP 2: 1-Command Gatekeeper Unlocker & Auto-Installer */}
              <div className="rounded-lg border border-emerald-500/30 bg-slate-950/90 p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Step 2 (Important on macOS Sequoia)
                    </span>
                    <span className="font-semibold text-white">
                      1-Click Install to /Applications & Bypass macOS "Not Opened" Popup
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUnlockCommand}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {copiedUnlockCmd ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied! Paste in Mac Terminal</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Command for Mac Terminal</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  macOS Sequoia blocks unsigned apps downloaded from a browser with{' '}
                  <span className="text-amber-300 font-medium">"Not Opened / Move to Bin"</span>.
                  After downloading the <code className="font-mono">.dmg</code> in Step 1, open your Mac{' '}
                  <strong>Terminal</strong> app, paste this command, and press <strong>Enter</strong> — it automatically installs{' '}
                  <code className="font-mono">Nexus IDE.app</code> to <code className="font-mono">/Applications</code>, clears Gatekeeper quarantine, signs the app locally, and launches it:
                </p>

                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 select-all break-all">
                  {oneLineMacInstallAndLaunchCmd}
                </div>
              </div>
            </div>

            {/* Alternative No-Terminal GUI Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span>Option B: Open Without Terminal (Mac GUI)</span>
                </div>
                <ol className="list-decimal list-inside text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                  <li>
                    Double-click <code className="font-mono">{dmgFilename}</code> and drag{' '}
                    <strong>Nexus IDE.app</strong> into <strong>Applications</strong>.
                  </li>
                  <li>
                    Double-click <strong>Nexus IDE.app</strong> in Applications. When macOS shows{' '}
                    <em>"Not Opened"</em>, click <strong>Done</strong> (do not click Move to Bin).
                  </li>
                  <li>
                    Open <strong>System Settings → Privacy & Security</strong>, scroll down to{' '}
                    <em>Security</em>, and click <strong>Open Anyway</strong>.
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Terminal className="w-4 h-4 text-emerald-500" />
                  <span>What Was Fixed in This DMG Build</span>
                </div>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 leading-relaxed">
                  <li>
                    <strong>Real Unpacked <code className="font-mono">Nexus IDE.app</code> Bundle:</strong>{' '}
                    Mounted DMG now contains <code className="font-mono">Nexus IDE.app</code> directly (removed <code className="font-mono">INSTALL.CMD</code> and <code className="font-mono">NEXUSAPP.ZIP</code>).
                  </li>
                  <li>
                    <strong>Native Apple <code className="font-mono">.icns</code> Icon & Runtime:</strong>{' '}
                    Includes binary <code className="font-mono">icon.icns</code> and standalone macOS window launcher.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
