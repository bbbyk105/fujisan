import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { DeleteAccountButton } from "@/components/fujisan/auth/DeleteAccountButton";
import { ProfileEditForm } from "@/components/fujisan/auth/ProfileEditForm";
import { OrderTimeline } from "@/components/fujisan/auth/OrderTimeline";
import { OrderStatusPill } from "@/components/fujisan/auth/OrderStatusPill";
import { ChangePasswordForm } from "@/components/fujisan/auth/ChangePasswordForm";
import { ChangeEmailForm } from "@/components/fujisan/auth/ChangeEmailForm";
import type { OrderRecord } from "@/lib/actions/orders";
import type { TradeStatus } from "@/data/fujisan-trade";
import { L } from "@/i18n/Localized";
import { formatDateShortJp } from "@/lib/format-date";

const yen = new Intl.NumberFormat("ja-JP");

export type AccountTab = "orders" | "profile" | "security";

export const ACCOUNT_TABS: AccountTab[] = ["orders", "profile", "security"];

/** 発送を待っている注文。完了・取消・返金は「履歴」に回す */
const isActive = (o: OrderRecord) =>
  o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded";

type Props = {
  tab: AccountTab;
  isBusiness: boolean;
  displayName: string;
  email: string;
  emailVerified: boolean;
  orders: OrderRecord[];
  /** 管理者なら管理画面への入口を出す */
  admin: { isOwner: boolean } | null;
  tradeStatus: TradeStatus | null;
  profile: ComponentProps<typeof ProfileEditForm>["initial"];
};

/**
 * アカウント画面の本文。取得・認可はページ側が担い、ここは表示だけを持つ
 * （実データなしで見た目を確かめられるように分けてある）。
 *
 * 以前は注文・登録情報・セキュリティを 1 枚に縦に積んでいたため、注文が増えると
 * 登録情報とセキュリティが画面のはるか下に埋もれた。**タブで 1 画面 1 用件にする。**
 */
export function AccountView({
  tab,
  isBusiness,
  displayName,
  email,
  emailVerified,
  orders,
  admin,
  tradeStatus,
  profile,
}: Props) {
  const active = orders.filter(isActive);

  const tabs: { key: AccountTab; label: ReactNode; count?: number }[] = [
    {
      key: "orders",
      label: <L en="Orders" ja="注文・配送" />,
      count: active.length || undefined,
    },
    { key: "profile", label: <L en="Profile" ja="登録情報" /> },
    { key: "security", label: <L en="Security" ja="ログインと退会" /> },
  ];

  return (
    <EditorialPage className="flex flex-col">
      {/* ===== 扉 — 名前と連絡先だけ。区分・状態を数字の升目にして並べない ===== */}
      <header className="pt-[72px] md:pt-[86px]">
        <div className="ed-wrap pt-12 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div>
              <p className="text-[13px] text-indigo/60">
                <L
                  en={isBusiness ? "Trade account" : "Personal account"}
                  ja={isBusiness ? "法人・取扱店のお客様" : "個人のお客様"}
                />
              </p>
              <h1 className="mt-2 font-serif text-[clamp(24px,3vw,32px)] font-medium leading-[1.35] text-indigo">
                <L en={displayName} ja={`${displayName} さま`} />
              </h1>
              <p className="mt-2 text-[13.5px] text-indigo/65">
                {email}
                {!emailVerified ? (
                  <span className="ml-3 font-semibold text-gold-ink">
                    <L en="Email not verified" ja="メール未認証" />
                  </span>
                ) : null}
              </p>
            </div>

            {admin ? (
              <Link
                href="/admin"
                className="text-[13.5px] text-indigo underline decoration-indigo/30 underline-offset-4 transition-colors hover:decoration-gold"
              >
                {admin.isOwner ? "管理画面（蔵元）を開く" : "管理画面を開く"}
              </Link>
            ) : null}
          </div>

          {/* ===== タブ ===== */}
          <nav aria-label="アカウントのメニュー" className="mt-10 border-b border-indigo/15">
            <ul className="-mb-px flex gap-8 overflow-x-auto md:gap-10">
              {tabs.map((t) => {
                const on = t.key === tab;
                return (
                  <li key={t.key} className="shrink-0">
                    <Link
                      href={t.key === "orders" ? "/account" : `/account?tab=${t.key}`}
                      aria-current={on ? "page" : undefined}
                      className={`block border-b-2 pb-3.5 text-[15px] no-underline transition-colors ${
                        on
                          ? "border-indigo font-semibold text-indigo"
                          : "border-transparent text-indigo/55 hover:text-indigo"
                      }`}
                    >
                      {t.label}
                      {t.count ? (
                        <span className="ml-2 text-[12.5px] font-normal tabular-nums text-gold-ink">
                          <L en={`${t.count} in progress`} ja={`進行中 ${t.count}`} />
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <div className="ed-wrap flex-1 pb-24 pt-12 md:pb-28 md:pt-14">
        {/* 法人は審査が通るまで卸価格が出ない。どの段階にいるかをどのタブでも伝える */}
        {isBusiness && tradeStatus !== "approved" ? (
          <div className="ed-note mb-12">
            <p className="ed-label">
              {tradeStatus === "rejected" ? (
                <L en="About your trade account" ja="お取引について" />
              ) : (
                <L en="Under review" ja="取扱口座の審査中" />
              )}
            </p>
            <p className="ed-p mt-2">
              {tradeStatus === "rejected" ? (
                <L
                  en="This account is not currently open for trade pricing. Please contact us if your situation has changed."
                  ja="現在、このアカウントでは卸価格をご案内しておりません。ご状況が変わりましたら、お問い合わせよりご相談ください。"
                />
              ) : (
                <L
                  en="We're reviewing your trade application and will reply within two business days. Wholesale pricing appears once approved."
                  ja="取扱口座のお申し込みを審査しております。2営業日以内に結果をご連絡します。卸価格は承認後に表示されます。"
                />
              )}
            </p>
          </div>
        ) : null}

        {tab === "orders" ? (
          <OrdersTab orders={orders} active={active} isBusiness={isBusiness} />
        ) : tab === "profile" ? (
          <ProfileEditForm isBusiness={isBusiness} initial={profile} />
        ) : (
          <SecurityTab email={email} />
        )}
      </div>
    </EditorialPage>
  );
}

// ---------- 注文 ----------

/** 「将軍 純米大吟醸 300ml ほか 2 点」— 1 行で中身が分かる程度に縮める */
function summarize(o: OrderRecord) {
  const [first, ...rest] = o.items;
  if (!first) return { ja: "—", en: "—" };
  const head = `${first.name} ${first.variant} ${first.ml}ml`;
  return rest.length
    ? { ja: `${head} ほか ${rest.length} 点`, en: `${head} + ${rest.length} more` }
    : { ja: head, en: head };
}

function OrdersTab({
  orders,
  active,
  isBusiness,
}: {
  orders: OrderRecord[];
  active: OrderRecord[];
  isBusiness: boolean;
}) {
  if (orders.length === 0) {
    return (
      <div>
        <p className="font-serif text-[18px] font-medium text-indigo">
          <L en="No orders yet." ja="まだご注文はありません。" />
        </p>
        <p className="mt-3 max-w-[56ch] text-[14px] leading-[1.9] text-indigo/75">
          <L
            en="Once you place your first order, you'll be able to track it here — from preparation to your door."
            ja="ご注文後は、発送の準備からお届けまでの進み具合をここでご覧いただけます。"
          />
        </p>
        <Link
          href={isBusiness ? "/shop/business" : "/shop/personal"}
          className="ed-btn mt-8"
        >
          <L en="Browse the collection" ja="銘柄を見る" />
        </Link>
      </div>
    );
  }

  const history = orders.filter((o) => !isActive(o));

  return (
    <div className="flex flex-col gap-16">
      {active.length > 0 ? (
        <section>
          <h2 className="border-b border-indigo/20 pb-3 font-serif text-[18px] font-medium text-indigo">
            <L en="In progress" ja="お届けまでの状況" />
          </h2>
          <ul>
            {active.map((o) => (
              <li key={o.id} className="border-b border-indigo/10 py-7">
                <OrderLineRow o={o} />
                {/* 進行中の注文だけ、いまどこまで進んだかを出す */}
                <div className="mt-6 max-w-[640px]">
                  <OrderTimeline status={o.status} />
                </div>
                {o.trackingNumber ? (
                  <p className="mt-5 text-[13.5px] text-indigo/80">
                    <span className="text-indigo/55">
                      <L en="Tracking" ja="追跡番号" />
                    </span>
                    <span className="ml-3 font-serif tabular-nums text-indigo">
                      {o.trackingCarrier ? `${o.trackingCarrier} ` : ""}
                      {o.trackingNumber}
                    </span>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {history.length > 0 ? (
        <section>
          <h2 className="border-b border-indigo/20 pb-3 font-serif text-[18px] font-medium text-indigo">
            <L en="Order history" ja="ご注文の履歴" />
          </h2>
          <ul>
            {history.map((o) => (
              <li key={o.id} className="border-b border-indigo/10 py-5">
                <OrderLineRow o={o} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

/**
 * 注文 1 件。左に「いつ・何を」、右に「いくら・どうなったか」。
 * 金額と状態が右端に縦一列で揃うので、件数が増えても目で追える。
 */
function OrderLineRow({ o }: { o: OrderRecord }) {
  const sum = summarize(o);
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-[13px] tabular-nums text-indigo/55">
          {formatDateShortJp(o.createdAt)}
        </p>
        <Link
          href={`/account/orders/${o.orderRef}`}
          className="mt-1 inline-block font-serif text-[16px] tabular-nums text-indigo underline decoration-indigo/25 underline-offset-4 transition-colors hover:decoration-gold"
        >
          {o.orderRef}
        </Link>
        <p className="mt-1 truncate text-[14px] text-indigo/75">
          <L en={sum.en} ja={sum.ja} />
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-serif text-[17px] tabular-nums text-indigo">
          ¥{yen.format(o.total)}
        </p>
        <div className="mt-1.5">
          <OrderStatusPill status={o.status} />
        </div>
      </div>
    </div>
  );
}

// ---------- ログインと退会 ----------

function SecurityTab({ email }: { email: string }) {
  return (
    // 各項目は上の罫で区切るが、先頭だけはタブの下線と二重になるので外す
    <div className="flex max-w-[760px] flex-col gap-14 [&>*:first-child]:border-t-0 [&>*:first-child]:pt-0">
      <ChangeEmailForm currentEmail={email} />
      <ChangePasswordForm />

      <section className="border-t border-indigo/15 pt-8">
        <h3 className="font-serif text-[18px] font-medium text-indigo">
          <L en="Sign out" ja="ログアウト" />
        </h3>
        <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.9] text-indigo/75">
          <L
            en="Sign out of this device. You can sign back in any time with your email."
            ja="この端末からログアウトします。再度ログインすれば、いつでもご利用いただけます。"
          />
        </p>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>

      <DeleteAccountButton />
    </div>
  );
}
