import http from 'node:http';
import { URL } from 'node:url';
import { ipcMain } from 'electron';

const PORT = 53682;

let server: http.Server | null = null;
let pendingResolve: ((code: string) => void) | null = null;

/**
 * Start a local HTTP server on port 53682 to receive Google OAuth callbacks.
 * The redirect URI registered in Google Cloud Console must be:
 *   http://localhost:53682/callback
 */
export function startOAuthCallbackServer(): Promise<void> {
  if (server) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
      if (url.pathname !== '/callback') {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(callbackHtml(error ? `Error: ${error}` : '認証が完了しました — このタブを閉じてください'));

      if (code && pendingResolve) {
        pendingResolve(code);
        pendingResolve = null;
      }
    });

    server.on('error', (e) => {
      console.error('OAuth callback server failed to start:', e);
      reject(e);
    });

    server.listen(PORT, '127.0.0.1', () => {
      console.log(`OAuth callback server listening on http://localhost:${PORT}/callback`);
      resolve();
    });
  });
}

function callbackHtml(message: string) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>Fuji Command Center — OAuth</title>
  <style>
    body{margin:0;background:#0a0a0f;color:#eaeaee;font-family:'Inter','Noto Sans JP',sans-serif;
         display:flex;align-items:center;justify-content:center;height:100vh;text-align:center}
    h1{font-size:1.25rem;font-weight:600;margin:0 0 0.5rem}
    p{color:#a8a8b0;margin:0}
    .accent{color:#c9a96a}
  </style>
</head>
<body>
  <div>
    <div class="accent" style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:.5rem">
      Fuji Command Center
    </div>
    <h1>${message}</h1>
    <p style="margin-top:1rem">このウィンドウを閉じてアプリに戻ってください</p>
  </div>
</body>
</html>`;
}

/**
 * Register IPC handler that returns a promise resolving to the OAuth code
 * once the user completes the Google consent flow in the browser.
 */
ipcMain.handle('oauth:wait-for-code', () => {
  return new Promise<string>((resolve, reject) => {
    pendingResolve = resolve;
    setTimeout(() => {
      if (pendingResolve === resolve) {
        pendingResolve = null;
        reject(new Error('OAuth timed out after 5 minutes'));
      }
    }, 5 * 60 * 1000);
  });
});
