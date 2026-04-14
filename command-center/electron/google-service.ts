import { google } from 'googleapis';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
];

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:53682/callback';

const TOKEN_PATH = path.join(app.getPath('userData'), 'google-token.json');

function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

function loadTokens(client: ReturnType<typeof createOAuthClient>) {
  if (fs.existsSync(TOKEN_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
    client.setCredentials(tokens);
    return true;
  }
  return false;
}

function saveTokens(tokens: unknown) {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
}

export function getAuthUrl() {
  const oauth = createOAuthClient();
  return oauth.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

export async function exchangeCode(code: string) {
  const oauth = createOAuthClient();
  const { tokens } = await oauth.getToken(code);
  saveTokens(tokens);
  return { ok: true };
}

function getAuthorizedClient() {
  const oauth = createOAuthClient();
  if (!loadTokens(oauth)) throw new Error('Not authenticated. Complete OAuth flow first.');
  return oauth;
}

export async function listMessages({ maxResults = 20 }: { maxResults?: number }) {
  const auth = getAuthorizedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const list = await gmail.users.messages.list({ userId: 'me', maxResults });
  const messages = list.data.messages ?? [];
  const details = await Promise.all(
    messages.map((m) =>
      gmail.users.messages.get({
        userId: 'me',
        id: m.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject', 'Date'],
      }),
    ),
  );
  return details.map((d) => {
    const headers = d.data.payload?.headers ?? [];
    const h = (name: string) => headers.find((x) => x.name === name)?.value ?? '';
    return {
      id: d.data.id!,
      snippet: d.data.snippet ?? '',
      from: h('From'),
      subject: h('Subject'),
      date: h('Date'),
      unread: (d.data.labelIds ?? []).includes('UNREAD'),
    };
  });
}

export async function listEvents({
  timeMin = new Date().toISOString(),
  timeMax,
}: {
  timeMin?: string;
  timeMax?: string;
}) {
  const auth = getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    maxResults: 50,
    singleEvents: true,
    orderBy: 'startTime',
  });
  return (res.data.items ?? []).map((e) => ({
    id: e.id!,
    summary: e.summary ?? '(無題)',
    start: e.start?.dateTime ?? e.start?.date ?? '',
    end: e.end?.dateTime ?? e.end?.date ?? '',
    location: e.location ?? '',
    attendees: (e.attendees ?? []).map((a) => a.email).filter(Boolean) as string[],
  }));
}
