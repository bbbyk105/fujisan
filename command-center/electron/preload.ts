import { contextBridge, ipcRenderer } from 'electron';

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (final: { text: string; usage: { input: number; output: number; cacheRead: number; cacheCreate: number } }) => void;
  onError: (message: string) => void;
}

const api = {
  google: {
    getAuthUrl: () => ipcRenderer.invoke('google:auth-url'),
    exchangeCode: (code: string) => ipcRenderer.invoke('google:exchange-code', code),
    waitForCallbackCode: () => ipcRenderer.invoke('oauth:wait-for-code') as Promise<string>,
  },
  gmail: {
    list: (opts: { maxResults?: number } = {}) => ipcRenderer.invoke('gmail:list', opts),
  },
  calendar: {
    list: (opts: { timeMin?: string; timeMax?: string } = {}) =>
      ipcRenderer.invoke('calendar:list', opts),
  },
  claude: {
    available: () => ipcRenderer.invoke('claude:available') as Promise<boolean>,
    chatStream: (
      requestId: string,
      messages: { role: 'user' | 'assistant'; content: string }[],
      handlers: ChatStreamHandlers,
    ) => {
      const onDelta = (_e: unknown, payload: { text: string }) => handlers.onDelta(payload.text);
      const onDone = (_e: unknown, payload: Parameters<ChatStreamHandlers['onDone']>[0]) => {
        cleanup();
        handlers.onDone(payload);
      };
      const onError = (_e: unknown, payload: { message: string }) => {
        cleanup();
        handlers.onError(payload.message);
      };
      const cleanup = () => {
        ipcRenderer.removeListener(`claude:chat-delta:${requestId}`, onDelta);
        ipcRenderer.removeListener(`claude:chat-done:${requestId}`, onDone);
        ipcRenderer.removeListener(`claude:chat-error:${requestId}`, onError);
      };
      ipcRenderer.on(`claude:chat-delta:${requestId}`, onDelta);
      ipcRenderer.on(`claude:chat-done:${requestId}`, onDone);
      ipcRenderer.on(`claude:chat-error:${requestId}`, onError);
      ipcRenderer.send('claude:chat-stream', { requestId, messages });
      return cleanup;
    },
  },
};

contextBridge.exposeInMainWorld('api', api);

export type BridgeApi = typeof api;
