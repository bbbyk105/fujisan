// カート操作のフィードバック用トースト。
// cart-store と同じくモジュールスコープの外部ストアで、useSyncExternalStore から購読する。
// 文言は <L> で出し分けるため ja/en を両方持つ。

// アクションはリンク遷移(href)かコールバック(onClick・「元に戻す」等)のどちらか。
export type ToastAction = {
  ja: string;
  en: string;
  href?: string;
  onClick?: () => void;
};

export type Toast = {
  id: number;
  ja: string;
  en: string;
  action?: ToastAction;
  /** 退場アニメーション中。true の間は DOM に残し、フェードアウトさせる。 */
  leaving?: boolean;
};

const EMPTY: Toast[] = [];
const TOAST_DURATION = 3200;
/** 退場アニメーションの長さ。globals.css の fujisan-toast-out と揃える。 */
const EXIT_DURATION = 320;
/** 同時表示の上限。超えたら古いものから捨てる。 */
const MAX_TOASTS = 3;

let toasts: Toast[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function clearTimer(id: number) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot(): Toast[] {
  return toasts;
}

export function getToastsServerSnapshot(): Toast[] {
  return EMPTY;
}

export function pushToast(toast: Omit<Toast, "id">) {
  const id = nextId++;
  let next = [...toasts, { ...toast, id }];
  // 上限超過分は古いものから破棄（タイマーも止める）。
  while (next.length > MAX_TOASTS) {
    const dropped = next[0];
    next = next.slice(1);
    clearTimer(dropped.id);
  }
  toasts = next;
  emit();
  const timer = setTimeout(() => dismissToast(id), TOAST_DURATION);
  timers.set(id, timer);
}

export function dismissToast(id: number) {
  clearTimer(id);
  const target = toasts.find((t) => t.id === id);
  // すでに退場中、または存在しない場合は何もしない（多重発火防止）。
  if (!target || target.leaving) return;
  // まず leaving を立ててフェードアウトさせ、アニメ後に実削除する。
  toasts = toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  const timer = setTimeout(() => removeToast(id), EXIT_DURATION);
  timers.set(id, timer);
}

function removeToast(id: number) {
  clearTimer(id);
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
