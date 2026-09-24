import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  AccountView,
  ACCOUNT_TABS,
  type AccountTab,
} from "@/components/fujisan/auth/AccountView";
import { getSession } from "@/lib/session";
import { getDb } from "@/db";
import { user as userTable } from "@/db/auth-schema";
import { listMyOrdersAction } from "@/lib/actions/orders";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { readTradeAccount } from "@/lib/trade";
import type { TradeStatus } from "@/data/fujisan-trade";
import { buildMetadata } from "@/lib/seo";

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

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login/personal");
  }

  const { tab: rawTab } = await searchParams;
  const tab: AccountTab = ACCOUNT_TABS.includes(rawTab as AccountTab)
    ? (rawTab as AccountTab)
    : "orders";

  const user = session.user as AccountSession;
  const isBusiness = user.role === "business";

  const orders = await listMyOrdersAction(10);

  // 管理者なら管理画面への入口を出す。owner と staff で文言を出し分ける。
  const adminRole = await getEffectiveAdminRole({
    userId: user.id,
    email: user.email,
  });

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

  // 表示・編集はセッションではなく DB の最新値を使う（セッションは更新が反映されない）
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
  } catch {
    /* DB 失敗時はセッションの値で表示する */
  }

  return (
    <AccountView
      tab={tab}
      isBusiness={isBusiness}
      displayName={profile.companyName || profile.name || user.email}
      email={user.email}
      emailVerified={Boolean(user.emailVerified)}
      orders={orders}
      admin={
        isStaffOrAbove(adminRole) ? { isOwner: isOwner(adminRole) } : null
      }
      tradeStatus={tradeStatus}
      profile={profile}
    />
  );
}
