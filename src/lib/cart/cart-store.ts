import {
  CART_STORAGE_KEY,
  addLine,
  normalizeLines,
  removeLine,
  setLineQty,
  type CartLine,
} from "./cart-core";

// localStorage を裏付けにしたモジュールスコープの外部ストア。
// useSyncExternalStore（useLocale / AgeGate と同じ流儀）から購読する。
// サーバーでは window に触れず、state は常に EMPTY のままなのでリクエスト間で漏れない。

const EMPTY: CartLine[] = [];

let state: CartLine[] = EMPTY;
let initialized = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function readStored(value: string | null): CartLine[] {
  if (!value) return EMPTY;
  try {
    const parsed = normalizeLines(JSON.parse(value));
    return parsed.length ? parsed : EMPTY;
  } catch {
    return EMPTY;
  }
}

function ensureInit() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  state = readStored(window.localStorage.getItem(CART_STORAGE_KEY));
  // 別タブでの変更を同期
  window.addEventListener("storage", (e) => {
    if (e.key !== CART_STORAGE_KEY) return;
    state = readStored(e.newValue);
    emit();
  });
}

function commit(next: CartLine[]) {
  state = next;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量超過などは無視
  }
  emit();
}

export function subscribeCart(listener: () => void): () => void {
  ensureInit();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 現在のカート行。参照は変更時のみ差し替わる（useSyncExternalStore 用に安定）。 */
export function getCartSnapshot(): CartLine[] {
  return state;
}

/** SSR/初回ハイドレーションでは常に空（不整合を避ける）。 */
export function getCartServerSnapshot(): CartLine[] {
  return EMPTY;
}

/** localStorage 読込み済みか。SSR では false。 */
export function getReadySnapshot(): boolean {
  return initialized;
}

export function getReadyServerSnapshot(): boolean {
  return false;
}

export function addToCart(slug: string, qty = 1) {
  ensureInit();
  commit(addLine(state, slug, qty));
}

export function setCartQty(slug: string, qty: number) {
  ensureInit();
  commit(setLineQty(state, slug, qty));
}

export function removeFromCart(slug: string) {
  ensureInit();
  commit(removeLine(state, slug));
}

export function clearCart() {
  ensureInit();
  commit(EMPTY);
}
