import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Inbox,
  Calendar,
  Tag,
  Archive,
  ChevronRight,
  ChevronDown,
  Box,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { TreeNode } from '@/types';

const iconMap = {
  folder: Folder,
  project: Box,
  tag: Tag,
  inbox: Inbox,
  calendar: Calendar,
  archive: Archive,
} as const;

function TreeItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 1);
  const { selectedNodeId, setSelectedNodeId } = useStore();
  const hasChildren = !!node.children?.length;
  const Icon = hasChildren && open ? FolderOpen : iconMap[node.icon ?? 'folder'];
  const active = selectedNodeId === node.id;

  return (
    <div>
      <div
        className={`tree-item ${active ? 'active' : ''}`}
        style={{ paddingLeft: depth * 12 + 8 }}
        onClick={() => {
          if (hasChildren) setOpen((o) => !o);
          setSelectedNodeId(node.id);
        }}
      >
        <span className="w-4 flex items-center justify-center">
          {hasChildren ? (
            open ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )
          ) : (
            <span className="block w-3" />
          )}
        </span>
        <Icon
          size={14}
          className={active ? 'text-accent' : 'text-ink-400'}
          style={node.meta?.color ? { color: node.meta.color } : undefined}
        />
        <span className="flex-1 truncate">{node.label}</span>
        {node.meta?.count !== undefined && (
          <span className="text-xs text-ink-400 tabular-nums">{node.meta.count}</span>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {node.children!.map((c) => (
            <TreeItem key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const tree = useStore((s) => s.tree);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-white/5 bg-ink-900/60 backdrop-blur-xl flex flex-col">
      <div className="titlebar-drag h-10 flex items-center px-4">
        <div className="flex items-center gap-2 titlebar-no-drag">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-accent-muted flex items-center justify-center text-xs font-bold text-ink-950">
            富
          </div>
          <span className="text-sm font-semibold text-ink-100">Command Center</span>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {tree.map((n) => (
          <TreeItem key={n.id} node={n} />
        ))}
      </nav>
      <div className="px-3 py-3 border-t border-white/5 text-[11px] text-ink-400">
        <div className="flex justify-between">
          <span>同期済み</span>
          <span className="tabular-nums">
            {new Date().toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </aside>
  );
}
