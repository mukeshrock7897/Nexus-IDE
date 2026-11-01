export interface DetectedMacSystem {
  isMac: boolean;
  osName: string;
  osVersion: string;
  arch: 'arm64' | 'x64';
  archLabel: string;
  cpuModel: string;
  gpuRenderer: string;
  cpuCores: number;
  deviceMemoryGB: number;
  retinaScale: number;
  recommendedDmg: 'Nexus-IDE-macOS-arm64.dmg' | 'Nexus-IDE-macOS-x64.dmg';
  recommendedZip: 'Nexus-IDE-macOS-arm64.zip' | 'Nexus-IDE-macOS-x64.zip';
  recommendedCommand: 'Nexus-IDE-Mac-Installer.command';
  detectionConfidence: 'high' | 'medium';
  detectionSource: string;
}

function getWebGLRendererInfo(): string {
  if (typeof document === 'undefined') return 'Unknown GPU';
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) return 'Standard Metal GPU';
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (typeof renderer === 'string' && renderer.trim().length > 0) {
        return renderer.trim();
      }
    }
    const fallbackRenderer = gl.getParameter(gl.RENDERER);
    return typeof fallbackRenderer === 'string' ? fallbackRenderer : 'Apple Metal GPU';
  } catch {
    return 'Apple Metal GPU';
  }
}

function parseMacOSVersionName(ua: string): { version: string; codename: string } {
  const match = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/);
  if (!match) {
    return { version: '15.0+', codename: 'macOS Sequoia / Sonoma' };
  }
  const raw = match[1].replace(/_/g, '.');
  // Modern browsers freeze UA at 10.15.7 on macOS 11-15 for privacy, so explain clearly
  if (raw === '10.15.7' || raw.startsWith('10.15')) {
    return { version: '14 / 15+ (UA 10.15.7 compat)', codename: 'macOS Sonoma / Sequoia' };
  }
  const major = parseInt(raw.split('.')[0], 10);
  if (major >= 15) return { version: raw, codename: 'macOS Sequoia' };
  if (major === 14) return { version: raw, codename: 'macOS Sonoma' };
  if (major === 13) return { version: raw, codename: 'macOS Ventura' };
  if (major === 12) return { version: raw, codename: 'macOS Monterey' };
  if (major === 11) return { version: raw, codename: 'macOS Big Sur' };
  return { version: raw, codename: 'macOS' };
}

/**
 * Automatically detects the user's current Mac hardware architecture (Apple Silicon arm64 vs Intel x64),
 * GPU renderer (M1/M2/M3/M4 vs Intel/AMD), CPU cores, display scale, and OS version.
 */
export async function detectCurrentMacSystem(): Promise<DetectedMacSystem> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = typeof navigator !== 'undefined' ? navigator.platform || '' : '';
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K|Mac OS X/i.test(ua + ' ' + platform);
  const gpuRenderer = getWebGLRendererInfo();
  const { version: osVersion, codename: osName } = parseMacOSVersionName(ua);

  let arch: 'arm64' | 'x64' = 'arm64';
  let cpuModel = 'Apple Silicon (M-Series)';
  let detectionConfidence: 'high' | 'medium' = 'medium';
  let detectionSource = 'WebGL Metal GPU & Navigator Heuristics';

  // 1. Inspect WebGL Renderer for Apple M1/M2/M3/M4 or Apple GPU vs Intel/AMD
  const gpuLower = gpuRenderer.toLowerCase();
  if (gpuLower.includes('apple m4')) {
    arch = 'arm64';
    cpuModel = 'Apple M4 Silicon';
    detectionConfidence = 'high';
    detectionSource = 'WebGL GPU Hardware Probe (Apple M4)';
  } else if (gpuLower.includes('apple m3')) {
    arch = 'arm64';
    cpuModel = 'Apple M3 Silicon';
    detectionConfidence = 'high';
    detectionSource = 'WebGL GPU Hardware Probe (Apple M3)';
  } else if (gpuLower.includes('apple m2')) {
    arch = 'arm64';
    cpuModel = 'Apple M2 Silicon';
    detectionConfidence = 'high';
    detectionSource = 'WebGL GPU Hardware Probe (Apple M2)';
  } else if (gpuLower.includes('apple m1')) {
    arch = 'arm64';
    cpuModel = 'Apple M1 Silicon';
    detectionConfidence = 'high';
    detectionSource = 'WebGL GPU Hardware Probe (Apple M1)';
  } else if (gpuLower.includes('apple gpu') || gpuLower.includes('apple')) {
    arch = 'arm64';
    cpuModel = 'Apple Silicon (M1/M2/M3/M4)';
    detectionConfidence = 'high';
    detectionSource = 'WebGL GPU Hardware Probe (Apple Metal)';
  } else if (gpuLower.includes('intel') || gpuLower.includes('radeon') || gpuLower.includes('amd')) {
    arch = 'x64';
    cpuModel = 'Intel Core x86_64';
    detectionConfidence = 'high';
    detectionSource = `WebGL GPU Hardware Probe (${gpuRenderer})`;
  }

  // 2. Also query High-Entropy User-Agent Client Hints if available (Chromium/Edge/Chrome on Mac)
  try {
    const navAny = navigator as Navigator & {
      userAgentData?: {
        getHighEntropyValues?: (hints: string[]) => Promise<{
          architecture?: string;
          bitness?: string;
          platformVersion?: string;
          model?: string;
        }>;
      };
    };
    if (navAny.userAgentData?.getHighEntropyValues) {
      const hints = await navAny.userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
        'platformVersion',
      ]);
      if (hints.architecture) {
        if (hints.architecture.toLowerCase().includes('arm')) {
          arch = 'arm64';
          if (!cpuModel.startsWith('Apple M')) {
            cpuModel = 'Apple Silicon (arm64)';
          }
          detectionConfidence = 'high';
          detectionSource = 'Client Hints CPU Architecture (arm64)';
        } else if (
          hints.architecture.toLowerCase().includes('x86') &&
          !gpuLower.includes('apple')
        ) {
          arch = 'x64';
          cpuModel = 'Intel Core (x86_64)';
          detectionConfidence = 'high';
          detectionSource = 'Client Hints CPU Architecture (x86_64)';
        }
      }
    }
  } catch {
    // Fallback to WebGL result
  }

  const cpuCores =
    typeof navigator !== 'undefined' && navigator.hardwareConcurrency
      ? navigator.hardwareConcurrency
      : 8;
  const deviceMemoryGB =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 16)
      : 16;
  const retinaScale =
    typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio : 2;

  return {
    isMac,
    osName: isMac ? osName : `${osName} (Cross-Platform Target)`,
    osVersion,
    arch,
    archLabel: arch === 'arm64' ? 'Apple Silicon (arm64)' : 'Intel Mac (x86_64)',
    cpuModel,
    gpuRenderer,
    cpuCores,
    deviceMemoryGB,
    retinaScale,
    recommendedDmg: arch === 'arm64' ? 'Nexus-IDE-macOS-arm64.dmg' : 'Nexus-IDE-macOS-x64.dmg',
    recommendedZip: arch === 'arm64' ? 'Nexus-IDE-macOS-arm64.zip' : 'Nexus-IDE-macOS-x64.zip',
    recommendedCommand: 'Nexus-IDE-Mac-Installer.command',
    detectionConfidence,
    detectionSource,
  };
}

export interface DownloadResult {
  ok: boolean;
  filename: string;
  sizeBytes: number;
  error?: string;
}

/**
 * Downloads a release binary using an authenticated in-frame fetch() -> ArrayBuffer -> Blob -> ObjectURL.
 * This prevents the browser's external download manager from hitting the unauthenticated ~10 KB HTML proxy page
 * when clicking a raw <a href="/api/release/download/..."> inside a sandboxed preview iframe.
 */
export async function downloadReleaseBinary(
  filename: string,
  onStatus?: (status: string) => void
): Promise<DownloadResult> {
  try {
    onStatus?.(`Fetching binary stream for ${filename}...`);
    const res = await fetch(`/api/release/download/${encodeURIComponent(filename)}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/octet-stream, */*',
      },
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status} (${res.statusText})`);
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Verify we did NOT receive an HTML proxy error/login page (which starts with <!DOCTYPE or <html)
    const headerPreview = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.slice(0, 64))
      .trim()
      .toLowerCase();

    if (headerPreview.startsWith('<!doctype html') || headerPreview.startsWith('<html')) {
      throw new Error(
        'Received HTML proxy response instead of binary stream. Retrying via Base64 binary transport...'
      );
    }

    // For .dmg and .zip, verify binary signature & size
    if (filename.endsWith('.dmg')) {
      if (bytes.byteLength < 50_000) {
        throw new Error(`Invalid DMG size (${bytes.byteLength} bytes). Expected UDIF disk image.`);
      }
      // Verify UDIF 'koly' trailer at the last 512 bytes
      const kolyOffset = bytes.byteLength - 512;
      const kolyMagic = String.fromCharCode(
        bytes[kolyOffset],
        bytes[kolyOffset + 1],
        bytes[kolyOffset + 2],
        bytes[kolyOffset + 3]
      );
      if (kolyMagic !== 'koly') {
        throw new Error(`Invalid DMG trailer signature (${kolyMagic}). Expected Apple UDIF koly.`);
      }
    } else if (filename.endsWith('.zip')) {
      if (bytes.byteLength < 50_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
        throw new Error('Invalid ZIP header signature. Expected PKZIP (0x504B0304).');
      }
    }

    onStatus?.(`Verified ${(bytes.byteLength / 1024).toFixed(1)} KB binary. Saving ${filename}...`);

    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 5000);

    return {
      ok: true,
      filename,
      sizeBytes: bytes.byteLength,
    };
  } catch (err) {
    // Fallback: request via JSON base64 endpoint so proxy layers cannot alter binary streams
    try {
      onStatus?.(`Using verified Base64 binary transport for ${filename}...`);
      const b64Res = await fetch(`/api/release/download-base64/${encodeURIComponent(filename)}`, {
        credentials: 'include',
      });
      if (!b64Res.ok) {
        throw new Error(`Base64 transport returned HTTP ${b64Res.status}`);
      }
      const payload = await b64Res.json();
      if (!payload?.base64) {
        throw new Error('Missing base64 payload');
      }
      const binaryString = atob(payload.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes.buffer], { type: 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 5000);

      return {
        ok: true,
        filename,
        sizeBytes: bytes.byteLength,
      };
    } catch (fallbackErr) {
      return {
        ok: false,
        filename,
        sizeBytes: 0,
        error: fallbackErr instanceof Error ? fallbackErr.message : String(err),
      };
    }
  }
}
