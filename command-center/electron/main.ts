import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0a0a0f',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// --- IPC: Google API 呼び出し中継（preload 経由） ---
ipcMain.handle('google:auth-url', async () => {
  const { getAuthUrl } = await import('./google-service.js');
  return getAuthUrl();
});

ipcMain.handle('google:exchange-code', async (_e, code: string) => {
  const { exchangeCode } = await import('./google-service.js');
  return exchangeCode(code);
});

ipcMain.handle('gmail:list', async (_e, opts: { maxResults?: number }) => {
  const { listMessages } = await import('./google-service.js');
  return listMessages(opts);
});

ipcMain.handle('calendar:list', async (_e, opts: { timeMin?: string; timeMax?: string }) => {
  const { listEvents } = await import('./google-service.js');
  return listEvents(opts);
});
