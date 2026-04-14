import { useEffect, useState } from 'react';
import { Mail, Circle, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import { mockMails } from '@/lib/mock';

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  return `${day}日前`;
}

function extractName(from: string) {
  const match = from.match(/^(.+?)\s*<.+>$/);
  return match ? match[1].replace(/"/g, '') : from;
}

export function MailPanel() {
  const { mails, setMails } = useStore();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (window.api?.gmail) {
        try {
          const data = await window.api.gmail.list({ maxResults: 20 });
          setMails(data);
          return;
        } catch {
          // fall through
        }
      }
      setMails(mockMails);
    }
    load();
  }, [setMails]);

  const unreadCount = mails.filter((m) => m.unread).length;

  return (
    <section className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-accent" />
          <h2 className="text-sm font-semibold">メール</h2>
          {unreadCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent">
              {unreadCount} 件未読
            </span>
          )}
        </div>
        <button className="btn-ghost" aria-label="再読込">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-white/5">
        {mails.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelected(m.id === selected ? null : m.id)}
            className={`px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors
                        ${selected === m.id ? 'bg-white/[0.05]' : ''}`}
          >
            <div className="flex items-start gap-2">
              {m.unread ? (
                <Circle
                  size={8}
                  className="mt-1.5 fill-accent text-accent flex-shrink-0"
                />
              ) : (
                <span className="w-2 mt-1.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm truncate ${
                      m.unread ? 'font-semibold text-ink-100' : 'text-ink-300'
                    }`}
                  >
                    {extractName(m.from)}
                  </span>
                  <span className="text-xs text-ink-400 tabular-nums flex-shrink-0">
                    {fmtRelative(m.date)}
                  </span>
                </div>
                <div
                  className={`text-sm truncate ${
                    m.unread ? 'text-ink-100' : 'text-ink-300'
                  }`}
                >
                  {m.subject}
                </div>
                <div className="text-xs text-ink-400 truncate mt-0.5">{m.snippet}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
