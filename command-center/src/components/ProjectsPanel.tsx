import { Box, ArrowRight, Clock } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Project } from '@/types';

const statusStyle: Record<Project['status'], { label: string; className: string }> = {
  active: { label: '進行中', className: 'bg-emerald-500/15 text-emerald-400' },
  paused: { label: '保留', className: 'bg-ink-500/15 text-ink-300' },
  review: { label: 'レビュー', className: 'bg-accent/15 text-accent' },
  done: { label: '完了', className: 'bg-sky-500/15 text-sky-400' },
};

function fmtDeadline(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const diff = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const label = d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  if (diff < 0) return { label, hint: `${-diff}日超過`, urgent: true };
  if (diff <= 3) return { label, hint: `あと${diff}日`, urgent: true };
  return { label, hint: `あと${diff}日`, urgent: false };
}

export function ProjectsPanel() {
  const projects = useStore((s) => s.projects);

  return (
    <section className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Box size={16} className="text-accent" />
          <h2 className="text-sm font-semibold">進行中のプロジェクト</h2>
          <span className="text-xs text-ink-400">{projects.length} 件</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-1 xl:grid-cols-2 gap-2.5 auto-rows-min">
        {projects.map((p) => {
          const deadline = fmtDeadline(p.deadline);
          const style = statusStyle[p.status];
          return (
            <div
              key={p.id}
              className="group rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.06]
                         p-4 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-semibold text-ink-100 leading-snug flex-1">
                  {p.name}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.className}`}>
                  {style.label}
                </span>
              </div>

              {p.nextAction && (
                <div className="flex items-center gap-1.5 text-xs text-ink-300 mb-3">
                  <ArrowRight size={12} className="text-accent" />
                  <span className="truncate">{p.nextAction}</span>
                </div>
              )}

              <div className="mb-2">
                <div className="flex items-center justify-between text-[11px] text-ink-400 mb-1">
                  <span>進捗</span>
                  <span className="tabular-nums">{p.progress}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1 flex-wrap">
                  {p.tags?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-ink-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                {deadline && (
                  <div
                    className={`flex items-center gap-1 text-[11px] ${
                      deadline.urgent ? 'text-red-400' : 'text-ink-400'
                    }`}
                  >
                    <Clock size={11} />
                    <span>{deadline.hint}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
