"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCart } from "@/lib/cart/useCart";
import { shippingFee } from "@/lib/cart/cart-core";
import { useSession } from "@/lib/auth-client";
import { checkoutSchema, getFieldErrors } from "@/lib/validation/forms";
import type { FieldErrorKey } from "@/lib/validation/forms";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { FieldError } from "@/components/fujisan/FieldError";
import { UNDERAGE_NOTICE_EN, UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

const yen = new Intl.NumberFormat("ja-JP");

const fieldClass =
  "w-full border-b border-[#0B1A2E]/30 bg-transparent py-3 text-[15px] text-[#0B1A2E] outline-none transition-colors placeholder:text-[#0B1A2E]/40 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A] aria-[invalid=true]:focus:border-[#8B1A1A]";

const labelClass =
  "block text-[10.5px] font-semibold tracking-[0.24em] text-[#0B1A2E]/65";

type CompletedOrder = { ref: string; total: number; count: number };

function makeOrderRef(): string {
  return `FJ-${Date.now().toString(36).toUpperCase()}`;
}

export function CheckoutView() {
  const { ready, lines, count, subtotal, clear } = useCart();
  const { data: session } = useSession();

  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const [errors, setErrors] = useState<Record<string, FieldErrorKey>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<CompletedOrder | null>(null);

  // 郵便番号→住所の自動入力。自分が補完した値は上書きするが、
  // ユーザーが手入力した住所は壊さない（autofilledRef で判定）。
  const [addrLoading, setAddrLoading] = useState(false);
  const autofilledRef = useRef("");

  const onPostalChange = (raw: string) => {
    setPostalCode(raw);
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length !== 7) return;
    setAddrLoading(true);
    fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`)
      .then((res) => res.json())
      .then((json) => {
        const results = (
          json as {
            results?: Array<
              Record<"address1" | "address2" | "address3", string>
            >;
          }
        )?.results;
        const r = results?.[0];
        if (!r) return;
        const filled = `${r.address1}${r.address2}${r.address3}`;
        setAddress((cur) =>
          !cur || cur === autofilledRef.current ? filled : cur,
        );
        autofilledRef.current = filled;
      })
      .catch(() => {
        // ネットワーク不通・APIエラー時は自動入力をスキップ（手入力は可能）
      })
      .finally(() => setAddrLoading(false));
  };

  // ログイン済みなら氏名・メールを一度だけ補完する。effect ではなく描画中に
  // 同期する React 推奨パターン（FujisanNavClient の prevPathname と同様）。
  // ユーザーが入力済みの値は上書きしない。
  const [appliedSessionEmail, setAppliedSessionEmail] = useState<string | null>(
    null,
  );
  const sessionUser = session?.user;
  if (sessionUser?.email && appliedSessionEmail !== sessionUser.email) {
    setAppliedSessionEmail(sessionUser.email);
    setName((cur) => cur || sessionUser.name || "");
    setEmail((cur) => cur || sessionUser.email);
  }

  const shipping = shippingFee(subtotal);
  const total = subtotal + shipping;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const data = { name, email, postalCode, address, phone, ageConfirmed };
    const found = getFieldErrors(checkoutSchema, data);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      scrollToFirstError(formRef.current);
      return;
    }

    // モック決済: 実際の請求は行わず、確定演出のみ。
    setSubmitting(true);
    window.setTimeout(() => {
      setCompleted({ ref: makeOrderRef(), total, count });
      clear();
      setSubmitting(false);
    }, 800);
  };

  // 復元前
  if (!ready && !completed) {
    return (
      <section className="bg-[#FAF5E8]">
        <div className="mx-auto min-h-[40vh] max-w-[1280px] px-7 py-20 md:px-12" />
      </section>
    );
  }

  // 注文完了
  if (completed) {
    return (
      <section className="bg-[#FAF5E8]">
        <div className="mx-auto max-w-[760px] px-7 py-24 text-center md:px-12 md:py-32">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#C9A84C]">
            <L en="ORDER CONFIRMED" ja="ご注文を承りました" />
          </p>
          <h2 className="mt-5 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            <L en="Thank you." ja="ありがとうございます。" />
          </h2>
          <p className="mx-auto mt-5 max-w-[480px] text-[13.5px] leading-[1.8] text-[#1D2432]/78">
            <L
              en="We've received your order and sent a confirmation to your email. Bottles are hand-checked at the kura and dispatched within two business days."
              ja="ご注文を承り、確認メールをお送りしました。蔵でひとつずつ検品し、原則 2 営業日以内に発送いたします。"
            />
          </p>

          <div className="mx-auto mt-9 max-w-[360px] border border-[#0B1A2E]/15 bg-[#F8F3E7] px-7 py-6 text-left">
            <div className="flex items-center justify-between text-[12px]">
              <span className="tracking-[0.18em] text-[#0B1A2E]/60">
                <L en="ORDER No." ja="注文番号" />
              </span>
              <span className="font-serif text-[15px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                {completed.ref}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-3 text-[12px]">
              <span className="tracking-[0.18em] text-[#0B1A2E]/60">
                <L en="TOTAL PAID" ja="お支払い合計" />
              </span>
              <span className="font-serif text-[15px] font-semibold text-[#0B1A2E]">
                ¥{yen.format(completed.total)}
              </span>
            </div>
          </div>

          <p className="mt-6 text-[10.5px] tracking-[0.12em] text-[#0B1A2E]/45">
            <L
              en="Demo checkout — no real payment was processed."
              ja="デモ用のお手続きです。実際の決済・請求は行われていません。"
            />
          </p>

          <Link
            href="/shop/personal"
            className="group/btn mt-9 inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-[#F8F3E7] no-underline transition-colors hover:bg-[#1D2432]"
          >
            <L en="BACK TO THE SHOP" ja="ショップへ戻る" />
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover/btn:translate-x-1"
            >
              →
            </span>
          </Link>
        </div>
      </section>
    );
  }

  // カートが空
  if (lines.length === 0) {
    return (
      <section className="bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1280px] px-7 py-24 text-center md:px-12 md:py-32">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/55">
            <L en="NOTHING TO CHECK OUT" ja="お手続きできる商品がありません" />
          </p>
          <h2 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            <L en="Your cart is empty." ja="カートは空です。" />
          </h2>
          <Link
            href="/shop/personal"
            className="group/btn mt-9 inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.32em] text-[#F8F3E7] no-underline transition-colors hover:bg-[#1D2432]"
          >
            <L en="BROWSE THE COLLECTION" ja="コレクションを見る" />
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#FAF5E8]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-7 py-16 md:px-12 md:py-20 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        {/* Form */}
        <form ref={formRef} noValidate onSubmit={handleSubmit}>
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="SHIPPING DETAILS" ja="お届け先" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="co-name" className={labelClass}>
                <L en="FULL NAME" ja="お名前" />
              </label>
              <input
                id="co-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={errors.name ? "true" : undefined}
                autoComplete="name"
                className={`mt-2 ${fieldClass}`}
                placeholder="佐々木 優子"
              />
              <FieldError error={errors.name} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="co-email" className={labelClass}>
                <L en="EMAIL" ja="メールアドレス" />
              </label>
              <input
                id="co-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={errors.email ? "true" : undefined}
                autoComplete="email"
                className={`mt-2 ${fieldClass}`}
                placeholder="you@example.com"
              />
              <FieldError error={errors.email} />
            </div>

            <div>
              <label htmlFor="co-postal" className={labelClass}>
                <L en="POSTAL CODE" ja="郵便番号" />
              </label>
              <input
                id="co-postal"
                value={postalCode}
                onChange={(e) => onPostalChange(e.target.value)}
                aria-invalid={errors.postalCode ? "true" : undefined}
                autoComplete="postal-code"
                inputMode="numeric"
                className={`mt-2 ${fieldClass}`}
                placeholder="417-0051"
              />
              <FieldError error={errors.postalCode} />
              <p className="mt-1.5 text-[10px] leading-[1.5] tracking-[0.04em] text-[#0B1A2E]/45">
                <L
                  en="Enter 7 digits to auto-fill your address."
                  ja="7桁を入力すると住所を自動入力します。"
                />
              </p>
            </div>

            <div>
              <label htmlFor="co-phone" className={labelClass}>
                <L en="PHONE" ja="電話番号" />
              </label>
              <input
                id="co-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={errors.phone ? "true" : undefined}
                autoComplete="tel"
                className={`mt-2 ${fieldClass}`}
                placeholder="03-xxxx-xxxx"
              />
              <FieldError error={errors.phone} />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="co-address" className={labelClass}>
                <L en="ADDRESS" ja="ご住所" />
                {addrLoading ? (
                  <span className="ml-2 font-normal tracking-[0.04em] text-[#C9A84C]">
                    <L en="looking up…" ja="住所を検索中…" />
                  </span>
                ) : null}
              </label>
              <input
                id="co-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                aria-invalid={errors.address ? "true" : undefined}
                autoComplete="street-address"
                className={`mt-2 ${fieldClass}`}
                placeholder="静岡県富士市吉原 2-8-21"
              />
              <FieldError error={errors.address} />
            </div>
          </div>

          {/* 年齢確認・未成年防止表示 */}
          <p className="mt-12 font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="AGE VERIFICATION" ja="年齢確認" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <div
            role="note"
            aria-label="未成年飲酒防止のお知らせ"
            className="mt-6 border border-[#C9A84C]/35 bg-[#F4ECD9]/80 px-5 py-4 text-[12.5px] leading-[1.7] text-[#1D2432]/86"
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

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-[1.6] text-[#0B1A2E]/85 select-none">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              aria-invalid={errors.ageConfirmed ? "true" : undefined}
              className="mt-[3px] h-4 w-4 cursor-pointer border-[#0B1A2E]/40 accent-[#0B1A2E]"
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
          <FieldError error={errors.ageConfirmed} />

          {/* モック決済 */}
          <p className="mt-12 font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="PAYMENT" ja="お支払い" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />
          <div className="mt-6 border border-dashed border-[#0B1A2E]/30 bg-[#F8F3E7] px-5 py-5 text-[12.5px] leading-[1.7] text-[#1D2432]/82">
            <L
              en="This is a demo checkout. No payment provider is connected yet, so placing the order will not charge any card."
              ja="これはデモ用のお手続きです。決済サービスは未接続のため、ご注文を確定してもカードへの請求は発生しません。"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-9 inline-flex w-full items-center justify-center gap-3 px-7 py-4 text-[11px] font-semibold tracking-[0.28em] transition-all ${
              submitting
                ? "cursor-not-allowed border border-[#0B1A2E]/25 bg-[#0B1A2E]/12 text-[#0B1A2E]/45"
                : "cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] text-[#F8F3E7] hover:bg-[#1D2432]"
            }`}
          >
            {submitting ? (
              <L en="PLACING ORDER…" ja="処理しています…" />
            ) : (
              <>
                <L
                  en={`PLACE ORDER · ¥${yen.format(total)}`}
                  ja={`注文を確定する · ¥${yen.format(total)}`}
                />
                <span aria-hidden>→</span>
              </>
            )}
          </button>
        </form>

        {/* Order summary */}
        <aside className="h-fit border border-[#0B1A2E]/12 bg-[#F8F3E7] px-7 py-9 lg:sticky lg:top-[104px]">
          <p className="font-serif text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/66">
            <L en="ORDER SUMMARY" ja="ご注文内容" />
          </p>
          <div className="mt-4 h-px w-8 bg-[#0B1A2E]/30" />

          <ul className="mt-6 space-y-4">
            {lines.map(({ slug, qty, product }) => (
              <li key={slug} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-[13.5px] font-semibold tracking-[0.06em] text-[#0B1A2E]">
                    {product.name}
                    <span className="ml-2 text-[12px] font-normal text-[#0B1A2E]/55">
                      × {qty}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[10.5px] tracking-[0.14em] text-[#0B1A2E]/55">
                    <L en={product.variantLine} ja={product.variantLineJp} />
                  </p>
                </div>
                <p className="shrink-0 font-serif text-[13.5px] font-semibold text-[#0B1A2E]">
                  ¥{yen.format(product.priceJpy * qty)}
                </p>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-3 border-t border-[#0B1A2E]/12 pt-5 text-[13px] text-[#1D2432]/85">
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

          <div className="mt-5 flex items-baseline justify-between border-t border-[#0B1A2E]/15 pt-5">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#0B1A2E]/70">
              <L en="TOTAL" ja="合計" />
            </p>
            <p className="font-serif text-[24px] font-semibold tracking-[0.02em] text-[#0B1A2E]">
              ¥{yen.format(total)}
            </p>
          </div>

          <Link
            href="/cart"
            className="group/link mt-7 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-[#0B1A2E]/70 no-underline transition-colors hover:text-[#0B1A2E]"
          >
            <span aria-hidden>←</span>
            <L en="BACK TO CART" ja="カートへ戻る" />
          </Link>
        </aside>
      </div>
    </section>
  );
}
