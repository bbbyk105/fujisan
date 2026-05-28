import Link from "next/link";
import { fujisanProducts } from "@/data/fujisan-products";
import { getSessionSafe } from "@/lib/session";
import { L } from "@/i18n/Localized";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export async function WholesalePriceList() {
  const session = await getSessionSafe();
  const isBusiness =
    (session?.user as { role?: string } | undefined)?.role === "business";

  if (!isBusiness) {
    return (
      <div className="border border-[#0B1A2E]/14 bg-[#F1E6CB]/45 px-7 py-12 text-center md:px-12 md:py-16">
        <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
          ― ログインで卸価格を表示 ―
        </span>
        <h3 className="mx-auto mt-5 max-w-[520px] font-serif text-[clamp(20px,2.2vw,28px)] font-semibold leading-[1.3] tracking-[0.05em] text-[#0B1A2E]">
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
            className="inline-flex w-full max-w-[260px] items-center justify-center border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[#F8F3E7] no-underline transition-colors hover:bg-[#16273d] sm:w-auto"
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
    <div className="border-t border-[#0B1A2E]/15">
      {/* Header row */}
      <div className="hidden grid-cols-[1.6fr_1fr_1fr] items-end gap-4 border-b border-[#0B1A2E]/12 py-4 sm:grid">
        <span className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/60">
          PRODUCT · 銘柄
        </span>
        <span className="text-right text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/60">
          PER BOTTLE · 1本
        </span>
        <span className="text-right text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/60">
          PER CASE · 1ケース
        </span>
      </div>

      {fujisanProducts.map((p) => (
        <div
          key={p.slug}
          className="grid grid-cols-2 items-baseline gap-x-4 gap-y-1 border-b border-[#0B1A2E]/10 py-5 sm:grid-cols-[1.6fr_1fr_1fr] sm:items-center"
        >
          <div className="col-span-2 sm:col-span-1">
            <span className="font-serif text-[14px] font-semibold tracking-[0.12em] text-[#0B1A2E]">
              {p.name} · {p.variant.replace(/\n/g, " ")}
            </span>
            <span className="mt-0.5 block font-jp text-[10.5px] tracking-[0.18em] text-[#C9A84C]/85">
              {p.variantLineJp}
            </span>
          </div>
          <div className="text-left sm:text-right">
            <span className="font-serif text-[15px] text-[#0B1A2E]">
              {yen(p.wholesalePriceJpy)}
            </span>
          </div>
          <div className="text-right">
            <span className="font-serif text-[15px] text-[#0B1A2E]">
              {yen(p.wholesalePriceJpy * p.caseSize)}
            </span>
            <span className="ml-1.5 text-[10px] text-[#0B1A2E]/55">
              ×{p.caseSize}
            </span>
          </div>
        </div>
      ))}

      <p className="mt-6 text-[11px] leading-[1.7] text-[#0B1A2E]/55">
        <L
          en="Prices are per 720 ml bottle, excluding tax, for reference. Volume terms apply beyond ten cases per month — contact your trade desk for a formal quote."
          ja="価格は 720ml 1本あたり・税抜の参考価格です。月10ケースを超える場合は数量条件がございます。正式なお見積りは担当窓口までご相談ください。"
        />
      </p>
    </div>
  );
}
