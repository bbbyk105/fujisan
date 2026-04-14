export interface TreeNode {
  id: string;
  label: string;
  icon?:
    | 'folder'
    | 'project'
    | 'tag'
    | 'inbox'
    | 'calendar'
    | 'archive'
    | 'home'
    | 'product';
  children?: TreeNode[];
  meta?: { count?: number; color?: string };
}

export type ProductStatus = 'active' | 'development' | 'planned' | 'paused';

export interface Product {
  id: string;
  name: string;
  shortName?: string;
  description: string;
  status: ProductStatus;
  /** Tailwind gradient class pair e.g. "from-sky-500 to-indigo-600" */
  gradient: string;
  /** Lucide icon name */
  icon: string;
  category: 'site' | 'automation' | 'ai' | 'data' | 'design' | 'ops';
  url?: string;
  /** primary metric displayed on card */
  stat?: { label: string; value: string };
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

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onDone: (final: {
    text: string;
    usage: { input: number; output: number; cacheRead: number; cacheCreate: number };
  }) => void;
  onError: (message: string) => void;
}

declare global {
  interface Window {
    api?: {
      google: {
        getAuthUrl: () => Promise<string>;
        exchangeCode: (code: string) => Promise<{ ok: boolean }>;
        waitForCallbackCode: () => Promise<string>;
      };
      gmail: {
        list: (opts?: { maxResults?: number }) => Promise<MailMessage[]>;
      };
      calendar: {
        list: (opts?: { timeMin?: string; timeMax?: string }) => Promise<CalendarEvent[]>;
      };
      claude: {
        available: () => Promise<boolean>;
        chatStream: (
          requestId: string,
          messages: { role: 'user' | 'assistant'; content: string }[],
          handlers: ChatStreamHandlers,
        ) => () => void;
      };
    };
  }
}
