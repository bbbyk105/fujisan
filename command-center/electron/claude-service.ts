import Anthropic from '@anthropic-ai/sdk';
import { ipcMain, BrowserWindow } from 'electron';

const SYSTEM_PROMPT = `You are the AI Assistant inside the Fuji Command Center — a premium desktop hub for a small Japanese sake producer.

Your role:
- Help the operator manage Gmail, Google Calendar, projects, and the FUJI-SAKE-PREMIUM brand site.
- Be terse, opinionated, and useful. No filler. No "I'd be happy to help".
- Speak Japanese when the user writes in Japanese, English when they write in English.
- When you reference data the user hasn't shown you (e.g., "your inbox", "today's events"), ask first — never invent.
- For UI / design questions, defer to the design system: deep ink background, single gold accent (#c9a96a), 4px grid, Inter + Noto Sans JP.
- For code, prefer the smallest viable change. Cite file:line when known.

You do NOT have direct tool access yet — you respond via natural language. The operator will wire your suggestions into the Command Center's event bus.`;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not set. Add it to .env.local.');
  }
  client = new Anthropic({ apiKey });
  return client;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamRequest {
  requestId: string;
  messages: ChatMessage[];
}

export function registerClaudeIpc() {
  ipcMain.handle('claude:available', async () => {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  });

  ipcMain.on('claude:chat-stream', async (event, req: StreamRequest) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const send = (channel: string, payload: unknown) => {
      if (!window?.isDestroyed()) window?.webContents.send(channel, payload);
    };

    try {
      const c = getClient();
      const stream = c.messages.stream({
        model: 'claude-opus-4-6',
        max_tokens: 64000,
        system: SYSTEM_PROMPT,
        thinking: { type: 'adaptive' } as unknown as Anthropic.ThinkingConfigParam,
        messages: req.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      stream.on('text', (delta: string) => {
        send(`claude:chat-delta:${req.requestId}`, { text: delta });
      });

      const final = await stream.finalMessage();
      const text = final.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('');
      send(`claude:chat-done:${req.requestId}`, {
        text,
        usage: {
          input: final.usage.input_tokens,
          output: final.usage.output_tokens,
          cacheRead: final.usage.cache_read_input_tokens ?? 0,
          cacheCreate: final.usage.cache_creation_input_tokens ?? 0,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send(`claude:chat-error:${req.requestId}`, { message });
    }
  });
}
