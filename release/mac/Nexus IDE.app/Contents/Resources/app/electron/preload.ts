/**
 * Secure Electron Preload Script for Nexus IDE
 * Exposes an explicit, channel-validated API via contextBridge.
 * Node integration is disabled in the renderer; raw ipcRenderer is never exposed.
 */

import { isValidIpcChannel } from './security';
import type { IpcChannel, NexusDesktopAPI } from '../src/shared/ipc-types';

interface ElectronContextBridge {
  exposeInMainWorld(apiKey: string, api: NexusDesktopAPI): void;
}

interface ElectronIpcRenderer {
  invoke(channel: string, payload?: unknown): Promise<unknown>;
}

export function initializePreloadBridge(
  contextBridge: ElectronContextBridge,
  ipcRenderer: ElectronIpcRenderer,
  platform: string = process.platform
): void {
  const api: NexusDesktopAPI = {
    platform,
    isElectron: true,
    invoke: async <TReq = unknown, TRes = unknown>(
      channel: IpcChannel,
      payload?: TReq
    ): Promise<TRes> => {
      if (!isValidIpcChannel(channel)) {
        throw new Error(`[Nexus Security] Blocked unauthorized IPC channel: ${String(channel)}`);
      }
      return (await ipcRenderer.invoke(channel, payload)) as TRes;
    },
  };

  contextBridge.exposeInMainWorld('nexusAPI', api);
}
