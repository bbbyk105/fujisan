/**
 * 送信時に、フォーム内で最初（DOM 上＝最上部）の不正な項目までスムーズスクロールし、
 * フォーカスを当てる。複数エラーがあっても一番上の項目へ移動する。
 * setState 直後に呼ぶ想定で、再レンダリング後の DOM を待つため requestAnimationFrame を使う。
 */
export function scrollToFirstError(form: HTMLFormElement | null) {
  if (!form) return;
  requestAnimationFrame(() => {
    const el = form.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  });
}
