import Link from "next/link";
import { fujisanProducts } from "@/data/fujisan-products";
import { skuId } from "@/db/products-schema";
import { getLiveSkus } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { L } from "@/i18n/Localized";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export async function WholesalePriceList() {
  const session = await getSession();
  const isBusiness =
    (session?.user as { role?: string } | undefined)?.role === "business";

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

  // ここまで来た＝取扱店（business）確定。卸価格・入数・完売は D1 の現在値を使う。
  // 蔵元が管理画面で卸価格を変えたら、次のアクセスから反映される。
  const bySku = new Map(
    (await getLiveSkus()).map((s) => [skuId(s.slug, s.ml), s]),
  );
  const products = fujisanProducts;

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

        {products.map((p, pi) => (
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
            {p.volumes.map((v) => {
              // 卸価格・入数・完売は D1（product_sku）の現在値を正とする。
              const live = bySku.get(skuId(p.slug, v.ml));
              const wholesale = live?.wholesalePriceJpy ?? v.wholesalePriceJpy;
              const caseSize = live?.caseSize ?? v.caseSize;
              return (
                <div
                  key={`${p.slug}-${v.ml}`}
                  className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-5 border-t border-[#0B1A2E]/8 px-4 py-4 transition-colors duration-150 hover:bg-[#F1E6CB]/35 sm:gap-x-8 sm:px-6"
                >
                  <span className="text-[12px] tracking-[0.1em] text-[#0B1A2E]/70">
                    {v.ml} ml
                    {live?.soldOut ? (
                      <span className="ml-2 text-[10px] font-semibold tracking-[0.16em] text-crimson">
                        <L en="SOLD OUT" ja="完売" />
                      </span>
                    ) : null}
                  </span>
                  <span className="text-right font-serif text-[15px] text-[#0B1A2E]">
                    {yen(wholesale)}
                  </span>
                  <span className="text-right font-serif text-[15px] text-[#0B1A2E]">
                    {yen(wholesale * caseSize)}
                    <span className="ml-1.5 align-baseline text-[10px] tracking-[0.06em] text-[#0B1A2E]/55">
                      ×{caseSize}
                    </span>
                  </span>
                </div>
              );
            })}
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
