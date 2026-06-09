import {
  dismissToast,
  getToastsSnapshot,
  pushToast,
} from "@/lib/cart/toast-store";

// 退場アニメの長さ（toast-store の EXIT_DURATION 320ms より十分長く取る）
const EXIT = 400;

// 残存トーストを退場させ、ネストした「削除タイマー」まで消化して完全に空にする。
function resetToasts() {
  for (const t of [...getToastsSnapshot()]) dismissToast(t.id);
  jest.runAllTimers();
}

beforeEach(() => {
  jest.useFakeTimers();
  resetToasts();
});

afterEach(() => {
  // 実タイマーへ戻す前に、退場→削除のネストしたタイマーを全て消化しておく
  resetToasts();
  jest.useRealTimers();
});

describe("pushToast", () => {
  it("adds a toast with a generated id", () => {
    pushToast({ ja: "追加しました", en: "Added" });
    const toasts = getToastsSnapshot();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ ja: "追加しました", en: "Added" });
    expect(typeof toasts[0].id).toBe("number");
  });

  it("auto-dismisses after the timeout (incl. exit animation)", () => {
    pushToast({ ja: "消えます", en: "Bye" });
    expect(getToastsSnapshot()).toHaveLength(1);
    // 表示時間(3200ms) + 退場アニメ(320ms) を跨いで完全に消える
    jest.advanceTimersByTime(4000);
    expect(getToastsSnapshot()).toHaveLength(0);
  });

  it("caps the stack at three, dropping the oldest", () => {
    pushToast({ ja: "1", en: "1" });
    pushToast({ ja: "2", en: "2" });
    pushToast({ ja: "3", en: "3" });
    pushToast({ ja: "4", en: "4" });
    const toasts = getToastsSnapshot();
    expect(toasts).toHaveLength(3);
    expect(toasts.map((t) => t.ja)).toEqual(["2", "3", "4"]);
  });

  it("keeps a stable snapshot reference between mutations", () => {
    pushToast({ ja: "a", en: "a" });
    const first = getToastsSnapshot();
    expect(getToastsSnapshot()).toBe(first);
  });
});

describe("dismissToast", () => {
  it("marks the toast as leaving first, then removes it after the exit animation", () => {
    pushToast({ ja: "1", en: "1" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    // 退場アニメ中は DOM に残す（leaving フラグ付きで存在）
    const during = getToastsSnapshot();
    expect(during).toHaveLength(1);
    expect(during[0].leaving).toBe(true);
    // アニメ後に実削除
    jest.advanceTimersByTime(EXIT);
    expect(getToastsSnapshot()).toHaveLength(0);
  });

  it("removes only the matching toast", () => {
    pushToast({ ja: "1", en: "1" });
    pushToast({ ja: "2", en: "2" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    jest.advanceTimersByTime(EXIT);
    const toasts = getToastsSnapshot();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].ja).toBe("2");
  });

  it("does not re-fire the auto-dismiss timer after manual dismiss", () => {
    pushToast({ ja: "1", en: "1" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    jest.advanceTimersByTime(EXIT);
    expect(getToastsSnapshot()).toHaveLength(0);
    // 元の自動タイマーは clearTimer 済みなので、その後も再発火しない
    jest.advanceTimersByTime(4000);
    expect(getToastsSnapshot()).toHaveLength(0);
  });

  it("is idempotent — a second dismiss during the exit does nothing", () => {
    pushToast({ ja: "1", en: "1" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    dismissToast(a.id); // 退場中の二重発火は無視される
    expect(getToastsSnapshot()).toHaveLength(1);
    jest.advanceTimersByTime(EXIT);
    expect(getToastsSnapshot()).toHaveLength(0);
  });
});
