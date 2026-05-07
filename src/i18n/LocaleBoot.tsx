/**
 * ハイドレーション前に <html data-locale> を確定させるためのインラインスクリプト。
 * これによって React マウント前に正しい言語の DOM だけが表示される（FOUC 防止）。
 *
 * <head> 内の最初の Server Component として置く。
 */
const SCRIPT = `(function(){
  try {
    var k = "fujisan-locale";
    var l = window.localStorage.getItem(k);
    if (l !== "en" && l !== "ja") {
      l = (navigator.language || "ja").toLowerCase().indexOf("ja") === 0 ? "ja" : "en";
    }
    var h = document.documentElement;
    h.setAttribute("data-locale", l);
    h.setAttribute("lang", l);
  } catch (e) {
    document.documentElement.setAttribute("data-locale", "ja");
  }
})();`;

export function LocaleBoot() {
  return (
    <script
      // pre-hydration script — must run synchronously before paint
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}
