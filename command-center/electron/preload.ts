import { contextBridge, ipcRenderer } from 'electron';

const api = {
  google: {
    getAuthUrl: () => ipcRenderer.invoke('google:auth-url'),
    exchangeCode: (code: string) => ipcRenderer.invoke('google:exchange-code', code),
  },
  gmail: {
    list: (opts: { maxResults?: number } = {}) => ipcRenderer.invoke('gmail:list', opts),
  },
  calendar: {
    list: (opts: { timeMin?: string; timeMax?: string } = {}) =>
      ipcRenderer.invoke('calendar:list', opts),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type BridgeApi = typeof api;
