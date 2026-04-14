export type FlowNodeKind = 'source' | 'process' | 'sink' | 'ai' | 'user';
export type FlowStatus = 'idle' | 'active' | 'success' | 'error';

export interface FlowNode {
  id: string;
  label: string;
  kind: FlowNodeKind;
  x: number; // 0-1200 logical units
  y: number; // 0-600 logical units
  status: FlowStatus;
  productId?: string;
  metric?: { value: string; unit?: string };
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  kind: 'data' | 'trigger' | 'auth';
}

export const initialNodes: FlowNode[] = [
  // Left column — sources
  { id: 'gmail',    label: 'Gmail',      kind: 'source',  x: 80,  y: 120, status: 'idle', productId: 'gmail-auto',    metric: { value: '12', unit: '未読' } },
  { id: 'calendar', label: 'Calendar',   kind: 'source',  x: 80,  y: 280, status: 'idle', productId: 'calendar-sync', metric: { value: '4', unit: '予定' } },
  { id: 'projects', label: 'Projects',   kind: 'source',  x: 80,  y: 440, status: 'idle',                             metric: { value: '4', unit: '進行中' } },

  // Middle column — AI / processing
  { id: 'classify', label: 'AI 分類',     kind: 'ai',      x: 420, y: 120, status: 'idle', productId: 'ai-assistant' },
  { id: 'schedule', label: 'スケジュール最適化', kind: 'process', x: 420, y: 280, status: 'idle' },
  { id: 'auto',     label: '自動化エンジン', kind: 'process', x: 420, y: 440, status: 'idle', productId: 'automation-engine' },

  // Right-middle column — actions
  { id: 'reply',    label: '返信生成',   kind: 'ai',      x: 760, y: 80,  status: 'idle' },
  { id: 'slack',    label: 'Slack 通知', kind: 'sink',    x: 760, y: 240, status: 'idle' },
  { id: 'logs',     label: 'ログ',       kind: 'process', x: 760, y: 440, status: 'idle' },

  // Right column — destinations
  { id: 'send',     label: '送信',       kind: 'sink',    x: 1080, y: 80,  status: 'idle' },
  { id: 'dashboard',label: 'ダッシュボード', kind: 'sink', x: 1080, y: 280, status: 'idle', productId: 'analytics' },
  { id: 'site',     label: 'FUJI-SAKE',  kind: 'sink',    x: 1080, y: 440, status: 'idle', productId: 'fuji-sake-site' },
];

export const initialEdges: FlowEdge[] = [
  { id: 'e1',  from: 'gmail',    to: 'classify', kind: 'data' },
  { id: 'e2',  from: 'classify', to: 'reply',    kind: 'data' },
  { id: 'e3',  from: 'reply',    to: 'send',     kind: 'trigger' },
  { id: 'e4',  from: 'calendar', to: 'schedule', kind: 'data' },
  { id: 'e5',  from: 'schedule', to: 'slack',    kind: 'trigger' },
  { id: 'e6',  from: 'classify', to: 'schedule', kind: 'data' },
  { id: 'e7',  from: 'projects', to: 'auto',     kind: 'data' },
  { id: 'e8',  from: 'auto',     to: 'logs',     kind: 'data' },
  { id: 'e9',  from: 'auto',     to: 'dashboard',kind: 'data' },
  { id: 'e10', from: 'logs',     to: 'site',     kind: 'data' },
  { id: 'e11', from: 'schedule', to: 'dashboard',kind: 'data' },
];
