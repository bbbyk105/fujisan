"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MAX_QTY_PER_LINE,
  amountToFreeShipping,
  shippingFee,
} from "@/lib/cart/cart-core";
import { useCart } from "@/lib/cart/useCart";
import { pushToast } from "@/lib/cart/toast-store";
import { useSession } from "@/lib/auth-client";
import { startCheckoutAction } from "@/lib/actions/checkout";
import { fujisanProducts, primaryVolume } from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { useLocale } from "@/i18n/useLocale";

const yen = new Intl.NumberFormat("ja-JP");

/** 決済開始の失敗理由。"login"/"age" はフロント固有のゲート、それ以外は action 由来。 */
type CheckoutError =
  | "unauth"
  | "invalid"
  | "config"
  | "stripe"
  | "db"
  | "soldout"
  | "login"
  | "age";

function QtyStepper({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        aria-label="数量を減らす"
        onClick={() => onChange(qty - 1)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-[#0B1A2E]/45 transition-colors hover:text-[#0B1A2E]"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_QTY_PER_LINE}
        value={qty}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
        aria-label="数量"
        className="w-9 border-b border-[#0B1A2E]/30 bg-transparent pb-0.5 text-center text-[13px] font-semibold tracking-[0.08em] text-[#0B1A2E] outline-none"
      />
      <button
        type="button"
        aria-label="数量を増やす"
        onClick={() => onChange(qty + 1)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-[#0B1A2E]/45 transition-colors hover:text-[#0B1A2E]"
      >
        ＋
      </button>
    </div>
  );
}

export function CartView() {
  const { ready, lines, count, subtotal, add, setQty, remove } = useCart();
  const { data: session, isPending } = useSession();
  const locale = useLocale();
  // 削除確認中の行（`${slug}-${ml}`）。null のときは確認テロップを出していない。
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  // 決済開始まわりの状態
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);
  const loggedIn = Boolean(session?.user?.id);

  // Stripe をキャンセルして /cart?canceled=1 に戻ってきた場合のお知らせ。
  // 静的ページなので useSearchParams は使わず、マウント後に location から読む。
  const [canceled, setCanceled] = useState(false);
  useEffect(() => {
    // クライアント専用の URL をマウント後に一度だけ反映（ハイドレーション不一致回避）。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanceled(
      new URLSearchParams(window.location.search).get("canceled") === "1",
    );
  }, []);

  // 「お支払いへ進む」: 年齢確認・ログインを確認し、Stripe 決済ページへ遷移する。
  const handleCheckout = async () => {
    if (submitting) return;
    setCheckoutError(null);
    if (!session?.user?.id) {
      setCheckoutError("login");
      return;
    }
    if (!ageConfirmed) {
      setCheckoutError("age");
      return;
    }
    setSubmitting(true);
    const res = await startCheckoutAction({
      items: lines.map((l) => ({ slug: l.slug, ml: l.ml, qty: l.qty })),
      locale,
    });
    if (res.ok) {
      // Stripe ホスト型決済ページへ。遷移するので submitting は解除しない。
      window.location.href = res.url;
      return;
    }
    setSubmitting(false);
    setCheckoutError(res.error);
  };

  const quickAdd = (slug: string, ml: number, name: string) => {
    add(slug, ml, 1);
    pushToast({
      ja: `${name}をカートに追加しました`,
      en: `${name} added to your cart`,
      action: { href: "/cart", ja: "カートを見る", en: "VIEW CART" },
    });
  };

  const confirmRemove = (
    slug: string,
    ml: number,
    name: string,
    qty: number,
  ) => {
    remove(slug, ml);
    setConfirmingKey(null);
    pushToast({
      ja: `${name}（${ml}ml）をカートから削除しました`,
      en: `${name} ${ml}ml removed from your cart`,
      action: {
        ja: "元に戻す",
        en: "UNDO",
        onClick: () => add(slug, ml, qty),
      },
    });
  };

  // localStorage 復元前はちらつきを避けるため最小限のプレースホルダのみ。
  if (!ready) {
    return (
      <section className="bg-paper">
        <div className="mx-auto min-h-[40vh] max-w-[1280px] px-7 py-20 md:px-12" />
      </section>
    );
  }

  if (lines.length === 0) {
    return (
      <section className="bg-paper">
        <div className="mx-auto max-w-[1280px] px-7 py-24 text-center md:px-12 md:py-32">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/55">
            <L en="YOUR CART IS EMPTY" ja="カートは空です" />
          </p>
          <h2 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            <L
              en="No bottles yet."
              ja="まだ、何も入っていません。"
            />
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[13.5px] leading-[1.78] text-[#1D2432]/76">
            <L
              en="Browse the collection and add the bottle that calls to you."
              ja="コレクションから、一本お選びください。"
            />
          </p>
          <Link
            href="/shop/personal"
            className="group/btn mt-9 inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
          >
            <L en="BROWSE THE COLLECTION" ja="コレクションを見る" />
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/btn:translate-x-1"
            >
              →
            </span>
          </Link>

          {/* 人気の銘柄サジェスト */}
          <div className="mt-16 border-t border-[#0B1A2E]/12 pt-12">
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/55">
              <L en="POPULAR BOTTLES" ja="人気の銘柄" />
            </p>
            <div className="mx-auto mt-8 grid max-w-[680px] grid-cols-1 gap-6 sm:grid-cols-3">
              {fujisanProducts.slice(0, 3).map((p) => (
                <div key={p.slug} className="flex flex-col items-center">
                  <Link
                    href={`/products/${p.slug}`}
                    className="relative h-[150px] w-[88px] no-underline"
                  >
                    <Image
                      src={p.img}
                      alt={`${p.name} ${p.variantLine}`}
                      fill
                      sizes="88px"
                      className="object-contain object-bottom"
                    />
                  </Link>
                  <Link
                    href={`/products/${p.slug}`}
                    className="mt-3 font-serif text-[13.5px] font-semibold tracking-[0.08em] text-[#0B1A2E] no-underline transition-colors hover:text-[#C9A84C]"
                  >
                    {p.name}{" "}
                    <span className="text-[#0B1A2E]/55">{p.variant}</span>
                  </Link>
                  <p className="mt-1 font-serif text-[13px] font-semibold text-[#0B1A2E]">
                    ¥{yen.format(primaryVolume(p).priceJpy)}
                  </p>
                  <button
                    type="button"
                    onClick={() => quickAdd(p.slug, primaryVolume(p).ml, p.name)}
                    className="mt-3 cursor-pointer border border-[#0B1A2E]/30 px-5 py-2 text-[10px] font-semibold tracking-[0.24em] text-[#0B1A2E] transition-colors hover:border-[#0B1A2E] hover:bg-[#0B1A2E] hover:text-paper-card"
                  >
                    <L en="ADD" ja="追加" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  const shipping = shippingFee(subtotal);
  const total = subtotal + shipping;
  const toFree = amountToFreeShipping(subtotal);
  const freeReached = SHIPPING_FEE.freeThresholdJpy > 0 && toFree === 0;
  const freeProgress =
    SHIPPING_FEE.freeThresholdJpy > 0
      ? Math.min(100, (subtotal / SHIPPING_FEE.freeThresholdJpy) * 100)
      : 100;

  return (
    <section className="bg-paper">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-7 py-16 md:px-12 md:py-20 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        {/* Line items */}
        <div>
          <div className="flex items-baseline justify-between border-b border-[#0B1A2E]/15 pb-4">
            <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
              <L en="ITEMS" ja="ご注文の商品" />
            </p>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#0B1A2E]/60">
              <L en={`${count} bottle(s)`} ja={`${count} 本`} />
            </p>
          </div>

          <ul>
            {lines.map(({ slug, ml, qty, product, volume }) => {
              const lineKey = `${slug}-${ml}`;
              return (
              <li
                key={lineKey}
                className="flex gap-5 border-b border-[#0B1A2E]/10 py-7"
              >
                <Link
                  href={`/products/${slug}`}
                  className="relative h-[110px] w-[72px] shrink-0 overflow-visible no-underline"
                >
                  <Image
                    src={product.img}
                    alt={`${product.name} ${product.variantLine}`}
                    fill
                    sizes="72px"
                    className="object-contain object-bottom"
                  />
                </Link>

                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/products/${slug}`}
                        className="font-serif text-[15px] font-semibold tracking-[0.1em] text-[#0B1A2E] no-underline transition-colors hover:text-[#C9A84C]"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-[10.5px] font-semibold tracking-[0.16em] text-[#0B1A2E]/62">
                        <L
                          en={product.variantLine}
                          ja={product.variantLineJp}
                        />
                        <span className="mx-1.5 text-[#0B1A2E]/30">·</span>
                        {ml}ml
                      </p>
                    </div>
                    <p className="shrink-0 font-serif text-[15px] font-semibold tracking-[0.02em] text-[#0B1A2E]">
                      ¥{yen.format(volume.priceJpy * qty)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                    <QtyStepper
                      qty={qty}
                      onChange={(next) => setQty(slug, ml, next)}
                    />
                    {confirmingKey === lineKey ? (
                      <div className="flex items-center gap-3 text-[11px] tracking-[0.14em]">
                        <span className="text-[#0B1A2E]/70">
                          <L en="Remove?" ja="削除しますか？" />
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            confirmRemove(slug, ml, product.name, qty)
                          }
                          className="cursor-pointer font-semibold text-[#8B1A1A] underline decoration-[#8B1A1A]/30 underline-offset-4 transition-colors hover:decoration-[#8B1A1A]"
                        >
                          <L en="Yes" ja="削除する" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingKey(null)}
                          className="cursor-pointer text-[#0B1A2E]/55 transition-colors hover:text-[#0B1A2E]"
                        >
                          <L en="Cancel" ja="キャンセル" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingKey(lineKey)}
                        className="cursor-pointer text-[11px] tracking-[0.18em] text-[#0B1A2E]/55 underline decoration-[#0B1A2E]/20 underline-offset-4 transition-colors hover:text-[#8B1A1A]"
                      >
                        <L en="Remove" ja="削除" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
              );
            })}
          </ul>

          <Link
            href="/shop/personal"
            className="group/link mt-7 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-[#0B1A2E]/70 no-underline transition-colors hover:text-[#0B1A2E]"
          >
            <span aria-hidden>←</span>
            <L en="CONTINUE SHOPPING" ja="買い物を続ける" />
          </Link>
        </div>

        {/* Summary */}
        <aside className="h-fit border border-[#0B1A2E]/12 bg-paper-card px-7 py-9 lg:sticky lg:top-[104px]">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="ORDER SUMMARY" ja="ご注文内容" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <dl className="mt-7 space-y-3 text-[13px] text-[#1D2432]/85">
            <div className="flex items-center justify-between">
              <dt>
                <L en="Subtotal (tax incl.)" ja="小計（税込）" />
              </dt>
              <dd className="font-semibold">¥{yen.format(subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>
                <L en="Shipping" ja="送料" />
              </dt>
              <dd className="font-semibold">
                {shipping === 0 ? (
                  <L en="Free" ja="無料" />
                ) : (
                  `¥${yen.format(shipping)}`
                )}
              </dd>
            </div>
          </dl>

          {/* 送料無料までの進捗 */}
          {SHIPPING_FEE.freeThresholdJpy > 0 ? (
            <div className="mt-6">
              <p className="text-[11px] leading-[1.6] tracking-[0.02em] text-[#0B1A2E]/72">
                {freeReached ? (
                  <L
                    en="Your order ships free."
                    ja={
                      <>
                        <span className="font-semibold text-[#0B1A2E]">
                          送料無料
                        </span>
                        でお届けします。
                      </>
                    }
                  />
                ) : (
                  <L
                    en={`Add ¥${yen.format(toFree)} more for free shipping.`}
                    ja={
                      <>
                        あと
                        <span className="font-semibold text-[#0B1A2E]">
                          ¥{yen.format(toFree)}
                        </span>
                        で送料無料
                      </>
                    }
                  />
                )}
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#0B1A2E]/10">
                <div
                  className="h-full rounded-full bg-[#C9A84C] transition-[width] duration-500"
                  style={{ width: `${freeProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex items-baseline justify-between border-t border-[#0B1A2E]/15 pt-5">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#0B1A2E]/70">
              <L en="TOTAL" ja="合計" />
            </p>
            <p className="font-serif text-[24px] font-semibold tracking-[0.02em] text-[#0B1A2E]">
              ¥{yen.format(total)}
            </p>
          </div>

          <p className="mt-3 text-[10.5px] leading-[1.7] text-[#0B1A2E]/55">
            <L
              en={`${SHIPPING_FEE.flatEn} · ${SHIPPING_FEE.freeEn}`}
              ja={`${SHIPPING_FEE.flat}・${SHIPPING_FEE.free}`}
            />
          </p>

          {/* キャンセルして戻ってきたとき */}
          {canceled ? (
            <p
              role="status"
              className="mt-6 border border-gold/45 bg-paper-tint/80 px-4 py-3 text-[11.5px] leading-[1.7] text-[#1D2432]/85"
            >
              <L
                en="Payment was canceled — your cart is unchanged. You can try again anytime."
                ja="お支払いがキャンセルされました。カートはそのままです。いつでももう一度お試しいただけます。"
              />
            </p>
          ) : null}

          {/* 国内発送のみ・海外案内 */}
          <p className="mt-6 text-[11px] leading-[1.7] text-[#0B1A2E]/60">
            <L
              en={
                <>
                  We ship within Japan only. For delivery outside Japan, please{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
                  >
                    contact us
                  </Link>
                  .
                </>
              }
              ja={
                <>
                  発送は日本国内のみです。海外発送をご希望の方は
                  <Link
                    href="/contact"
                    className="font-semibold text-[#0B1A2E] underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
                  >
                    お問い合わせ
                  </Link>
                  ください。
                </>
              }
            />
          </p>

          {/* 年齢確認（酒類のため法令上必須） */}
          {/* 国税局の指導に基づき、年齢確認表示は拡大・明確化している。縮小しないこと。 */}
          <label className="mt-6 flex cursor-pointer items-start gap-4 border border-[#0B1A2E]/30 bg-paper-tint/70 px-5 py-5 select-none">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => {
                setAgeConfirmed(e.target.checked);
                if (e.target.checked) setCheckoutError(null);
              }}
              aria-invalid={checkoutError === "age" ? "true" : undefined}
              className="mt-0.5 h-[22px] w-[22px] shrink-0 cursor-pointer border-[#0B1A2E]/50 accent-[#0B1A2E]"
            />
            <span className="text-[15px] leading-[1.75] text-[#0B1A2E] md:text-[16px]">
              <L
                en={
                  <>
                    I confirm that I am{" "}
                    <strong className="font-bold">
                      20 years of age or older
                    </strong>{" "}
                    and that purchasing alcohol is permitted under applicable
                    law.
                  </>
                }
                ja={
                  <>
                    私は<strong className="font-bold">20歳以上</strong>
                    であり、本商品の購入が法令上認められていることを確認しました。
                  </>
                }
              />
            </span>
          </label>
          {checkoutError === "age" ? (
            <p role="alert" className="mt-2 text-[12.5px] font-semibold text-crimson">
              <L
                en="Please confirm you are 20 or older to continue."
                ja="20歳以上であることをご確認ください。"
              />
            </p>
          ) : null}

          {/* 未ログイン: 購入にはログインが必要 */}
          {!isPending && !loggedIn ? (
            <div
              role="note"
              className="mt-5 border border-gold/45 bg-paper-tint/80 px-4 py-4 text-[12px] leading-[1.7] text-[#1D2432]/88"
            >
              <p className="font-semibold">
                <L
                  en="Please sign in to complete your purchase."
                  ja="ご購入にはログインが必要です。"
                />
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href="/login/personal"
                  className="inline-flex items-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-5 py-2.5 text-[10.5px] font-semibold tracking-[0.24em] text-paper-card no-underline transition-colors hover:bg-[#1D2432]"
                >
                  <L en="SIGN IN" ja="ログイン" />
                </Link>
                <Link
                  href="/register/personal"
                  className="inline-flex items-center gap-2 border border-[#0B1A2E]/30 px-5 py-2.5 text-[10.5px] font-semibold tracking-[0.24em] text-[#0B1A2E] no-underline transition-colors hover:border-[#0B1A2E]"
                >
                  <L en="CREATE ACCOUNT" ja="新規登録" />
                </Link>
              </div>
            </div>
          ) : null}

          {/* 完売エラー: カート内に品切れ SKU が混ざっている */}
          {checkoutError === "soldout" ? (
            <p
              role="alert"
              className="mt-5 border border-crimson/40 bg-crimson/6 px-4 py-3 text-[11.5px] leading-[1.7] text-crimson"
            >
              <L
                en="One of the bottles in your cart has just sold out. Please remove it and try again."
                ja="カート内の商品が完売しました。該当の商品を削除してから、もう一度お試しください。"
              />
            </p>
          ) : null}

          {/* 決済開始エラー（ログイン・年齢・完売以外） */}
          {checkoutError &&
          checkoutError !== "login" &&
          checkoutError !== "age" &&
          checkoutError !== "soldout" ? (
            <p
              role="alert"
              className="mt-5 border border-crimson/40 bg-crimson/6 px-4 py-3 text-[11.5px] leading-[1.7] text-crimson"
            >
              <L
                en="We couldn't start the payment. Please try again."
                ja="決済を開始できませんでした。もう一度お試しください。"
              />
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting || (!isPending && !loggedIn)}
            className={`group/btn mt-6 inline-flex w-full items-center justify-center gap-3 px-7 py-4 text-[11px] font-semibold tracking-[0.28em] transition-all ${
              submitting || (!isPending && !loggedIn)
                ? "cursor-not-allowed border border-[#0B1A2E]/25 bg-[#0B1A2E]/12 text-[#0B1A2E]/45"
                : "cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] text-paper-card hover:bg-[#1D2432]"
            }`}
          >
            {submitting ? (
              <L en="REDIRECTING TO PAYMENT…" ja="決済ページへ移動中…" />
            ) : (
              <>
                <L
                  en={`PROCEED TO PAYMENT · ¥${yen.format(total)}`}
                  ja={`お支払いへ進む · ¥${yen.format(total)}`}
                />
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/btn:translate-x-1"
                >
                  →
                </span>
              </>
            )}
          </button>

          <p className="mt-4 text-[10.5px] leading-[1.7] text-[#0B1A2E]/55">
            <L
              en="Name, address and payment are entered securely on the next screen (Stripe)."
              ja="お名前・ご住所・お支払いは、次の画面（Stripe の安全な決済ページ）でご入力いただきます。"
            />
          </p>
        </aside>
      </div>
    </section>
  );
}
