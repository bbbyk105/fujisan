"use client";

import Link from "next/link";
import { useState } from "react";
import { UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

type Props = {
  productName: string;
  variantLine: string;
  priceJpy: number;
  /** 日本語の送料表記 */
  shippingNote: string;
  /** 英語ロケール表示用の送料表記 */
  shippingNoteEn: string;
};

const yen = new Intl.NumberFormat("ja-JP");

export default function ProductPurchaseBlock({
  productName,
  variantLine,
  priceJpy,
  shippingNote,
  shippingNoteEn,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const onAddToCart = () => {
    if (!confirmed) return;
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <section
      aria-labelledby="purchase-heading"
      className="border-t border-[#0B1A2E]/10 bg-[#FAF5E8]"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-7 py-16 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-12 md:py-20">
        <div>
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="PURCHASE" ja="ご購入" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <h2
            id="purchase-heading"
            className="mt-6 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#0B1A2E]"
          >
            {productName}{" "}
            <span className="text-[#0B1A2E]/60">/ {variantLine}</span>
          </h2>

          <p className="mt-6 font-serif text-[clamp(28px,3.2vw,38px)] font-semibold tracking-[0.02em] text-[#0B1A2E]">
            ¥{yen.format(priceJpy)}
            <span className="ml-2 align-middle text-[12px] font-medium tracking-[0.18em] text-[#0B1A2E]/60">
              <L en="(tax incl.)" ja="（税込）" />
            </span>
          </p>

          <ul className="mt-4 space-y-1.5 text-[12.5px] leading-[1.7] text-[#1D2432]/76">
            <li>
              ·{" "}
              <L
                en="720ml × 1 bottle. Prices include 10% Japanese consumption tax."
                ja="720ml 1本／消費税10%込みの価格を表示しています。"
              />
            </li>
            <li>
              ·{" "}
              <L en="Shipping" ja="送料" />:{" "}
              <L en={shippingNoteEn} ja={shippingNote} />
            </li>
            <li>
              ·{" "}
              <L
                en={
                  <>
                    Full sale conditions are listed in our{" "}
                    <Link
                      href="/tokushoho"
                      className="underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                    >
                      Tokutei Shōtorihiki Hō (Specified Commercial Transactions
                      Act) notice
                    </Link>
                    .
                  </>
                }
                ja={
                  <>
                    詳細な販売条件は
                    <Link
                      href="/tokushoho"
                      className="ml-1 underline decoration-[#C9A84C]/60 underline-offset-2 hover:text-[#C9A84C]"
                    >
                      特定商取引法に基づく表示
                    </Link>
                    をご確認ください。
                  </>
                }
              />
            </li>
          </ul>

          <div className="mt-7 flex items-center gap-4">
            <label
              htmlFor="qty"
              className="text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/70"
            >
              <L en="QTY" ja="数量" />
            </label>
            <div className="inline-flex items-center border border-[#0B1A2E]/25 bg-white/70">
              <button
                type="button"
                aria-label="数量を減らす"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="cursor-pointer px-3 py-2 text-[14px] text-[#0B1A2E] transition-colors hover:bg-[#F1E6CB]/60"
              >
                −
              </button>
              <input
                id="qty"
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={qty}
                onChange={(e) =>
                  setQty(Math.max(1, Math.min(12, Number(e.target.value) || 1)))
                }
                className="w-12 border-x border-[#0B1A2E]/15 bg-transparent py-2 text-center text-[13px] font-semibold tracking-[0.1em] text-[#0B1A2E] outline-none"
              />
              <button
                type="button"
                aria-label="数量を増やす"
                onClick={() => setQty((q) => Math.min(12, q + 1))}
                className="cursor-pointer px-3 py-2 text-[14px] text-[#0B1A2E] transition-colors hover:bg-[#F1E6CB]/60"
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {/* 年齢確認・未成年防止表示・購入ボタン */}
        <div className="md:border-l md:border-[#0B1A2E]/12 md:pl-14">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="AGE VERIFICATION" ja="年齢確認" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          {/* 未成年飲酒防止表示 — 法令上、日本語表記は常に必要 */}
          <div
            role="note"
            aria-label="未成年飲酒防止のお知らせ"
            className="mt-7 border border-[#C9A84C]/35 bg-[#F4ECD9]/80 px-5 py-4 text-[12px] leading-[1.75] text-[#1D2432]/86"
          >
            {UNDERAGE_NOTICE_JP.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-[1.6] text-[#0B1A2E]/85 select-none">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-[3px] h-4 w-4 cursor-pointer border-[#0B1A2E]/40 accent-[#0B1A2E]"
              aria-describedby="age-check-note"
            />
            <span>
              <L
                en={
                  <>
                    I confirm that I am{" "}
                    <strong className="font-semibold">
                      20 years of age or older
                    </strong>{" "}
                    and that purchasing alcohol is permitted under applicable
                    law.
                  </>
                }
                ja={
                  <>
                    私は<strong className="font-semibold">20歳以上</strong>
                    であり、本商品の購入が法令上認められていることを確認しました。
                  </>
                }
              />
            </span>
          </label>
          <p
            id="age-check-note"
            className="mt-2 pl-7 text-[10.5px] leading-[1.6] text-[#0B1A2E]/55"
          >
            <L
              en="* Age verification may also be performed at delivery."
              ja="※ 配送時にも年齢確認を行う場合があります。"
            />
          </p>

          <button
            type="button"
            onClick={onAddToCart}
            disabled={!confirmed}
            className={`mt-7 inline-flex w-full items-center justify-center gap-3 px-7 py-4 text-[11px] font-semibold tracking-[0.28em] transition-all ${
              confirmed
                ? "cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] text-[#F8F3E7] hover:bg-[#1D2432]"
                : "cursor-not-allowed border border-[#0B1A2E]/25 bg-[#0B1A2E]/12 text-[#0B1A2E]/45"
            }`}
          >
            {submitted ? (
              <L en="Added to cart" ja="カートに追加しました" />
            ) : (
              <L en="ADD TO CART" ja="カートに追加" />
            )}
            <span aria-hidden>→</span>
          </button>

          <p className="mt-4 text-[10.5px] leading-[1.7] text-[#0B1A2E]/55">
            <L
              en="Before completing your order, age verification and shipping conditions will be confirmed once more at checkout."
              ja="ご注文の確定前に、ご購入手続き画面で再度年齢確認と配送条件をご確認いただきます。"
            />
          </p>
        </div>
      </div>
    </section>
  );
}
