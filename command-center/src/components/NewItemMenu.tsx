import { useEffect, useRef } from 'react';
import { Mail, CalendarPlus, FolderPlus, CheckSquare, Zap } from 'lucide-react';
import { useStore } from '@/lib/store';

const actions = [
  { id: 'mail', icon: Mail, label: 'メール下書き', hint: 'Gmail 新規' },
  { id: 'event', icon: CalendarPlus, label: '予定を追加', hint: 'Calendar' },
  { id: 'project', icon: FolderPlus, label: 'プロジェクト', hint: '新規作成' },
  { id: 'task', icon: CheckSquare, label: 'タスク', hint: 'Todo' },
  { id: 'automation', icon: Zap, label: '自動化ルール', hint: 'If / Then' },
];

export function NewItemMenu() {
  const { toggleNewMenu, setToggleNewMenu, addProject } = useStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (toggleNewMenu && ref.current && !ref.current.contains(e.target as Node)) {
        setToggleNewMenu(false);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [toggleNewMenu, setToggleNewMenu]);

  if (!toggleNewMenu) return null;

  function handle(id: string) {
    if (id === 'project') {
      const name = prompt('プロジェクト名を入力:');
      if (name) {
        addProject({
          id: `p-${Date.now()}`,
          name,
          status: 'active',
          progress: 0,
          nextAction: '最初のステップを決める',
          tags: [],
        });
      }
    } else {
      alert(`"${id}" の作成フローはここで起動します（今後実装）`);
    }
    setToggleNewMenu(false);
  }

  return (
    <div
      ref={ref}
      className="absolute right-4 top-14 z-50 w-64 panel animate-slide-up py-2"
    >
      <div className="px-3 py-2 text-xs text-ink-400 uppercase tracking-wider">新規作成</div>
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={() => handle(a.id)}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5 text-left"
        >
          <a.icon size={16} className="text-accent" />
          <span className="flex-1 text-ink-100">{a.label}</span>
          <span className="text-xs text-ink-400">{a.hint}</span>
        </button>
      ))}
    </div>
  );
}
