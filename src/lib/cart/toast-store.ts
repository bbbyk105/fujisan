// カート操作のフィードバック用トースト。
// cart-store と同じくモジュールスコープの外部ストアで、useSyncExternalStore から購読する。
// 文言は <L> で出し分けるため ja/en を両方持つ。

export type ToastAction = { href: string; ja: string; en: string };

export type Toast = {
  id: number;
  ja: string;
  en: string;
  action?: ToastAction;
};

const EMPTY: Toast[] = [];
const TOAST_DURATION = 3200;

let toasts: Toast[] = EMPTY;
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

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
  toasts = [...toasts, { ...toast, id }];
  emit();
  const timer = setTimeout(() => dismissToast(id), TOAST_DURATION);
  timers.set(id, timer);
}

export function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
