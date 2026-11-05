/** パスの解釈に使うだけの、実在しない基点。 */
const BASE = "https://sakefujisan.invalid";

/**
 * ログイン後の戻り先として使ってよいサイト内のパスを返す。使えない値は null。
 *
 * 戻り先は URL から読むので、誰でも細工したリンクを踏ませられる。本物のログイン画面を
 * 通したあとに偽サイトへ飛ばす詐欺や、`javascript:` の実行に使われないよう、
 * ブラウザと同じ解釈で確かめる（`/\evil.example` は `//evil.example` として扱われる）。
 *
 * 返すのは正規化したあとの値なので、それが `//` で始まらないことまで見る。
 * `/.//evil.example` のように、解釈の時点では同じサイトでも正規化で外へ出るものがある。
 */
export function safeRedirectPath(
  value: string | null | undefined,
): string | null {
  // Server Action からも呼ぶので、型どおりの値が来るとは限らない。
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE || url.pathname.startsWith("//")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** パスに戻り先を付ける。使えない戻り先は付けない。 */
export function withRedirect(
  path: string,
  redirect: string | null | undefined,
): string {
  const safe = safeRedirectPath(redirect);
  if (!safe) return path;
  return `${path}${path.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(safe)}`;
}
