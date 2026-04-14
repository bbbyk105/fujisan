import { create } from 'zustand';
import type { TreeNode, MailMessage, CalendarEvent, Project } from '@/types';

interface AppState {
  selectedNodeId: string;
  setSelectedNodeId: (id: string) => void;

  tree: TreeNode[];
  toggleNewMenu: boolean;
  setToggleNewMenu: (v: boolean) => void;

  mails: MailMessage[];
  events: CalendarEvent[];
  projects: Project[];

  setMails: (m: MailMessage[]) => void;
  setEvents: (e: CalendarEvent[]) => void;
  addProject: (p: Project) => void;
}

const initialTree: TreeNode[] = [
  {
    id: 'inbox',
    label: 'インボックス',
    icon: 'inbox',
    meta: { count: 12 },
  },
  {
    id: 'today',
    label: '今日',
    icon: 'calendar',
    meta: { count: 4 },
  },
  {
    id: 'projects',
    label: 'プロジェクト',
    icon: 'folder',
    children: [
      { id: 'proj-fuji-sake', label: 'FUJI-SAKE-PREMIUM', icon: 'project', meta: { count: 8 } },
      { id: 'proj-gmail-auto', label: 'Gmail 自動管理', icon: 'project', meta: { count: 3 } },
      { id: 'proj-cal-sync', label: 'カレンダー同期', icon: 'project', meta: { count: 2 } },
    ],
  },
  {
    id: 'tags',
    label: 'タグ',
    icon: 'tag',
    children: [
      { id: 'tag-urgent', label: '緊急', icon: 'tag', meta: { color: '#e56b6f' } },
      { id: 'tag-client', label: 'クライアント', icon: 'tag', meta: { color: '#c9a96a' } },
      { id: 'tag-idea', label: 'アイデア', icon: 'tag', meta: { color: '#6aa4c9' } },
    ],
  },
  {
    id: 'archive',
    label: 'アーカイブ',
    icon: 'archive',
  },
];

const mockProjects: Project[] = [
  {
    id: 'p1',
    name: 'FUJI-SAKE-PREMIUM サイト',
    status: 'active',
    progress: 65,
    deadline: '2026-05-01',
    tags: ['web', 'next.js'],
    nextAction: 'Opus One スタイルのボトル撮影',
  },
  {
    id: 'p2',
    name: 'Gmail 自動返信ボット',
    status: 'review',
    progress: 82,
    deadline: '2026-04-20',
    tags: ['gmail', 'ai'],
    nextAction: 'レスポンステンプレートのレビュー',
  },
  {
    id: 'p3',
    name: 'カレンダー週次サマリー',
    status: 'active',
    progress: 30,
    deadline: '2026-04-25',
    tags: ['calendar', 'automation'],
    nextAction: 'Slack 通知の統合',
  },
  {
    id: 'p4',
    name: 'ドメイン購入 & DNS',
    status: 'paused',
    progress: 10,
    tags: ['infra'],
    nextAction: 'Vercel 設定の確認',
  },
];

export const useStore = create<AppState>((set) => ({
  selectedNodeId: 'inbox',
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),

  tree: initialTree,
  toggleNewMenu: false,
  setToggleNewMenu: (v) => set({ toggleNewMenu: v }),

  mails: [],
  events: [],
  projects: mockProjects,

  setMails: (m) => set({ mails: m }),
  setEvents: (e) => set({ events: e }),
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
}));
