import type { MailMessage, CalendarEvent } from '@/types';

/**
 * Google OAuth 未接続時のサンプルデータ。
 * 本番では window.api.gmail.list() / window.api.calendar.list() に置き換え。
 */

export const mockMails: MailMessage[] = [
  {
    id: 'm1',
    from: 'yamada@example.com',
    subject: '【重要】FUJI-SAKE サンプル納品の件',
    snippet: 'お世話になっております。来週月曜日にサンプルを発送予定です…',
    date: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: true,
  },
  {
    id: 'm2',
    from: 'noreply@vercel.com',
    subject: 'Deployment succeeded',
    snippet: 'Your deployment of fuji-sake-premium is live at…',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: true,
  },
  {
    id: 'm3',
    from: 'sato@kura.jp',
    subject: '蔵元見学のご案内',
    snippet: '先日はありがとうございました。ご希望の日程は…',
    date: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    unread: false,
  },
  {
    id: 'm4',
    from: 'github@noreply.github.com',
    subject: '[hirozo454/FUJI-SAKE-PREMIUM] PR #3',
    snippet: 'A new pull request has been opened on your repository…',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    unread: false,
  },
  {
    id: 'm5',
    from: 'design@studio.jp',
    subject: 'ラベルデザイン第2案',
    snippet: '添付のとおり、修正版をお送りします。ご確認ください。',
    date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    unread: false,
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    summary: '蔵元ミーティング',
    start: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    location: 'Zoom',
    attendees: ['yamada@example.com', 'sato@kura.jp'],
  },
  {
    id: 'e2',
    summary: 'デザインレビュー',
    start: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    location: '社内 A 会議室',
    attendees: ['design@studio.jp'],
  },
  {
    id: 'e3',
    summary: 'ボトル撮影',
    start: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 28).toISOString(),
    location: 'スタジオ 青山',
  },
  {
    id: 'e4',
    summary: '週次レビュー',
    start: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    end: new Date(Date.now() + 1000 * 60 * 60 * 49).toISOString(),
  },
];
