import {
  dismissToast,
  getToastsSnapshot,
  pushToast,
} from "@/lib/cart/toast-store";

function drain() {
  for (const t of [...getToastsSnapshot()]) dismissToast(t.id);
}

beforeEach(() => {
  jest.useFakeTimers();
  drain();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
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

  it("auto-dismisses after the timeout", () => {
    pushToast({ ja: "消えます", en: "Bye" });
    expect(getToastsSnapshot()).toHaveLength(1);
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
  it("removes only the matching toast", () => {
    pushToast({ ja: "1", en: "1" });
    pushToast({ ja: "2", en: "2" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    const toasts = getToastsSnapshot();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].ja).toBe("2");
  });

  it("does not re-fire the timer after manual dismiss", () => {
    pushToast({ ja: "1", en: "1" });
    const [a] = getToastsSnapshot();
    dismissToast(a.id);
    expect(getToastsSnapshot()).toHaveLength(0);
    jest.advanceTimersByTime(4000);
    expect(getToastsSnapshot()).toHaveLength(0);
  });
});
