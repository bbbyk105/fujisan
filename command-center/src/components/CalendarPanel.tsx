import { useEffect } from 'react';
import { Calendar, MapPin, Users, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { mockEvents } from '@/lib/mock';

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return '今日';
  if (target.getTime() === tomorrow.getTime()) return '明日';
  return d.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' });
}

export function CalendarPanel() {
  const { events, setEvents } = useStore();

  useEffect(() => {
    async function load() {
      if (window.api?.calendar) {
        try {
          const data = await window.api.calendar.list();
          setEvents(data);
          return;
        } catch {
          // fall through to mock
        }
      }
      setEvents(mockEvents);
    }
    load();
  }, [setEvents]);

  const grouped = events.reduce<Record<string, typeof events>>((acc, ev) => {
    const key = fmtDate(ev.start);
    (acc[key] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <section className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-accent" />
          <h2 className="text-sm font-semibold">カレンダー</h2>
          <span className="text-xs text-ink-400">{events.length} 件の予定</span>
        </div>
        <button className="btn-ghost" aria-label="再読込">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Object.entries(grouped).map(([day, list]) => (
          <div key={day}>
            <div className="text-[11px] uppercase tracking-wider text-ink-400 mb-2 px-1">
              {day}
            </div>
            <div className="space-y-1.5">
              {list.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg p-3 bg-white/[0.03] hover:bg-white/[0.06]
                             border border-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-ink-100">{e.summary}</div>
                    <div className="text-xs tabular-nums text-ink-300">
                      {fmtTime(e.start)} – {fmtTime(e.end)}
                    </div>
                  </div>
                  {(e.location || (e.attendees && e.attendees.length > 0)) && (
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-ink-400">
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {e.location}
                        </span>
                      )}
                      {e.attendees && e.attendees.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {e.attendees.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
