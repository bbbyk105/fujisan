import { ArrowLeft, ExternalLink, Play, Pause, Settings } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Product } from '@/types';

export function ProductDetail({ productId }: { productId: string }) {
  const { products, setSelectedNode } = useStore();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="h-full flex items-center justify-center text-ink-400">
        プロダクトが見つかりません
      </div>
    );
  }

  return (
    <section className="h-full flex flex-col overflow-hidden">
      {/* Gradient hero */}
      <div
        className={`flex-shrink-0 bg-gradient-to-br ${product.gradient} relative overflow-hidden`}
      >
        <div className="absolute inset-0 bg-ink-950/50" />
        <div className="relative px-6 py-8">
          <button
            onClick={() => setSelectedNode('home', 'home')}
            className="btn-ghost mb-4 text-ink-300 hover:text-ink-100"
          >
            <ArrowLeft size={14} />
            プロダクト ハブへ戻る
          </button>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-ink-300 mb-2">
                {product.category.toUpperCase()}
              </div>
              <h1 className="text-3xl font-bold text-ink-100 mb-2">{product.name}</h1>
              <p className="text-ink-300 max-w-2xl">{product.description}</p>
            </div>
            <div className="flex gap-2">
              {product.url && (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink size={14} />
                  開く
                </a>
              )}
              <button className="btn-ghost bg-white/10 text-ink-100 hover:bg-white/20">
                <Settings size={14} />
                設定
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="panel p-5">
            <div className="text-xs text-ink-400 mb-1">ステータス</div>
            <div className="text-base font-semibold">{product.status}</div>
          </div>
          <div className="panel p-5">
            <div className="text-xs text-ink-400 mb-1">カテゴリ</div>
            <div className="text-base font-semibold">{product.category}</div>
          </div>
          {product.stat && (
            <div className="panel p-5">
              <div className="text-xs text-ink-400 mb-1">{product.stat.label}</div>
              <div className="text-lg font-semibold tabular-nums">{product.stat.value}</div>
            </div>
          )}
        </div>

        <div className="panel p-6">
          <h2 className="text-sm font-semibold mb-3 text-ink-100">最近のアクティビティ</h2>
          <div className="text-sm text-ink-400 py-8 text-center border border-dashed border-white/5 rounded-lg">
            このプロダクトはまだ実装中です
            <br />
            <span className="text-xs mt-2 block opacity-70">
              統合ダッシュボードから起動・モニタリング・設定を一元管理します
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button className="panel p-4 hover:bg-white/5 text-left">
            <Play size={16} className="text-accent mb-2" />
            <div className="text-sm font-medium">起動</div>
            <div className="text-xs text-ink-400">アプリを開始</div>
          </button>
          <button className="panel p-4 hover:bg-white/5 text-left">
            <Pause size={16} className="text-accent mb-2" />
            <div className="text-sm font-medium">一時停止</div>
            <div className="text-xs text-ink-400">バックグラウンド</div>
          </button>
          <button className="panel p-4 hover:bg-white/5 text-left">
            <Settings size={16} className="text-accent mb-2" />
            <div className="text-sm font-medium">設定</div>
            <div className="text-xs text-ink-400">API キー・権限</div>
          </button>
          <button className="panel p-4 hover:bg-white/5 text-left">
            <ExternalLink size={16} className="text-accent mb-2" />
            <div className="text-sm font-medium">ログ</div>
            <div className="text-xs text-ink-400">実行履歴</div>
          </button>
        </div>
      </div>
    </section>
  );
}
