import {
  Wine,
  Mail,
  Calendar,
  Sparkles,
  BarChart3,
  Palette,
  Zap,
  Users,
  Plus,
  ArrowUpRight,
  Play,
  type LucideIcon,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Product, ProductStatus } from '@/types';
import { FlowCanvas } from './FlowCanvas';

const iconMap: Record<string, LucideIcon> = {
  wine: Wine,
  mail: Mail,
  'calendar-sync': Calendar,
  sparkles: Sparkles,
  'bar-chart': BarChart3,
  palette: Palette,
  zap: Zap,
  users: Users,
};

const statusBadge: Record<ProductStatus, { label: string; className: string; dot: string }> = {
  active: {
    label: '稼働中',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    dot: 'bg-emerald-400 animate-pulse',
  },
  development: {
    label: '開発中',
    className: 'bg-accent/15 text-accent border-accent/20',
    dot: 'bg-accent',
  },
  planned: {
    label: '計画中',
    className: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
    dot: 'bg-sky-400',
  },
  paused: {
    label: '保留',
    className: 'bg-ink-500/15 text-ink-300 border-ink-500/20',
    dot: 'bg-ink-400',
  },
};

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const Icon = iconMap[product.icon] ?? Wine;
  const badge = statusBadge[product.status];

  return (
    <button
      onClick={onOpen}
      className="group relative text-left rounded-[10px] border border-white/5 bg-white/[0.03]
                 hover:bg-white/[0.06] hover:border-white/10 transition-colors duration-150 p-4 overflow-hidden"
    >
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${product.gradient}`} />

      <div className="flex items-start justify-between mb-3">
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${product.gradient}`}
        >
          <Icon size={18} className="text-ink-100" />
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border ${badge.className}`}
        >
          <span className={`w-1 h-1 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-ink-100 mb-1 flex items-center gap-1">
        {product.name}
        <ArrowUpRight
          size={12}
          className="text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </h3>
      <p className="text-[11px] text-ink-400 leading-snug line-clamp-2 min-h-[2.2em]">
        {product.description}
      </p>

      {product.stat && (
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5 text-[11px]">
          <span className="text-ink-400">{product.stat.label}</span>
          <span className="text-ink-100 font-semibold tabular-nums">{product.stat.value}</span>
        </div>
      )}
    </button>
  );
}

function AddProductCard({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="group rounded-[10px] border border-dashed border-white/10 hover:border-accent/40
                 hover:bg-accent/5 transition-colors duration-150 p-4 flex flex-col items-center justify-center
                 text-ink-400 hover:text-accent"
    >
      <Plus size={16} className="mb-1" />
      <div className="text-xs font-semibold">追加</div>
    </button>
  );
}

export function ProductLauncher() {
  const { products, setSelectedNode, addProduct } = useStore();

  const handleOpen = (p: Product) => {
    setSelectedNode(`product:${p.id}`, 'product', p.id);
  };

  const handleAdd = () => {
    const name = prompt('プロダクト名を入力:');
    if (!name) return;
    const description = prompt('簡単な説明:') || '';
    addProduct({
      id: `custom-${Date.now()}`,
      name,
      description,
      status: 'planned',
      gradient: 'from-slate-500 to-zinc-700',
      icon: 'wine',
      category: 'ops',
    });
  };

  const counts = products.reduce<Record<ProductStatus, number>>(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    { active: 0, development: 0, planned: 0, paused: 0 },
  );

  return (
    <section className="h-full flex flex-col overflow-hidden">
      {/* Hero header */}
      <div className="flex-shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-accent">
              Command Center
            </div>
            <h1 className="text-2xl font-bold text-ink-100 tracking-tight">プロダクト ハブ</h1>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-ink-300">稼働 {counts.active}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-ink-300">開発 {counts.development}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span className="text-ink-300">計画 {counts.planned}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flow canvas (hero) */}
      <div className="flex-shrink-0 mx-6 rounded-2xl border border-white/5 bg-ink-900/40 backdrop-blur-xl relative overflow-hidden" style={{ height: '52%' }}>
        <FlowCanvas />
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            全プロダクト
          </h2>
          <span className="text-[11px] text-ink-400">{products.length} 件</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={() => handleOpen(p)} />
          ))}
          <AddProductCard onAdd={handleAdd} />
        </div>
      </div>
    </section>
  );
}
