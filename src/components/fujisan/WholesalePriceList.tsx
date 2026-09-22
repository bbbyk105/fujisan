import Link from "next/link";
import { fujisanProducts } from "@/data/fujisan-products";
import { getSession } from "@/lib/session";
import { readTradeAccount } from "@/lib/trade";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

/**
 * 卸価格表。
 *
 * **表示の条件は「role が business」ではなく「審査が approved」**。
 * 登録は自己申告なので、role だけを条件にすると誰でも卸価格を見られる。
 * 審査状況の取得に失敗したときは見せない側に倒す（価格は一度見られたら
 * 取り消せない）。
 */
export async function WholesalePriceList() {
  const session = await getSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  const isBusiness = user?.role === "business" && Boolean(user.id);

  let status: "approved" | "rejected" | "pending" | null = null;
  if (isBusiness && user?.id) {
    try {
      const account = await readTradeAccount(user.id);
      // 行が無い（この機能より前に登録した）法人は審査待ちとして扱う。
      status = account?.status ?? "pending";
    } catch {
      status = "pending";
    }
  }

  if (isBusiness && status !== "approved") {
    return <UnderReviewPanel rejected={status === "rejected"} />;
  }

  if (!isBusiness) {
    return (
      <div className="relative overflow-hidden border border-[#0B1A2E]/14 bg-[#F1E6CB]/45 px-7 py-14 text-center md:px-12 md:py-20">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          className="mx-auto h-6 w-6 text-[#C9A84C]"
        >
          <rect x="5" y="11" width="14" height="9" rx="1" />
          <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        </svg>
        <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
          ― ログインで卸価格を表示 ―
        </span>
        <h3 className="mx-auto mt-4 max-w-[520px] font-serif text-[clamp(20px,2.2vw,28px)] font-semibold leading-[1.3] tracking-[0.05em] text-[#0B1A2E]">
          <L
            en="Wholesale pricing is shown to signed-in trade accounts."
            ja="卸価格は、ログインした取扱店のみに表示されます。"
          />
        </h3>
        <p className="mx-auto mt-4 max-w-[460px] text-[13px] leading-[1.8] text-[#1D2432]/72">
          <L
            en="Sign in to your trade account to see per-bottle and per-case pricing, or open a new account in a couple of minutes."
            ja="取扱店アカウントにログインすると、1本・1ケースあたりの卸価格をご覧いただけます。新規登録も数分で完了します。"
          />
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/login/business?redirect=/shop/business"
            className="inline-flex w-full max-w-[260px] items-center justify-center border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-paper-card no-underline transition-colors hover:bg-[#16273d] sm:w-auto"
          >
            <L en="TRADE SIGN IN" ja="取扱店ログイン" />
          </Link>
          <Link
            href="/register/business"
            className="inline-flex w-full max-w-[260px] items-center justify-center border border-[#0B1A2E]/30 bg-transparent px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[#0B1A2E]/80 no-underline transition-colors hover:border-[#0B1A2E]/60 hover:text-[#0B1A2E] sm:w-auto"
          >
            <L en="OPEN AN ACCOUNT" ja="新規登録" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="border border-[#0B1A2E]/14 bg-paper-card">
        {/* Header row — モバイルでも出して列の意味を常に示す */}
        <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-5 border-b border-[#0B1A2E]/14 px-4 py-3.5 sm:gap-x-8 sm:px-6">
          <span className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/60">
            <L en="PRODUCT" ja="銘柄" />
          </span>
          <span className="text-right text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]/60">
            <L en="PER BOTTLE" ja="1本" />
          </span>
          <span className="text-right text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E]/60">
            <L en="PER CASE" ja="1ケース" />
          </span>
        </div>

        {fujisanProducts.map((p, pi) => (
          <div key={p.slug} className={pi > 0 ? "border-t border-[#0B1A2E]/14" : ""}>
            {/* 銘柄のグループヘッダー */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 bg-[#F1E6CB]/50 px-4 py-3 sm:px-6">
              <span className="font-serif text-[13.5px] font-semibold tracking-[0.12em] text-[#0B1A2E]">
                {p.name} · {p.variant.replace(/\n/g, " ")}
              </span>
              <span className="font-jp text-[10.5px] tracking-[0.18em] text-[#C9A84C]/90">
                {p.variantJp} ／ {p.variantLineJp}
              </span>
            </div>
            {p.volumes.map((v) => (
              <div
                key={`${p.slug}-${v.ml}`}
                className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-5 border-t border-[#0B1A2E]/8 px-4 py-4 transition-colors duration-150 hover:bg-[#F1E6CB]/35 sm:gap-x-8 sm:px-6"
              >
                <span className="text-[12px] tracking-[0.1em] text-[#0B1A2E]/70">
                  {v.ml} ml
                </span>
                <span className="text-right font-serif text-[15px] text-[#0B1A2E]">
                  {yen(v.wholesalePriceJpy)}
                </span>
                <span className="text-right font-serif text-[15px] text-[#0B1A2E]">
                  {yen(v.wholesalePriceJpy * v.caseSize)}
                  <span className="ml-1.5 align-baseline text-[10px] tracking-[0.06em] text-[#0B1A2E]/55">
                    ×{v.caseSize}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-6 text-[11px] leading-[1.7] text-[#0B1A2E]/55">
        <L
          en="Prices are per bottle (300 ml / 180 ml as listed), excluding tax, for reference (estimated CIF, Asia region). MOQ 3,000 bottles per shipment, mixed SKUs allowed — contact your trade desk for a formal quote."
          ja="価格は1本あたり（300ml／180ml）・税抜の参考価格です（アジア向け CIF 概算）。最小ロットは1出荷あたり3,000本（銘柄混載可）。正式なお見積りは担当窓口までご相談ください。"
        />
      </p>
    </div>
  );
}

/** 登録済みだが、まだ承認されていない（または見送られた）取扱店への表示。 */
function UnderReviewPanel({ rejected }: { rejected: boolean }) {
  return (
    <div className="border border-[#0B1A2E]/14 bg-[#F1E6CB]/45 px-7 py-14 text-center md:px-12 md:py-20">
      <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
        {rejected ? "― お取引について ―" : "― 審査中 ―"}
      </span>
      <h3 className="mx-auto mt-4 max-w-[560px] font-serif text-[clamp(20px,2.2vw,28px)] font-semibold leading-[1.3] tracking-[0.05em] text-[#0B1A2E]">
        {rejected ? (
          <L
            en="This account is not currently open for trade pricing."
            ja="現在、このアカウントでは卸価格をご案内しておりません。"
          />
        ) : (
          <L
            en="Your trade account is under review."
            ja="取扱口座の審査を承っております。"
          />
        )}
      </h3>
      <p className="mx-auto mt-4 max-w-[520px] text-[13px] leading-[1.8] text-[#1D2432]/72">
        {rejected ? (
          <L
            en="If your situation has changed, please get in touch — we're happy to look again."
            ja="ご状況が変わりましたら、いつでも改めてご相談ください。担当があらためて確認いたします。"
          />
        ) : (
          <L
            en="We verify each licence by hand and reply within two business days. Wholesale pricing appears here once your account has been approved."
            ja="免許の内容を一件ずつ確認のうえ、2 営業日以内に結果をご連絡します。承認後、このページに卸価格が表示されます。"
          />
        )}
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/contact"
          className="inline-flex w-full max-w-[260px] items-center justify-center border border-[#0B1A2E]/30 bg-transparent px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[#0B1A2E]/80 no-underline transition-colors hover:border-[#0B1A2E]/60 hover:text-[#0B1A2E] sm:w-auto"
        >
          <L en="CONTACT THE TRADE DESK" ja="取扱店窓口へ問い合わせる" />
        </Link>
        <a
          href={`mailto:${FUJISAN_LEGAL.email}`}
          className="text-[12px] text-[#0B1A2E]/70 underline decoration-[#0B1A2E]/25 underline-offset-4 hover:text-[#C9A84C]"
        >
          {FUJISAN_LEGAL.email}
        </a>
      </div>
    </div>
  );
}
