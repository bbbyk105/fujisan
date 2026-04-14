export interface TreeNode {
  id: string;
  label: string;
  icon?: 'folder' | 'project' | 'tag' | 'inbox' | 'calendar' | 'archive';
  children?: TreeNode[];
  meta?: { count?: number; color?: string };
}

export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
}

export interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'review' | 'done';
  progress: number; // 0-100
  deadline?: string;
  tags?: string[];
  nextAction?: string;
}

declare global {
  interface Window {
    api?: {
      google: {
        getAuthUrl: () => Promise<string>;
        exchangeCode: (code: string) => Promise<{ ok: boolean }>;
      };
      gmail: {
        list: (opts?: { maxResults?: number }) => Promise<MailMessage[]>;
      };
      calendar: {
        list: (opts?: { timeMin?: string; timeMax?: string }) => Promise<CalendarEvent[]>;
      };
    };
  }
}
