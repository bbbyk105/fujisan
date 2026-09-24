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
import { useLiveCatalog, liveKey } from "@/lib/cart/useLiveCatalog";
import { pushToast } from "@/lib/cart/toast-store";
import { useSession } from "@/lib/auth-client";
import {
  releaseAbandonedCheckoutAction,
  startCheckoutAction,
} from "@/lib/actions/checkout";
import { fujisanProducts, primaryVolume } from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { LivePrice } from "@/components/fujisan/LivePrice";
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
        className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-indigo/45 transition-colors hover:text-indigo"
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
        className="w-9 border-b border-indigo/30 bg-transparent pb-0.5 text-center text-[13px] font-semibold tracking-[0.08em] text-indigo outline-none"
      />
      <button
        type="button"
        aria-label="数量を増やす"
        onClick={() => onChange(qty + 1)}
        className="flex h-11 w-11 cursor-pointer items-center justify-center text-[18px] font-light text-indigo/45 transition-colors hover:text-indigo"
      >
        ＋
      </button>
    </div>
  );
}

/** 1 行の在庫の状態。問題があるときだけ返す。 */
type LineStock =
  | { kind: "soldout" }
  | { kind: "short"; available: number }
  | null;

/**
 * カート行の在庫の注意書き。
 *
 * **カートを開いた時点で出す**のが肝。以前は決済ボタンを押して弾かれて初めて
 * 「残り N 本」と分かる作りで、住所や年齢確認まで進んでから引き返させていた。
 */
function LineStockNotice({ stock }: { stock: LineStock }) {
  if (!stock) return null;
  if (stock.kind === "soldout") {
    return (
      <p className="mt-2 text-[11.5px] font-semibold leading-[1.6] text-crimson">
        <L
          en="Sold out — please remove this item to continue."
          ja="完売しました。お手数ですが削除してお進みください。"
        />
      </p>
    );
  }
  return (
    <p className="mt-2 text-[11.5px] font-semibold leading-[1.6] text-gold-ink">
      <L
        en={`Only ${stock.available} left — please reduce the quantity.`}
        ja={`残り ${stock.available} 本です。数量を減らしてください。`}
      />
    </p>
  );
}

export function CartView() {
  const { ready, lines, count, subtotal, add, setQty, remove } = useCart();
  // 実勢在庫。カートを開いた時点で「買えない」ことに気づけるようにする。
  // 取得前・取得失敗時は空なので、従来どおり決済開始時のサーバー検証に委ねる。
  const { catalog } = useLiveCatalog();
  const { data: session, isPending } = useSession();
  const locale = useLocale();
  // 削除確認中の行（`${slug}-${ml}`）。null のときは確認テロップを出していない。
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);

  // 決済開始まわりの状態
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<CheckoutError | null>(null);
  // 在庫が足りなかった SKU（決済開始時にサーバーが返す）。どれが買えないかを名指しする。
  const [shortages, setShortages] = useState<
    Array<{ slug: string; ml: number; available: number }>
  >([]);
  const loggedIn = Boolean(session?.user?.id);

  // 在庫の問題が分かっている行。押しても必ずサーバーに弾かれるので、
  // 住所や年齢確認まで進ませる前に止める。実勢在庫が取れていないときは
  // 空なので、従来どおり決済開始時の検証に委ねる。
  const blockedByStock = lines.some((l) => {
    const live = catalog[liveKey(l.slug, l.ml)];
    if (!live) return false;
    return live.soldOut || (live.stock !== null && live.stock < l.qty);
  });

  // Stripe をキャンセルして /cart?canceled=1 に戻ってきた場合のお知らせ。
  // 静的ページなので useSearchParams は使わず、マウント後に location から読む。
  const [canceled, setCanceled] = useState(false);
  useEffect(() => {
    // クライアント専用の URL をマウント後に一度だけ反映（ハイドレーション不一致回避）。
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanceled(params.get("canceled") === "1");

    // 決済を途中でやめて戻ってきたら、その注文が押さえていた在庫をすぐ解放する。
    // Session の期限切れ（30分）を待っても Webhook が解放するが、
    // その間その在庫は誰も買えない。引き返したと分かっているなら待つ必要はない。
    const abandoned = params.get("order");
    if (params.get("canceled") === "1" && abandoned) {
      void releaseAbandonedCheckoutAction({ orderRef: abandoned });
    }
  }, []);

  // 「お支払いへ進む」: 年齢確認・ログインを確認し、Stripe 決済ページへ遷移する。
  const handleCheckout = async () => {
    if (submitting) return;
    setCheckoutError(null);
    setShortages([]);
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
      ageConfirmed,
    });
    if (res.ok) {
      // Stripe ホスト型決済ページへ。遷移するので submitting は解除しない。
      window.location.href = res.url;
      return;
    }
    setSubmitting(false);
    setCheckoutError(res.error);
    setShortages(res.shortages ?? []);
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
        en: "Undo",
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
          <p className="ed-label">
            <L en="Your cart is empty" ja="カートは空です" />
          </p>
          <h2 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-indigo">
            <L
              en="No bottles yet."
              ja="まだ、何も入っていません。"
            />
          </h2>
          <p className="mx-auto mt-4 max-w-[440px] text-[13.5px] leading-[1.78] text-indigo/76">
            <L
              en="Browse the collection and add the bottle that calls to you."
              ja="コレクションから、一本お選びください。"
            />
          </p>
          <Link
            href="/shop/personal"
            className="ed-btn mt-9"
          >
            <L en="Browse the collection" ja="コレクションを見る" />
          </Link>

          {/* 人気の銘柄サジェスト */}
          <div className="mt-16 border-t border-indigo/12 pt-12">
            <p className="ed-label">
              <L en="Popular bottles" ja="人気の銘柄" />
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
                    className="mt-3 font-serif text-[13.5px] font-semibold tracking-[0.08em] text-indigo no-underline transition-colors hover:text-gold"
                  >
                    {p.name}{" "}
                    <span className="text-indigo/55">{p.variant}</span>
                  </Link>
                  <p className="mt-1 font-serif text-[13px] font-semibold text-indigo">
                    <LivePrice
                      slug={p.slug}
                      ml={primaryVolume(p).ml}
                      fallback={primaryVolume(p).priceJpy}
                    />
                  </p>
                  <button
                    type="button"
                    onClick={() => quickAdd(p.slug, primaryVolume(p).ml, p.name)}
                    className="ed-btn mt-3"
                  >
                    <L en="Add" ja="追加" />
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
          <div className="flex items-baseline justify-between border-b border-indigo/15 pb-4">
            <p className="ed-label">
              <L en="Items" ja="ご注文の商品" />
            </p>
            <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo/60">
              <L en={`${count} bottle(s)`} ja={`${count} 本`} />
            </p>
          </div>

          <ul>
            {lines.map(({ slug, ml, qty, product, lineTotal }) => {
              const lineKey = `${slug}-${ml}`;
              const live = catalog[liveKey(slug, ml)];
              const stock: LineStock = !live
                ? null
                : live.soldOut
                  ? { kind: "soldout" }
                  : live.stock !== null && live.stock < qty
                    ? { kind: "short", available: live.stock }
                    : null;
              return (
              <li
                key={lineKey}
                className="flex gap-5 border-b border-indigo/10 py-7"
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
                        className="font-serif text-[15px] font-semibold tracking-[0.1em] text-indigo no-underline transition-colors hover:text-gold"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 text-[11.5px] font-semibold tracking-[0.16em] text-indigo/62">
                        <L
                          en={product.variantLine}
                          ja={product.variantLineJp}
                        />
                        <span className="mx-1.5 text-indigo/30">·</span>
                        {ml}ml
                      </p>
                    </div>
                    <p className="shrink-0 font-serif text-[15px] font-semibold tracking-[0.02em] text-indigo">
                      ¥{yen.format(lineTotal)}
                    </p>
                  </div>

                  <LineStockNotice stock={stock} />

                  <div className="mt-auto flex items-center justify-between gap-4 pt-5">
                    <QtyStepper
                      qty={qty}
                      onChange={(next) => setQty(slug, ml, next)}
                    />
                    {confirmingKey === lineKey ? (
                      <div className="flex items-center gap-3 text-[11px] tracking-[0.14em]">
                        <span className="text-indigo/70">
                          <L en="Remove?" ja="削除しますか？" />
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            confirmRemove(slug, ml, product.name, qty)
                          }
                          className="cursor-pointer font-semibold text-crimson underline decoration-crimson/30 underline-offset-4 transition-colors hover:decoration-crimson"
                        >
                          <L en="Yes" ja="削除する" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingKey(null)}
                          className="cursor-pointer text-indigo/55 transition-colors hover:text-indigo"
                        >
                          <L en="Cancel" ja="キャンセル" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingKey(lineKey)}
                        className="cursor-pointer text-[11px] tracking-[0.18em] text-indigo/55 underline decoration-indigo/20 underline-offset-4 transition-colors hover:text-crimson"
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
            className="group/link mt-7 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-indigo/70 no-underline transition-colors hover:text-indigo"
          >
            <span aria-hidden>←</span>
            <L en="Continue shopping" ja="買い物を続ける" />
          </Link>
        </div>

        {/* Summary */}
        <aside className="h-fit border-t-2 border-indigo bg-paper-tint/40 px-6 py-8 lg:sticky lg:top-[104px]">
          <p className="ed-label">
            <L en="Order summary" ja="ご注文内容" />
          </p>

          <dl className="mt-7 space-y-3 text-[13px] text-indigo/85">
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
              <p className="text-[11px] leading-[1.6] tracking-[0.02em] text-indigo/72">
                {freeReached ? (
                  <L
                    en="Your order ships free."
                    ja={
                      <>
                        <span className="font-semibold text-indigo">
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
                        <span className="font-semibold text-indigo">
                          ¥{yen.format(toFree)}
                        </span>
                        で送料無料
                      </>
                    }
                  />
                )}
              </p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-indigo/10">
                <div
                  className="h-full rounded-full bg-gold transition-[width] duration-500"
                  style={{ width: `${freeProgress}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex items-baseline justify-between border-t border-indigo/15 pt-5">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-indigo/70">
              <L en="Total" ja="合計" />
            </p>
            {/* 金額は年齢確認より小さくする（国税局指導）。拡大しないこと。 */}
            <p className="font-serif text-[18px] font-semibold tracking-[0.02em] text-indigo">
              ¥{yen.format(total)}
            </p>
          </div>

          <p className="mt-3 text-[11.5px] leading-[1.7] text-indigo/55">
            <L
              en={`${SHIPPING_FEE.flatEn} · ${SHIPPING_FEE.freeEn}`}
              ja={`${SHIPPING_FEE.flat}・${SHIPPING_FEE.free}`}
            />
          </p>

          {/* キャンセルして戻ってきたとき */}
          {canceled ? (
            <p
              role="status"
              className="mt-6 border border-gold/45 bg-paper-tint/80 px-4 py-3 text-[11.5px] leading-[1.7] text-indigo/85"
            >
              <L
                en="Payment was canceled — your cart is unchanged. You can try again anytime."
                ja="お支払いがキャンセルされました。カートはそのままです。いつでももう一度お試しいただけます。"
              />
            </p>
          ) : null}

          {/* 国内発送のみ・海外案内 */}
          <p className="mt-6 text-[11px] leading-[1.7] text-indigo/60">
            <L
              en={
                <>
                  We ship within Japan only. For delivery outside Japan, please{" "}
                  <Link
                    href="/contact"
                    className="font-semibold text-indigo underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
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
                    className="font-semibold text-indigo underline decoration-gold/60 underline-offset-2 transition-colors hover:decoration-gold"
                  >
                    お問い合わせ
                  </Link>
                  ください。
                </>
              }
            />
          </p>

          {/* 年齢確認（酒類のため法令上必須） */}
          {/* 国税局の指導: 「20歳以上」は金額より大きく。縮小しないこと。 */}
          <label className="mt-6 flex cursor-pointer items-start gap-4 border border-indigo/30 bg-paper-tint/70 px-5 py-5 select-none">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => {
                setAgeConfirmed(e.target.checked);
                if (e.target.checked) setCheckoutError(null);
              }}
              aria-invalid={checkoutError === "age" ? "true" : undefined}
              className="mt-1.5 h-[22px] w-[22px] shrink-0 cursor-pointer border-indigo/50 accent-indigo"
            />
            <span className="text-[22px] leading-[1.7] text-indigo md:text-[24px]">
              <L
                en={
                  <>
                    I confirm that I am{" "}
                    <strong className="text-[1.15em] font-bold">
                      20 years of age or older
                    </strong>{" "}
                    and that purchasing alcohol is permitted under applicable
                    law.
                  </>
                }
                ja={
                  <>
                    私は<strong className="text-[1.15em] font-bold">20歳以上</strong>
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
              className="mt-5 border border-gold/45 bg-paper-tint/80 px-4 py-4 text-[12px] leading-[1.7] text-indigo/88"
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
                  className="ed-btn"
                >
                  <L en="Sign in" ja="ログイン" />
                </Link>
                <Link
                  href="/register/personal"
                  className="ed-btn-ghost"
                >
                  <L en="Create account" ja="新規登録" />
                </Link>
              </div>
            </div>
          ) : null}

          {/* 在庫不足: どの銘柄が何本まで買えるかを名指しする */}
          {checkoutError === "soldout" ? (
            <div
              role="alert"
              className="mt-5 border border-crimson/40 bg-crimson/6 px-4 py-3 text-[11.5px] leading-[1.7] text-crimson"
            >
              {shortages.length > 0 ? (
                <>
                  <p className="font-semibold">
                    <L
                      en="Some bottles are no longer available in the quantity you selected."
                      ja="ご希望の本数をご用意できませんでした。"
                    />
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {shortages.map((s) => {
                      const product = fujisanProducts.find(
                        (p) => p.slug === s.slug,
                      );
                      const name = product
                        ? `${product.name} ${product.variant}`
                        : s.slug;
                      return (
                        <li key={`${s.slug}-${s.ml}`}>
                          {name}（{s.ml}ml）:{" "}
                          {s.available === 0 ? (
                            <L en="sold out" ja="完売" />
                          ) : (
                            <L
                              en={`only ${s.available} left`}
                              ja={`残り ${s.available} 本`}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2">
                    <L
                      en="Please adjust the quantity and try again."
                      ja="数量を調整のうえ、もう一度お試しください。"
                    />
                  </p>
                </>
              ) : (
                <L
                  en="One of the bottles in your cart has just sold out. Please remove it and try again."
                  ja="カート内の商品が完売しました。該当の商品を削除してから、もう一度お試しください。"
                />
              )}
            </div>
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

          {blockedByStock ? (
            <p
              role="alert"
              className="mt-6 border border-crimson/40 bg-crimson/[0.06] px-4 py-3 text-[12px] leading-[1.7] text-crimson"
            >
              <L
                en="Some items in your cart are no longer available in the quantity you selected. Please adjust them above to continue."
                ja="カートの中に、ご指定の本数をご用意できない商品があります。上の表示にしたがって数量を調整してください。"
              />
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={submitting || (!isPending && !loggedIn) || blockedByStock}
            className={`group/btn mt-6 inline-flex w-full items-center justify-center gap-3 px-7 py-4 text-[11px] font-semibold tracking-[0.12em] transition-all ${
              submitting || (!isPending && !loggedIn) || blockedByStock
                ? "cursor-not-allowed border border-indigo/25 bg-indigo/12 text-indigo/45"
                : "cursor-pointer border border-indigo bg-indigo text-paper-card hover:bg-indigo-lift"
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
              </>
            )}
          </button>

          <p className="mt-4 text-[11.5px] leading-[1.7] text-indigo/55">
            <L
              en="Payment is completed securely on the next screen (Stripe). We ship to the address on your account — if none is saved, you'll enter it at checkout."
              ja="お支払いは次の画面（Stripe の安全な決済ページ）で行います。お届け先はご登録の住所になります。未登録の場合は決済画面でご入力いただきます。"
            />
          </p>
        </aside>
      </div>
    </section>
  );
}
