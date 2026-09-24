import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { DeleteAccountButton } from "@/components/fujisan/auth/DeleteAccountButton";
import { AccountSidebar } from "@/components/fujisan/auth/AccountSidebar";
import { ProfileEditForm } from "@/components/fujisan/auth/ProfileEditForm";
import { OrderTimeline } from "@/components/fujisan/auth/OrderTimeline";
import { OrderStatusPill } from "@/components/fujisan/auth/OrderStatusPill";
import { ChangePasswordForm } from "@/components/fujisan/auth/ChangePasswordForm";
import { ChangeEmailForm } from "@/components/fujisan/auth/ChangeEmailForm";
import { getSession } from "@/lib/session";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { listMyOrdersAction } from "@/lib/actions/orders";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { readTradeAccount } from "@/lib/trade";
import type { TradeStatus } from "@/data/fujisan-trade";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";
import { formatDateShortJp, formatMonthEn, formatMonthJp } from "@/lib/format-date";

const yen = new Intl.NumberFormat("ja-JP");

export const metadata = buildMetadata({
  title: "Account",
  description:
    "ご注文の状況、お届け先の登録情報、アカウント設定をご確認いただけます。",
  path: "/account",
  noIndex: true,
});

type AccountSession = {
  id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  role?: string;
  companyName?: string | null;
  phone?: string | null;
  postalCode?: string | null;
  address?: string | null;
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login/personal");
  }

  const user = session.user as AccountSession;
  const isBusiness = user.role === "business";

  // 自分の注文一覧（DBから）
  const orders = await listMyOrdersAction(10);
  // 「進行中」は発送を待っている注文のこと。完了・取消・返金は含めない。
  const activeOrdersCount = orders.filter(
    (o) =>
      o.status !== "delivered" &&
      o.status !== "cancelled" &&
      o.status !== "refunded",
  ).length;

  // 管理者なら admin 動線を表示。owner と staff で文言を出し分ける。
  const adminRole = await getEffectiveAdminRole({
    userId: user.id,
    email: user.email,
  });
  const isAdmin = isStaffOrAbove(adminRole);
  const isOwnerUser = isOwner(adminRole);

  // 法人は審査が通るまで卸価格が出ない。どの段階にいるかをここでも伝える
  // （行が無い＝この機能より前の登録は「審査待ち」として扱う）。
  let tradeStatus: TradeStatus | null = null;
  if (isBusiness && user.id) {
    try {
      tradeStatus = (await readTradeAccount(user.id))?.status ?? "pending";
    } catch {
      tradeStatus = "pending";
    }
  }

  // 登録日と最新の登録情報を DB から取得（セッションは更新が反映されないため）
  let memberSinceJp = "—";
  let memberSinceEn = "—";
  // 表示・編集はセッションではなく DB の最新値を使う
  const profile = {
    name: user.name ?? "",
    email: user.email,
    companyName: user.companyName ?? "",
    phone: user.phone ?? "",
    postalCode: user.postalCode ?? "",
    address: user.address ?? "",
  };
  try {
    const db = await getDb();
    const [rec] = await db
      .select({
        createdAt: userTable.createdAt,
        name: userTable.name,
        companyName: userTable.companyName,
        phone: userTable.phone,
        postalCode: userTable.postalCode,
        address: userTable.address,
      })
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);
    if (rec) {
      profile.name = rec.name ?? profile.name;
      profile.companyName = rec.companyName ?? "";
      profile.phone = rec.phone ?? "";
      profile.postalCode = rec.postalCode ?? "";
      profile.address = rec.address ?? "";
    }
    if (rec?.createdAt) {
      const d = new Date(rec.createdAt);
      memberSinceJp = formatMonthJp(d);
      memberSinceEn = formatMonthEn(d);
    }
  } catch {
    /* DB 失敗時はダッシュを残す */
  }

  const displayName = profile.companyName || profile.name || "—";
  const sidebar = [
    { id: "orders", en: "Orders", ja: "注文・配送" },
    { id: "profile", en: "Profile", ja: "登録情報" },
    { id: "security", en: "Security", ja: "セキュリティ" },
  ];

  return (
    <EditorialPage className="flex flex-col">
      {/* ===== 扉 =====
          丸いアバターや KPI タイルは置かない。名前・区分・状態を
          同じ組みで並べ、罫で仕切るだけにする */}
      <header className="pt-[72px] md:pt-[86px]">
        <div className="ed-wrap ed-wrap-wide pb-10 pt-14 md:pb-12 md:pt-20">
          <p className="ed-label">
            <L
              en={isBusiness ? "Trade account" : "Personal account"}
              ja={isBusiness ? "法人・取扱店" : "個人のお客様"}
            />
          </p>

          <h1 className="ed-title mt-4">
            <L
              en={`Welcome back, ${displayName}.`}
              ja={`${displayName}さま、おかえりなさい。`}
            />
          </h1>

          <p className="ed-small mt-4">
            {user.email}
            <span aria-hidden className="mx-2.5 opacity-40">
              /
            </span>
            <span className={user.emailVerified ? "text-moss" : "text-gold-ink"}>
              {user.emailVerified ? (
                <L en="Email verified" ja="メール認証済み" />
              ) : (
                <L en="Email not verified" ja="メール未認証" />
              )}
            </span>
          </p>

          <dl className="mt-12 grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-4">
            <Fact
              labelEn="Member since"
              labelJa="ご登録"
              valueEn={memberSinceEn}
              valueJa={memberSinceJp}
            />
            <Fact
              labelEn="Account type"
              labelJa="区分"
              valueEn={isBusiness ? "Trade" : "Personal"}
              valueJa={isBusiness ? "法人" : "個人"}
            />
            <Fact
              labelEn="Status"
              labelJa="状態"
              valueEn={user.emailVerified ? "Verified" : "Pending"}
              valueJa={user.emailVerified ? "認証済" : "未認証"}
            />
            <Fact
              labelEn="In progress"
              labelJa="進行中の注文"
              valueEn={
                activeOrdersCount > 0 ? `${activeOrdersCount} order(s)` : "None"
              }
              valueJa={activeOrdersCount > 0 ? `${activeOrdersCount} 件` : "なし"}
            />
          </dl>
        </div>
      </header>

      {/* ===== Dashboard body ===== */}
      <div className="ed-wrap ed-wrap-wide border-t border-[var(--ed-rule)] pb-24 pt-14 md:pb-28 md:pt-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
          <AccountSidebar items={sidebar} />

          <div className="flex flex-col gap-14 md:gap-16">
            {/* ===== 管理者への入り口（対象者のみ・最上部） ===== */}
            {isAdmin && (
              <div
                data-tone="dark"
                className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 bg-indigo px-6 py-6"
              >
                <div>
                  <p className="ed-label">
                    {isOwnerUser ? "蔵元（オーナー）" : "蔵スタッフ"}
                  </p>
                  <p className="ed-p mt-1.5 text-[13px]">
                    {isOwnerUser
                      ? "注文・配送の更新に加えて、メンバーの招待・削除ができます。"
                      : "注文・配送ステータスの更新ができます。"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Link href="/admin/orders" className="ed-btn">
                    注文管理へ
                  </Link>
                  <Link href="/admin/contacts" className="ed-link text-[13px]">
                    お問い合わせ
                  </Link>
                  {isOwnerUser && (
                    <Link href="/admin/team" className="ed-link text-[13px]">
                      メンバー管理
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ===== 取扱店の審査状況（法人のみ） ===== */}
            {isBusiness && tradeStatus !== "approved" && (
              <div className="ed-note">
                <p className="ed-label">
                  {tradeStatus === "rejected" ? "お取引について" : "審査中"}
                </p>
                <p className="ed-p mt-2">
                  {tradeStatus === "rejected" ? (
                    <L
                      en="This account is not currently open for trade pricing. Please contact us if your situation has changed."
                      ja="現在、このアカウントでは卸価格をご案内しておりません。状況が変わりましたら、お問い合わせからご相談ください。"
                    />
                  ) : (
                    <L
                      en="We're reviewing your trade application and will reply within two business days. Wholesale pricing appears once approved."
                      ja="取扱口座のお申し込みを審査しております。2 営業日以内に結果をご連絡します。卸価格は承認後に表示されます。"
                    />
                  )}
                </p>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            <Section id="orders" labelEn="Orders" labelJa="注文・配送">
              {orders.length === 0 ? (
                <div className="border-t border-[var(--ed-rule)] pt-8">
                  <p className="ed-h3">
                    <L en="No orders yet." ja="まだご注文はありません。" />
                  </p>
                  <p className="ed-p mt-3">
                    <L
                      en="Once you place your first order, you'll be able to track its progress here, from preparation to delivery."
                      ja="ご注文後は、発送準備からお届けまでの進行をこちらでご覧いただけます。"
                    />
                  </p>
                  <Link
                    href={isBusiness ? "/shop/business" : "/shop/personal"}
                    className="ed-link mt-7 inline-block text-[13px]"
                  >
                    <L en="Browse the collection" ja="銘柄を見る" />
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="border-t border-[var(--ed-rule)] py-9 first:border-t-0 first:pt-0"
                    >
                      {/* header */}
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold tracking-[0.12em] text-indigo/55">
                            <L en="Order" ja="注文番号" />
                          </span>
                          <Link
                            href={`/account/orders/${o.orderRef}`}
                            className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo underline decoration-indigo/25 underline-offset-4 transition-colors hover:text-gold"
                          >
                            {o.orderRef}
                          </Link>
                          <span className="text-[11.5px] tracking-[0.04em] text-indigo/70">
                            {formatDateShortJp(o.createdAt)} · {o.itemsCount}{" "}
                            <L en="bottle(s)" ja="本" /> · ¥
                            {yen.format(o.total)}
                          </span>
                        </div>
                        <OrderStatusPill status={o.status} />
                      </div>

                      {/* timeline */}
                      <div className="mt-7">
                        <OrderTimeline status={o.status} />
                      </div>

                      {/* items + tracking */}
                      <div className="mt-7 grid grid-cols-1 gap-6 border-t border-indigo/10 pt-6 md:grid-cols-[1.4fr_1fr]">
                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.12em] text-indigo/55">
                            <L en="Items" ja="商品" />
                          </p>
                          <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-indigo/85">
                            {o.items.map((it, i) => (
                              <li key={i} className="flex justify-between gap-4">
                                <span>
                                  {it.name} {it.variant}{" "}
                                  <span className="text-indigo/55">
                                    · {it.ml}ml × {it.qty}
                                  </span>
                                </span>
                                <span>¥{yen.format(it.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-[11px] font-semibold tracking-[0.12em] text-indigo/55">
                            <L en="Shipping" ja="配送先" />
                          </p>
                          <p className="mt-3 text-[12.5px] leading-[1.7] text-indigo/85">
                            〒{o.postalCode}
                            <br />
                            {o.address}
                            <br />
                            {o.customerName} ／ {o.phone}
                          </p>

                          {o.trackingNumber && (
                            <div className="ed-note mt-5">
                              <p className="text-[11px] font-semibold tracking-[0.12em] text-indigo/65">
                                <L en="Tracking" ja="追跡番号" />
                              </p>
                              <p className="mt-1 font-serif text-[13.5px] tracking-[0.02em] text-indigo">
                                {o.trackingCarrier
                                  ? `${o.trackingCarrier} · `
                                  : ""}
                                {o.trackingNumber}
                              </p>
                              {o.shippedAt && (
                                <p className="mt-1 text-[11px] text-indigo/65">
                                  <L en="Shipped" ja="発送日" />:{" "}
                                  {formatDateShortJp(o.shippedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-end border-t border-indigo/10 pt-5">
                        <Link
                          href={`/account/orders/${o.orderRef}`}
                          className="group/detail inline-flex items-center gap-2 text-[11.5px] font-semibold tracking-[0.12em] text-indigo no-underline transition-colors hover:text-gold"
                        >
                          <L en="Order detail and receipt" ja="詳細・領収書" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* ===== PROFILE ===== */}
            <Section id="profile" labelEn="Profile" labelJa="登録情報">
              <ProfileEditForm
                isBusiness={isBusiness}
                initial={profile}
              />
            </Section>

            {/* ===== SECURITY ===== */}
            <Section id="security" labelEn="Security" labelJa="セキュリティ">
              <div className="mb-6">
                <ChangeEmailForm currentEmail={user.email} />
              </div>

              <div className="mb-6">
                <ChangePasswordForm />
              </div>

              <div className="border-t border-[var(--ed-rule)] pt-8">
                <h3 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo">
                  <L en="Sign out" ja="ログアウト" />
                </h3>
                <p className="mt-3 max-w-[60ch] text-[12.5px] leading-[1.75] text-indigo/72">
                  <L
                    en="Sign out of this device. You can sign back in any time with your email."
                    ja="この端末からログアウトします。再度ログインすればいつでもご利用いただけます。"
                  />
                </p>
                <div className="mt-5">
                  <LogoutButton />
                </div>
              </div>

              <div className="mt-6">
                <DeleteAccountButton />
              </div>
            </Section>
          </div>
        </div>
      </div>

    </EditorialPage>
  );
}

// ---------- subcomponents ----------

function Fact({
  labelEn,
  labelJa,
  valueEn,
  valueJa,
}: {
  labelEn: string;
  labelJa: string;
  valueEn: string;
  valueJa: string;
}) {
  return (
    <div className="border-t border-[var(--ed-rule)] pt-3">
      <dt className="ed-label">
        <L en={labelEn} ja={labelJa} />
      </dt>
      <dd className="mt-1.5 font-serif text-[15px] tracking-[0.02em] text-indigo md:text-[16px]">
        <L en={valueEn} ja={valueJa} />
      </dd>
    </div>
  );
}

function Section({
  id,
  labelEn,
  labelJa,
  children,
}: {
  id: string;
  labelEn: string;
  labelJa: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[110px]">
      <h2 className="ed-label border-b border-[var(--ed-rule-strong)] pb-3">
        <L en={labelEn} ja={labelJa} />
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}



