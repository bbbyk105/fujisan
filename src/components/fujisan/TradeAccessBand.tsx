import Link from "next/link";
import { getSession } from "@/lib/session";
import { canSeeWholesalePricing } from "@/lib/trade";
import { L } from "@/i18n/Localized";

/**
 * /shop/business 上部の取扱店アクセス帯。
 * ログイン状態と **審査状況** で表示を出し分ける（承認前に「下記に卸価格を
 * 表示しています」と書くと、実際には出ていないので混乱させる）。
 *
 * 帯は塗らず、上下の罫だけで本文と切る。ここで濃色を敷くと、ページの
 * 導入より先に「広告」が来たように読める。
 */
export async function TradeAccessBand() {
  const session = await getSession();
  const user = session?.user as
    | { id?: string; role?: string; companyName?: string | null; name?: string }
    | undefined;
  const isBusiness = user?.role === "business";
  const approved = await canSeeWholesalePricing(session);

  if (isBusiness) {
    const who = user?.companyName || user?.name || "";
    return (
      <section className="border-y border-[var(--ed-rule)] bg-paper-tint/50">
        <div className="ed-wrap flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
          <p className="ed-p text-[13px] md:text-[13.5px]">
            <span className="ed-label mr-3 inline">
              {approved ? (
                <L en="Trade account" ja="取扱店ログイン中" />
              ) : (
                <L en="Under review" ja="審査中" />
              )}
            </span>
            {approved ? (
              <L
                en={`Signed in as ${who || "your account"} — wholesale pricing is shown below.`}
                ja={`${who ? `${who}さま。` : ""}下に卸価格を表示しています。`}
              />
            ) : (
              <L
                en={`Signed in as ${who || "your account"} — wholesale pricing appears once your account has been approved.`}
                ja={`${who ? `${who}さま。` : ""}卸価格は、審査が済むと表示されます。`}
              />
            )}
          </p>
          <Link href="/account" className="ed-link shrink-0 text-[13px]">
            <L en="Your account" ja="アカウント" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-[var(--ed-rule)] bg-paper-tint/50">
      <div className="ed-wrap flex flex-col gap-5 py-7 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="ed-label">
            <L en="For the trade" ja="取扱店の方へ" />
          </p>
          <p className="ed-p mt-2 text-[13.5px] md:text-[14px]">
            <L
              en="Sign in to view wholesale pricing."
              ja="ログインすると、卸価格をご覧いただけます。"
            />
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-8 gap-y-3">
          <Link
            href="/login/business?redirect=/shop/business"
            className="ed-btn"
          >
            <L en="Trade sign in" ja="取扱店ログイン" />
          </Link>
          <Link href="/register/business" className="ed-link text-[13px]">
            <L en="Open an account" ja="新規登録" />
          </Link>
        </div>
      </div>
    </section>
  );
}
