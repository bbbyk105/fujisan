import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { DeleteAccountButton } from "@/components/fujisan/auth/DeleteAccountButton";
import { AccountSidebar } from "@/components/fujisan/auth/AccountSidebar";
import { ProfileEditForm } from "@/components/fujisan/auth/ProfileEditForm";
import { OrderTimeline } from "@/components/fujisan/auth/OrderTimeline";
import { getSession } from "@/lib/session";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { listMyOrdersAction } from "@/lib/actions/orders";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { L } from "@/i18n/Localized";

const yen = new Intl.NumberFormat("ja-JP");

export const metadata = {
  title: "Account — FUJISAN SAKE",
};

type AccountSession = {
  id: string;
  name?: string;
  email: string;
  emailVerified?: boolean;
  role?: string;
  companyName?: string | null;
  phone?: string | null;
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
  const activeOrdersCount = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled",
  ).length;

  // 管理者なら admin 動線を表示。owner と staff で文言を出し分ける。
  const adminRole = await getEffectiveAdminRole({
    userId: user.id,
    email: user.email,
  });
  const isAdmin = isStaffOrAbove(adminRole);
  const isOwnerUser = isOwner(adminRole);

  // 登録日と最新の登録情報を DB から取得（セッションは更新が反映されないため）
  let memberSinceJp = "—";
  let memberSinceEn = "—";
  // 表示・編集はセッションではなく DB の最新値を使う
  const profile = {
    name: user.name ?? "",
    email: user.email,
    companyName: user.companyName ?? "",
    phone: user.phone ?? "",
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
        address: userTable.address,
      })
      .from(userTable)
      .where(eq(userTable.id, user.id))
      .limit(1);
    if (rec) {
      profile.name = rec.name ?? profile.name;
      profile.companyName = rec.companyName ?? "";
      profile.phone = rec.phone ?? "";
      profile.address = rec.address ?? "";
    }
    if (rec?.createdAt) {
      const d = new Date(rec.createdAt);
      memberSinceJp = new Intl.DateTimeFormat("ja-JP", {
        year: "numeric",
        month: "long",
      }).format(d);
      memberSinceEn = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
      }).format(d);
    }
  } catch {
    /* DB 失敗時はダッシュを残す */
  }

  const displayName = profile.companyName || profile.name || "—";
  const initial = (profile.companyName || profile.name || user.email || "F")
    .trim()
    .charAt(0)
    .toUpperCase();

  const sidebar = [
    { id: "overview", number: "01", en: "OVERVIEW", ja: "概要" },
    { id: "orders", number: "02", en: "ORDERS", ja: "注文・配送" },
    { id: "profile", number: "03", en: "PROFILE", ja: "登録情報" },
    { id: "shopping", number: "04", en: "SHOPPING", ja: "お買い物" },
    { id: "security", number: "05", en: "SECURITY", ja: "セキュリティ" },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* ===== Header band ===== */}
      <section
        className={`${
          isBusiness ? "bg-[#0B1A2E]" : "bg-[#1B130A]"
        } fujisan-dark-panel relative text-[#F2E4C7]`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-7 pb-12 pt-[124px] md:flex-row md:items-end md:justify-between md:px-12 md:pb-14 md:pt-[150px]">
          <div className="flex items-center gap-5">
            {/* Avatar (initial) */}
            <span
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[#E2C97E]/55 bg-[#E2C97E]/[0.08] font-serif text-[24px] font-semibold text-[#E2C97E] md:h-20 md:w-20 md:text-[28px]"
            >
              {initial}
            </span>
            <div className="flex flex-col gap-2">
              <span
                className={`inline-flex w-fit items-center gap-2 px-3 py-1.5 text-[10px] font-semibold tracking-[0.24em] ${
                  isBusiness
                    ? "bg-[#E2C97E] text-[#0B1A2E]"
                    : "border border-[#E2C97E]/55 text-[#E2C97E]"
                }`}
              >
                {isBusiness
                  ? "法人・取扱店 · TRADE"
                  : "個人のお客様 · PERSONAL"}
              </span>
              <h1 className="font-serif text-[clamp(22px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.04em] text-[#F2E4C7]">
                <L
                  en={`Welcome back, ${displayName}.`}
                  ja={`${displayName}さま、おかえりなさい。`}
                />
              </h1>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] tracking-[0.02em] text-[#F2E4C7]/70">
                <span>{user.email}</span>
                <span className="text-[#F2E4C7]/30">·</span>
                <span
                  className={
                    user.emailVerified ? "text-[#9FCB9F]" : "text-[#E2C97E]"
                  }
                >
                  {user.emailVerified ? (
                    <L en="Email verified" ja="メール認証済み" />
                  ) : (
                    <L en="Email not verified" ja="メール未認証" />
                  )}
                </span>
              </p>
            </div>
          </div>

          {/* Quick stats — small inline KPI band */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 md:gap-x-10">
            <Kpi
              labelEn="MEMBER SINCE"
              labelJa="ご登録"
              valueEn={memberSinceEn}
              valueJa={memberSinceJp}
            />
            <Kpi
              labelEn="ACCOUNT TYPE"
              labelJa="区分"
              valueEn={isBusiness ? "Trade" : "Personal"}
              valueJa={isBusiness ? "法人" : "個人"}
            />
            <Kpi
              labelEn="STATUS"
              labelJa="状態"
              valueEn={user.emailVerified ? "Verified" : "Pending"}
              valueJa={user.emailVerified ? "認証済" : "未認証"}
              accent={user.emailVerified ? "good" : "warn"}
            />
            <Kpi
              labelEn="IN PROGRESS"
              labelJa="進行中の注文"
              valueEn={
                activeOrdersCount > 0 ? `${activeOrdersCount} order(s)` : "None"
              }
              valueJa={activeOrdersCount > 0 ? `${activeOrdersCount} 件` : "なし"}
              accent={activeOrdersCount > 0 ? "warn" : undefined}
            />
          </dl>
        </div>
      </section>

      {/* ===== Dashboard body ===== */}
      <div className="mx-auto max-w-[1280px] px-7 pb-24 pt-12 md:px-12 md:pb-28 md:pt-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16">
          <AccountSidebar items={sidebar} />

          <div className="flex flex-col gap-14 md:gap-16">
            {/* ===== 管理者への入り口（対象者のみ・最上部） ===== */}
            {isAdmin && (
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border border-[#0B1A2E]/30 bg-[#0B1A2E] px-6 py-5 text-[#F2E4C7]">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-[#E2C97E]">
                    {isOwnerUser
                      ? "KURAMOTO · 蔵元（オーナー）"
                      : "KURA STAFF · 蔵スタッフ"}
                  </span>
                  <span className="text-[12.5px] tracking-[0.02em] text-[#F2E4C7]/82">
                    {isOwnerUser
                      ? "注文・配送の更新に加えて、メンバーの招待・削除ができます。"
                      : "注文・配送ステータスの更新ができます。"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/admin/orders"
                    className="group/admin inline-flex items-center gap-3 border border-[#E2C97E]/55 bg-[#E2C97E]/[0.08] px-6 py-3 text-[10.5px] font-semibold tracking-[0.32em] text-[#E2C97E] no-underline transition-colors hover:border-[#E2C97E] hover:bg-[#E2C97E]/15"
                  >
                    注文管理へ
                    <span
                      aria-hidden
                      className="transition-transform duration-500 group-hover/admin:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                  {isOwnerUser && (
                    <Link
                      href="/admin/team"
                      className="group/team inline-flex items-center gap-3 border border-[#E2C97E]/55 bg-transparent px-6 py-3 text-[10.5px] font-semibold tracking-[0.32em] text-[#E2C97E] no-underline transition-colors hover:border-[#E2C97E] hover:bg-[#E2C97E]/10"
                    >
                      メンバー管理
                      <span
                        aria-hidden
                        className="transition-transform duration-500 group-hover/team:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ===== OVERVIEW ===== */}
            <Section id="overview" labelEn="OVERVIEW" labelJa="概要">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryCard
                  num="01"
                  titleEn="Your verification status"
                  titleJa="メール認証ステータス"
                  bodyEn={
                    user.emailVerified
                      ? "All set — verified. You can place orders and view trade pricing where applicable."
                      : "Open the confirmation link we sent to your inbox to finish verification."
                  }
                  bodyJa={
                    user.emailVerified
                      ? "認証は完了しています。ご注文・卸価格のご利用が可能です。"
                      : "受信メール内の確認リンクを開いてご認証を完了してください。"
                  }
                  tone={user.emailVerified ? "good" : "warn"}
                />
                {orders.length > 0 ? (
                  <div className="flex flex-col gap-4 border border-[#0B1A2E]/12 bg-[#F1E6CB]/40 px-7 py-7">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
                        02
                      </span>
                      <StatusPill status={orders[0].status} />
                    </div>
                    <div>
                      <h3 className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                        <L en="Your latest order" ja="直近のご注文" />
                      </h3>
                      <p className="mt-2 text-[12px] leading-[1.75] text-[#1D2432]/72">
                        {orders[0].orderRef} ·{" "}
                        {formatOrderDate(orders[0].createdAt)} ·{" "}
                        {orders[0].itemsCount} <L en="bottle(s)" ja="本" /> · ¥
                        {yen.format(orders[0].total)}
                      </p>
                      <a
                        href="#orders"
                        className="group/latest mt-3 inline-flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.28em] text-[#0B1A2E] no-underline"
                      >
                        <span className="relative pb-0.5">
                          <L en="TRACK PROGRESS" ja="配送状況を見る" />
                          <span className="absolute inset-x-0 bottom-0 h-px bg-[#0B1A2E]/45 transition-colors duration-500 group-hover/latest:bg-[#C9A84C]" />
                        </span>
                        <span
                          aria-hidden
                          className="transition-transform duration-500 group-hover/latest:translate-x-1 group-hover/latest:text-[#C9A84C]"
                        >
                          →
                        </span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <ActionCard
                    num="02"
                    href={isBusiness ? "/shop/business" : "/products"}
                    titleEn="Find your first bottle"
                    titleJp="最初の一本を選ぶ"
                    descEn="Five expressions of Fujisan, brewed at the foot of the mountain."
                    descJp="富士の麓で醸す、五つの銘柄からお選びください。"
                  />
                )}
              </div>
            </Section>

            {/* ===== ORDERS ===== */}
            <Section id="orders" labelEn="ORDERS" labelJa="注文・配送">
              {orders.length === 0 ? (
                <div className="border border-dashed border-[#0B1A2E]/22 bg-paper/55 px-7 py-12 text-center md:py-16">
                  <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                    <L
                      en="No orders yet."
                      ja="まだご注文はありません。"
                    />
                  </p>
                  <p className="mx-auto mt-3 max-w-[42ch] text-[12.5px] leading-[1.75] text-[#1D2432]/70">
                    <L
                      en="Once you place your first order, you'll be able to track its progress here — from preparation to your door."
                      ja="ご注文後は、発送準備からお届けまでの進行をこちらでご覧いただけます。"
                    />
                  </p>
                  <Link
                    href={isBusiness ? "/shop/business" : "/shop/personal"}
                    className="group/cta mt-7 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.32em] text-[#0B1A2E] no-underline"
                  >
                    <span className="relative pb-1">
                      <L en="BROWSE THE COLLECTION" ja="銘柄を見る" />
                      <span className="absolute inset-x-0 bottom-0 h-px bg-[#0B1A2E]/45 transition-all duration-500 group-hover/cta:bg-[#C9A84C]" />
                    </span>
                    <span
                      aria-hidden
                      className="transition-transform duration-500 group-hover/cta:translate-x-1 group-hover/cta:text-[#C9A84C]"
                    >
                      →
                    </span>
                  </Link>
                </div>
              ) : (
                <ul className="flex flex-col gap-6">
                  {orders.map((o) => (
                    <li
                      key={o.id}
                      className="border border-[#0B1A2E]/12 bg-paper/65 px-6 py-7 md:px-8 md:py-8"
                    >
                      {/* header */}
                      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/55">
                            <L en="ORDER" ja="注文番号" />
                          </span>
                          <span className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                            {o.orderRef}
                          </span>
                          <span className="text-[11.5px] tracking-[0.04em] text-[#1D2432]/70">
                            {formatOrderDate(o.createdAt)} · {o.itemsCount}{" "}
                            <L en="bottle(s)" ja="本" /> · ¥
                            {yen.format(o.total)}
                          </span>
                        </div>
                        <StatusPill status={o.status} />
                      </div>

                      {/* timeline */}
                      <div className="mt-7">
                        <OrderTimeline status={o.status} />
                      </div>

                      {/* items + tracking */}
                      <div className="mt-7 grid grid-cols-1 gap-6 border-t border-[#0B1A2E]/10 pt-6 md:grid-cols-[1.4fr_1fr]">
                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/55">
                            <L en="ITEMS" ja="商品" />
                          </p>
                          <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-[#1D2432]/85">
                            {o.items.map((it, i) => (
                              <li key={i} className="flex justify-between gap-4">
                                <span>
                                  {it.name} {it.variant}{" "}
                                  <span className="text-[#1D2432]/55">
                                    · {it.ml}ml × {it.qty}
                                  </span>
                                </span>
                                <span>¥{yen.format(it.lineTotal)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/55">
                            <L en="SHIPPING" ja="配送先" />
                          </p>
                          <p className="mt-3 text-[12.5px] leading-[1.7] text-[#1D2432]/85">
                            〒{o.postalCode}
                            <br />
                            {o.address}
                            <br />
                            {o.customerName} ／ {o.phone}
                          </p>

                          {o.trackingNumber && (
                            <div className="mt-4 border border-[#C9A84C]/40 bg-[#F1E6CB]/40 px-4 py-3">
                              <p className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/65">
                                <L en="TRACKING" ja="追跡番号" />
                              </p>
                              <p className="mt-1 font-serif text-[13.5px] tracking-[0.02em] text-[#0B1A2E]">
                                {o.trackingCarrier
                                  ? `${o.trackingCarrier} · `
                                  : ""}
                                {o.trackingNumber}
                              </p>
                              {o.shippedAt && (
                                <p className="mt-1 text-[11px] text-[#1D2432]/65">
                                  <L en="Shipped" ja="発送日" />:{" "}
                                  {formatOrderDate(o.shippedAt)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            {/* ===== PROFILE ===== */}
            <Section id="profile" labelEn="PROFILE" labelJa="登録情報">
              <ProfileEditForm
                isBusiness={isBusiness}
                initial={profile}
              />
            </Section>

            {/* ===== SHOPPING ===== */}
            <Section id="shopping" labelEn="SHOPPING" labelJa="お買い物">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {isBusiness ? (
                  <>
                    <ActionCard
                      num="01"
                      href="/shop/business"
                      titleEn="View wholesale pricing"
                      titleJp="卸価格・発注"
                      descEn="Per-bottle and per-case trade pricing for every label."
                      descJp="全銘柄の1本・1ケースあたりの卸価格を確認。"
                    />
                    <ActionCard
                      num="02"
                      href="/contact"
                      titleEn="Contact your trade desk"
                      titleJp="お問い合わせ・ご相談"
                      descEn="Quotes, lead times, brewery visits — in JA / EN."
                      descJp="お見積り・納期・蔵見学のご相談（日本語・英語）。"
                    />
                  </>
                ) : (
                  <>
                    <ActionCard
                      num="01"
                      href="/shop/personal"
                      titleEn="Continue shopping"
                      titleJp="買い物を続ける"
                      descEn="Single bottles, delivered with care to your door."
                      descJp="300ml・180ml の単品を、ご自宅まで丁寧にお届け。"
                    />
                    <ActionCard
                      num="02"
                      href="/cart"
                      titleEn="View your cart"
                      titleJp="カートを見る"
                      descEn="Review what's in your basket and head to checkout."
                      descJp="カートの中身を確認し、お支払いへお進みください。"
                    />
                  </>
                )}
                <ActionCard
                  num="03"
                  href="/shipping"
                  titleEn="Shipping & delivery"
                  titleJp="配送・送料について"
                  descEn="Cool-chain delivery, fees, and timing across Japan."
                  descJp="全国へのクール便・送料・お届け時期について。"
                />
                <ActionCard
                  num="04"
                  href="/stories"
                  titleEn="Read the stories"
                  titleJp="物語を読む"
                  descEn="Water, rice, the hand of the toji — what's behind every bottle."
                  descJp="水と米、杜氏の手。一本一本の背景にある物語へ。"
                />
              </div>
            </Section>

            {/* ===== SECURITY ===== */}
            <Section id="security" labelEn="SECURITY" labelJa="セキュリティ">
              <div className="border border-[#0B1A2E]/12 bg-paper/65 px-7 py-8 md:px-10 md:py-10">
                <h3 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
                  <L en="Sign out" ja="ログアウト" />
                </h3>
                <p className="mt-3 max-w-[60ch] text-[12.5px] leading-[1.75] text-[#1D2432]/72">
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

      <FujisanFooter />
    </main>
  );
}

// ---------- subcomponents ----------

function Kpi({
  labelEn,
  labelJa,
  valueEn,
  valueJa,
  accent,
}: {
  labelEn: string;
  labelJa: string;
  valueEn: string;
  valueJa: string;
  accent?: "good" | "warn";
}) {
  const valueClass =
    accent === "good"
      ? "text-[#9FCB9F]"
      : accent === "warn"
        ? "text-[#E2C97E]"
        : "text-[#F2E4C7]";
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
        <L en={labelEn} ja={labelJa} />
      </dt>
      <dd
        className={`font-serif text-[14px] tracking-[0.02em] md:text-[16px] ${valueClass}`}
      >
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
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/60">
          {labelEn}
        </span>
        <span className="h-px w-8 bg-[#C9A84C]/55" />
        <span className="font-jp text-[11px] tracking-[0.26em] text-[#C9A84C]/90">
          {labelJa}
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SummaryCard({
  num,
  titleEn,
  titleJa,
  bodyEn,
  bodyJa,
  tone,
}: {
  num: string;
  titleEn: string;
  titleJa: string;
  bodyEn: string;
  bodyJa: string;
  tone?: "good" | "warn";
}) {
  const dot =
    tone === "good"
      ? "bg-[#5C8A5C]"
      : tone === "warn"
        ? "bg-[#C9A84C]"
        : "bg-[#0B1A2E]/35";
  return (
    <div className="flex flex-col gap-4 border border-[#0B1A2E]/12 bg-[#F1E6CB]/40 px-7 py-7">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
          {num}
        </span>
        <span aria-hidden className={`h-[6px] w-[6px] rounded-full ${dot}`} />
      </div>
      <div>
        <h3 className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          <L en={titleEn} ja={titleJa} />
        </h3>
        <p className="mt-2 text-[12px] leading-[1.75] text-[#1D2432]/72">
          <L en={bodyEn} ja={bodyJa} />
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  num,
  href,
  titleEn,
  titleJp,
  descEn,
  descJp,
}: {
  num: string;
  href: string;
  titleEn: string;
  titleJp: string;
  descEn: string;
  descJp: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-3 border border-[#0B1A2E]/14 bg-[#F1E6CB]/35 px-7 py-7 no-underline transition-colors hover:border-[#0B1A2E]/30 hover:bg-[#F1E6CB]/60"
    >
      <div className="flex items-center justify-between">
        <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
          {num}
        </span>
        <span
          aria-hidden
          className="text-[14px] text-[#0B1A2E]/50 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-[#C9A84C]"
        >
          →
        </span>
      </div>
      <div>
        <h3 className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
          <L en={titleEn} ja={titleJp} />
        </h3>
        <p className="mt-2 text-[12px] leading-[1.75] text-[#1D2432]/72">
          <L en={descEn} ja={descJp} />
        </p>
      </div>
    </Link>
  );
}

function StatusPill({ status }: { status: string }) {
  const STYLES: Record<
    string,
    { cls: string; en: string; ja: string; dot: string }
  > = {
    pending: {
      cls: "border-[#0B1A2E]/30 bg-paper text-[#0B1A2E]",
      en: "Received",
      ja: "受付済",
      dot: "bg-[#0B1A2E]/55",
    },
    confirmed: {
      cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/55 text-[#0B1A2E]",
      en: "Confirmed",
      ja: "注文確定",
      dot: "bg-[#C9A84C]",
    },
    preparing: {
      cls: "border-[#C9A84C]/60 bg-[#F1E6CB]/65 text-[#0B1A2E]",
      en: "Preparing",
      ja: "発送準備中",
      dot: "bg-[#C9A84C]",
    },
    shipped: {
      cls: "border-[#5C8A5C]/60 bg-[#5C8A5C]/[0.10] text-[#2F5A2F]",
      en: "Shipped",
      ja: "発送済み",
      dot: "bg-[#5C8A5C]",
    },
    delivered: {
      cls: "border-[#5C8A5C]/70 bg-[#5C8A5C]/[0.16] text-[#2F5A2F]",
      en: "Delivered",
      ja: "お届け済",
      dot: "bg-[#5C8A5C]",
    },
    cancelled: {
      cls: "border-[#8B1A1A]/45 bg-[#8B1A1A]/[0.08] text-[#8B1A1A]",
      en: "Cancelled",
      ja: "キャンセル",
      dot: "bg-[#8B1A1A]",
    },
  };
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] font-semibold tracking-[0.26em] ${s.cls}`}
    >
      <span aria-hidden className={`h-[6px] w-[6px] rounded-full ${s.dot}`} />
      <L en={s.en} ja={s.ja} />
    </span>
  );
}

function formatOrderDate(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

