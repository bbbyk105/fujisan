import { Search, Plus, Bell, Settings } from 'lucide-react';
import { useStore } from '@/lib/store';

export function TopBar() {
  const setToggleNewMenu = useStore((s) => s.setToggleNewMenu);
  const toggleNewMenu = useStore((s) => s.toggleNewMenu);

  return (
    <header className="titlebar-drag h-12 flex items-center border-b border-white/5 bg-ink-900/40 backdrop-blur-xl px-4 gap-3">
      <div className="titlebar-no-drag flex-1 flex items-center gap-2">
        <div className="flex items-center gap-2 flex-1 max-w-xl px-3 py-1.5 bg-white/5 rounded-lg text-sm text-ink-300">
          <Search size={14} />
          <input
            className="flex-1 bg-transparent outline-none placeholder:text-ink-400"
            placeholder="メール・イベント・プロジェクトを検索…"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-ink-400">⌘K</kbd>
        </div>
      </div>

      <div className="titlebar-no-drag flex items-center gap-2">
        <button
          className="btn-primary"
          onClick={() => setToggleNewMenu(!toggleNewMenu)}
        >
          <Plus size={14} />
          新規
        </button>
        <button className="btn-ghost" aria-label="通知">
          <Bell size={16} />
        </button>
        <button className="btn-ghost" aria-label="設定">
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
