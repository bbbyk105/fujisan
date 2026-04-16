import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Sparkles, Send, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { eventBus } from '@/lib/event-bus';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
  error?: string;
}

const SUGGESTIONS = [
  'Gmail の未読を要約して',
  '今日の予定で空いてる時間は？',
  'FUJI-SAKE サイトの次のステップは？',
  'プロジェクトの優先順位を提案して',
];

export function AIAssistantPanel() {
  const { setSelectedNode } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.api?.claude) {
      window.api.claude.available().then(setAvailable);
    } else {
      setAvailable(false);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => cleanupRef.current?.(), []);

  function send(text: string) {
    if (!text.trim() || streaming) return;
    if (!window.api?.claude) {
      setMessages((m) => [
        ...m,
        {
          id: `e-${Date.now()}`,
          role: 'assistant',
          content: '',
          error: 'Claude API はデスクトップアプリ起動時のみ利用できます (Electron 必須)',
        },
      ]);
      return;
    }

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };
    const next = [...messages, userMsg, assistantMsg];
    setMessages(next);
    setInput('');
    setStreaming(true);

    eventBus.emit('ai.request', 'ai-assistant', { payload: { prompt: text } });

    const requestId = `r-${Date.now()}`;
    const history = next
      .filter((m) => !m.streaming && !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    cleanupRef.current = window.api.claude.chatStream(requestId, history, {
      onDelta: (delta) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        );
      },
      onDone: ({ text: finalText, usage }) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: finalText || m.content, streaming: false }
              : m,
          ),
        );
        setStreaming(false);
        eventBus.emit('ai.response', 'ai-assistant', { payload: { usage } });
      },
      onError: (errMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, error: errMsg, streaming: false } : m)),
        );
        setStreaming(false);
        eventBus.emit('ai.error', 'ai-assistant', { payload: { error: errMsg } });
      },
    });
  }

  return (
    <section className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedNode('home', 'home')}
            className="btn-ghost"
            aria-label="戻る"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <Sparkles size={16} className="text-ink-100" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-ink-100">AI アシスタント</h1>
            <div className="text-[10px] text-ink-400 uppercase tracking-wider">
              Claude Opus 4.6 · adaptive thinking
            </div>
          </div>
        </div>
        {available === false && (
          <div className="flex items-center gap-2 text-[11px] text-accent">
            <AlertCircle size={12} />
            ANTHROPIC_API_KEY 未設定
          </div>
        )}
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-4">
              <Sparkles size={28} className="text-ink-100" />
            </div>
            <h2 className="text-xl font-semibold text-ink-100 mb-2">何をお手伝いしましょう？</h2>
            <p className="text-sm text-ink-400 mb-8 max-w-md">
              Command Center 内のすべてのデータと連携した AI アシスタント
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-4 py-3 rounded-[10px] border border-white/5 bg-white/[0.03]
                             hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-150 text-sm text-ink-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-end gap-2 panel px-4 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="メッセージを入力 (⌘+Enter で送信)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-ink-100
                       placeholder:text-ink-400 max-h-32"
            style={{ minHeight: '20px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {streaming ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </form>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (message.error) {
    return (
      <div className="flex items-start gap-2 max-w-3xl">
        <AlertCircle size={16} className="text-red-400 mt-1 flex-shrink-0" />
        <div className="rounded-[10px] border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
          {message.error}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-2xl rounded-[10px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap
                    ${
                      isUser
                        ? 'bg-accent/15 border border-accent/20 text-ink-100'
                        : 'bg-white/[0.03] border border-white/5 text-ink-200'
                    }`}
      >
        {message.content || (message.streaming ? <StreamingDots /> : '')}
        {message.streaming && message.content && (
          <span className="inline-block w-1.5 h-3.5 bg-accent ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-ink-400 animate-pulse" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
