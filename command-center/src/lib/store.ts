import { create } from 'zustand';
import type { TreeNode, MailMessage, CalendarEvent, Project, Product } from '@/types';

export type ViewMode = 'home' | 'inbox' | 'today' | 'product' | 'tag' | 'archive';

interface AppState {
  selectedNodeId: string;
  view: ViewMode;
  activeProductId: string | null;
  setSelectedNode: (id: string, view: ViewMode, productId?: string) => void;

  tree: TreeNode[];
  products: Product[];
  addProduct: (p: Product) => void;

  toggleNewMenu: boolean;
  setToggleNewMenu: (v: boolean) => void;

  mails: MailMessage[];
  events: CalendarEvent[];
  projects: Project[];

  setMails: (m: MailMessage[]) => void;
  setEvents: (e: CalendarEvent[]) => void;
  addProject: (p: Project) => void;
}

const initialProducts: Product[] = [
  {
    id: 'fuji-sake-site',
    name: 'FUJI-SAKE PREMIUM',
    shortName: '富士酒サイト',
    description: 'Opus One スタイルの日本酒ブランドサイト',
    status: 'active',
    gradient: 'from-accent to-amber-700',
    icon: 'wine',
    category: 'site',
    url: 'https://fuji-sake-premium.vercel.app',
    stat: { label: '進捗', value: '65%' },
  },
  {
    id: 'gmail-auto',
    name: 'Gmail 自動返信',
    description: 'AI によるメール分類・返信テンプレート自動生成',
    status: 'development',
    gradient: 'from-sky-500 to-indigo-600',
    icon: 'mail',
    category: 'automation',
    stat: { label: '未読', value: '12' },
  },
  {
    id: 'calendar-sync',
    name: 'カレンダー同期',
    description: 'Google Calendar と Notion / Slack の双方向同期',
    status: 'development',
    gradient: 'from-emerald-500 to-teal-600',
    icon: 'calendar-sync',
    category: 'automation',
    stat: { label: '今日', value: '4 件' },
  },
  {
    id: 'ai-assistant',
    name: 'AI アシスタント',
    description: 'Claude API による日常業務のパートナー',
    status: 'planned',
    gradient: 'from-violet-500 to-fuchsia-600',
    icon: 'sparkles',
    category: 'ai',
    stat: { label: 'モデル', value: 'Opus 4.6' },
  },
  {
    id: 'analytics',
    name: '分析ダッシュボード',
    description: 'サイト・売上・キャンペーンの統合 KPI',
    status: 'planned',
    gradient: 'from-rose-500 to-pink-600',
    icon: 'bar-chart',
    category: 'data',
    stat: { label: 'KPI', value: '—' },
  },
  {
    id: 'label-designer',
    name: 'ラベルデザイナー',
    description: 'ボトルラベルの AI 生成 + バージョン管理',
    status: 'planned',
    gradient: 'from-orange-500 to-red-600',
    icon: 'palette',
    category: 'design',
    stat: { label: 'バージョン', value: '—' },
  },
  {
    id: 'automation-engine',
    name: '自動化エンジン',
    description: 'If-Then トリガーで業務を接続',
    status: 'planned',
    gradient: 'from-cyan-500 to-blue-600',
    icon: 'zap',
    category: 'automation',
    stat: { label: 'ルール', value: '0' },
  },
  {
    id: 'kura-crm',
    name: '蔵元 CRM',
    description: '蔵元・取引先・顧客の関係管理',
    status: 'planned',
    gradient: 'from-slate-500 to-zinc-700',
    icon: 'users',
    category: 'data',
    stat: { label: '連絡先', value: '—' },
  },
];

function buildTree(products: Product[]): TreeNode[] {
  return [
    { id: 'home', label: 'ホーム', icon: 'home' },
    { id: 'inbox', label: 'インボックス', icon: 'inbox', meta: { count: 12 } },
    { id: 'today', label: '今日', icon: 'calendar', meta: { count: 4 } },
    {
      id: 'products',
      label: 'プロダクト',
      icon: 'folder',
      children: products.map((p) => ({
        id: `product:${p.id}`,
        label: p.shortName ?? p.name,
        icon: 'product' as const,
        meta: {
          color:
            p.status === 'active'
              ? '#34d399'
              : p.status === 'development'
                ? '#c9a96a'
                : p.status === 'paused'
                  ? '#7a7a82'
                  : '#6aa4c9',
        },
      })),
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
    { id: 'archive', label: 'アーカイブ', icon: 'archive' },
  ];
}

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
  selectedNodeId: 'home',
  view: 'home',
  activeProductId: null,
  setSelectedNode: (id, view, productId) =>
    set({ selectedNodeId: id, view, activeProductId: productId ?? null }),

  tree: buildTree(initialProducts),
  products: initialProducts,
  addProduct: (p) =>
    set((s) => {
      const products = [...s.products, p];
      return { products, tree: buildTree(products) };
    }),

  toggleNewMenu: false,
  setToggleNewMenu: (v) => set({ toggleNewMenu: v }),

  mails: [],
  events: [],
  projects: mockProjects,

  setMails: (m) => set({ mails: m }),
  setEvents: (e) => set({ events: e }),
  addProject: (p) => set((s) => ({ projects: [p, ...s.projects] })),
}));
