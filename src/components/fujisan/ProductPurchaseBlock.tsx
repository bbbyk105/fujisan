"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { UNDERAGE_NOTICE_EN, UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";
import type { FujisanVolume } from "@/data/fujisan-products";
import { useCart } from "@/lib/cart/useCart";
import { pushToast } from "@/lib/cart/toast-store";
import { L } from "@/i18n/Localized";

type Props = {
  /** カートに追加する商品の slug */
  slug: string;
  productName: string;
  /** 銘柄名（ローマ字・例: SHOGUN） */
  variant: string;
  /** 銘柄名の漢字（例: 将軍） */
  variantJp: string;
  variantLine: string;
  /** 容量ごとの価格（先頭が既定 SKU） */
  volumes: FujisanVolume[];
  /** 日本語の送料表記 */
  shippingNote: string;
  /** 英語ロケール表示用の送料表記 */
  shippingNoteEn: string;
};

const yen = new Intl.NumberFormat("ja-JP");

export default function ProductPurchaseBlock({
  slug,
  productName,
  variant,
  variantJp,
  variantLine,
  volumes,
  shippingNote,
  shippingNoteEn,
}: Props) {
  const { add } = useCart();
  const [confirmed, setConfirmed] = useState(false);
  // 未確認のままボタンを押した時にチェックボックスへ誘導するためのエラー状態
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const [qty, setQty] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [selectedMl, setSelectedMl] = useState(volumes[0].ml);

  const selected = volumes.find((v) => v.ml === selectedMl) ?? volumes[0];
  const soldOut = selected.soldOut === true;

  const onAddToCart = () => {
    // 完売 SKU は追加不可（選択中の容量が品切れならここで止める）。
    if (soldOut) return;
    // disabled で無効化しない（スクリーンリーダーから到達不能になるため）。
    // 未確認クリックはチェックボックスへフォーカスを移して要求を伝える。
    if (!confirmed) {
      setNeedsConfirm(true);
      checkboxRef.current?.focus();
      checkboxRef.current?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      return;
    }
    add(slug, selected.ml, qty);
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3500);
    pushToast({
      ja: `${productName}（${selected.ml}ml）を${qty}本カートに追加しました`,
      en: `${productName} ${selected.ml}ml ×${qty} added to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
  };

  return (
    <section
      aria-labelledby="purchase-heading"
      className="border-t border-[#0B1A2E]/10 bg-paper"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-7 py-16 md:grid-cols-[1.1fr_1fr] md:gap-14 md:px-12 md:py-20">
        <div>
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="PURCHASE" ja="ご購入" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <h2
            id="purchase-heading"
            className="mt-6 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.2] tracking-[0.04em] text-[#0B1A2E]"
          >
            {productName}{" "}
            <L en={variant} ja={`${variant} ${variantJp}`} />{" "}
            <span className="text-[#0B1A2E]/60">/ {variantLine}</span>
          </h2>

          <p className="mt-6 font-serif text-[clamp(28px,3.2vw,38px)] font-semibold leading-[1.15] tracking-[0.02em] text-[#0B1A2E]">
            ¥{yen.format(selected.priceJpy)}
            <span className="ml-2 align-middle text-[12px] font-medium tracking-[0.18em] text-[#0B1A2E]/60">
              <L en="(tax incl.)" ja="（税込）" />
            </span>
          </p>

          {/* 容量の選択（複数容量がある場合のみボタン表示） */}
          <div className="mt-6">
            <span className="text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/70">
              <L en="VOLUME" ja="容量" />
            </span>
            <div className="mt-3 flex flex-wrap gap-3">
              {volumes.map((v) => {
                const active = v.ml === selected.ml;
                const vSoldOut = v.soldOut === true;
                return (
                  <button
                    key={v.ml}
                    type="button"
                    onClick={() => setSelectedMl(v.ml)}
                    aria-pressed={active}
                    disabled={volumes.length === 1}
                    className={`min-w-[88px] cursor-pointer border px-4 py-3 text-[12px] font-semibold tracking-[0.1em] transition-colors disabled:cursor-default ${
                      active
                        ? "border-[#0B1A2E] bg-[#0B1A2E] text-paper-card"
                        : "border-[#0B1A2E]/30 bg-transparent text-[#0B1A2E]/80 hover:border-[#0B1A2E]"
                    } ${vSoldOut ? "opacity-55" : ""}`}
                  >
                    {v.ml}ml
                    <span
                      className={`ml-1.5 text-[10.5px] font-medium ${
                        vSoldOut ? "line-through" : ""
                      } ${active ? "text-paper-card/75" : "text-[#0B1A2E]/70"}`}
                    >
                      ¥{yen.format(v.priceJpy)}
                    </span>
                    {vSoldOut ? (
                      <span
                        className={`ml-1.5 text-[9px] font-semibold tracking-[0.14em] ${
                          active ? "text-paper-card/85" : "text-crimson"
                        }`}
                      >
                        <L en="SOLD OUT" ja="完売" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="mt-5 space-y-1.5 text-[12.5px] leading-[1.7] text-[#1D2432]/76">
            <li>
              ·{" "}
              <L
                en={`${selected.ml}ml × 1 bottle. Prices include 10% Japanese consumption tax.`}
                ja={`${selected.ml}ml 1本／消費税10%込みの価格を表示しています。`}
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
            <span
              className="text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/70"
            >
              <L en="QTY" ja="数量" />
            </span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                aria-label="数量を減らす"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-[#0B1A2E]/45 transition-colors hover:text-[#0B1A2E]"
              >
                −
              </button>
              <span
                id="qty"
                aria-live="polite"
                aria-label={`数量 ${qty}`}
                className="w-9 border-b border-[#0B1A2E]/30 pb-0.5 text-center text-[13px] font-semibold tracking-[0.1em] text-[#0B1A2E]"
              >
                {qty}
              </span>
              <button
                type="button"
                aria-label="数量を増やす"
                onClick={() => setQty((q) => Math.min(12, q + 1))}
                className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-[#0B1A2E]/45 transition-colors hover:text-[#0B1A2E]"
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
            className="mt-7 border border-[#C9A84C]/35 bg-paper-tint/80 px-5 py-5 text-[clamp(18px,2vw,22px)] font-medium leading-[1.55] text-[#1D2432]/86"
          >
            <L
              ja={
                <>
                  {UNDERAGE_NOTICE_JP.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </>
              }
              en={
                <>
                  {UNDERAGE_NOTICE_EN.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </>
              }
            />
          </div>

          <label
            className={`mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-[1.6] text-[#0B1A2E]/85 select-none ${
              needsConfirm
                ? "outline outline-2 outline-offset-8 outline-[#8B1A1A]/65"
                : ""
            }`}
          >
            <input
              ref={checkboxRef}
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                if (e.target.checked) setNeedsConfirm(false);
              }}
              className="mt-[3px] h-4 w-4 cursor-pointer border-[#0B1A2E]/40 accent-[#0B1A2E]"
              aria-describedby="age-check-note"
              aria-invalid={needsConfirm}
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
          {needsConfirm ? (
            <p
              role="alert"
              className="mt-3 pl-7 text-[11px] font-semibold leading-[1.6] text-[#8B1A1A]"
            >
              <L
                en="Please confirm your age above to add this item to the cart."
                ja="カートに追加するには、上記の年齢確認にチェックをお願いします。"
              />
            </p>
          ) : null}
          <p
            id="age-check-note"
            className="mt-2 pl-7 text-[10.5px] leading-[1.6] text-[#0B1A2E]/72"
          >
            <L
              en="* Age verification may also be performed at delivery."
              ja="※ 配送時にも年齢確認を行う場合があります。"
            />
          </p>

          <button
            type="button"
            onClick={onAddToCart}
            aria-disabled={soldOut || !confirmed}
            disabled={soldOut}
            className={`mt-7 inline-flex w-full items-center justify-center gap-3 px-7 py-4 text-[11px] font-semibold tracking-[0.28em] transition-all ${
              soldOut
                ? "cursor-not-allowed border border-[#0B1A2E]/25 bg-[#0B1A2E]/[0.07] text-[#0B1A2E]/45"
                : confirmed
                  ? "cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] text-paper-card hover:bg-[#1D2432]"
                  : "cursor-pointer border border-[#0B1A2E]/35 bg-[#0B1A2E]/15 text-[#0B1A2E]/60"
            }`}
          >
            {soldOut ? (
              <span className="gap-3">
                <L en="SOLD OUT" ja="完売しました" />
              </span>
            ) : (
              <span
                key={submitted ? "added" : "idle"}
                className="fujisan-swap gap-3"
              >
                {submitted ? (
                  <L en="Added to cart" ja="カートに追加しました" />
                ) : (
                  <L en="ADD TO CART" ja="カートに追加" />
                )}
                <span aria-hidden>→</span>
              </span>
            )}
          </button>
          {soldOut ? (
            <p className="mt-3 text-[11.5px] leading-[1.7] text-[#0B1A2E]/70">
              <L
                en="This size is currently sold out. Please check back soon or contact us for restock updates."
                ja="この容量は現在完売しています。入荷までいましばらくお待ちください。"
              />
            </p>
          ) : null}

          <p className="mt-4 text-[10.5px] leading-[1.7] text-[#0B1A2E]/72">
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
