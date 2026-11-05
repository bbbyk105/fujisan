/**
 * カートからログイン・新規登録へ行って戻ったときに、そのまま決済へ進むための目印。
 *
 * 20 歳以上の確認は省けないので、カートで確認した事実だけをタブの中に残す。
 * `sessionStorage` なのでタブを閉じれば消え、読んだら消すので 1 回しか使えない。
 * 戻ってこなかったときに残り続けないよう、時間でも切る。
 */
export const CHECKOUT_RESUME_PATH = "/cart?resume=checkout";

const AGE_CONFIRMED_KEY = "fujisan-checkout-age-confirmed";

/** 確認の記録を使える時間。ログインや登録を終えて戻るのに足りる長さにする。 */
const AGE_CONFIRMED_TTL_MS = 30 * 60 * 1000;

export function rememberAgeConfirmed(): void {
  sessionStorage.setItem(AGE_CONFIRMED_KEY, String(Date.now()));
}

/** 確認の記録を読み、同時に消す。 */
export function takeAgeConfirmed(): boolean {
  const confirmedAt = Number(sessionStorage.getItem(AGE_CONFIRMED_KEY));
  sessionStorage.removeItem(AGE_CONFIRMED_KEY);
  return confirmedAt > 0 && Date.now() - confirmedAt <= AGE_CONFIRMED_TTL_MS;
}
