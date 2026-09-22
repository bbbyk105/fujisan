import Link from "next/link";
import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { LogoutButton } from "@/components/fujisan/auth/LogoutButton";
import { AdminInventoryRow } from "@/components/fujisan/admin/AdminInventoryRow";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isStaffOrAbove, isOwner } from "@/lib/admin";
import { adminListInventoryAction } from "@/lib/actions/admin-inventory";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Inventory",
  description: "在庫の管理。",
  path: "/admin/inventory",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin/inventory");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <ForbiddenView email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const res = await adminListInventoryAction();
  const rows = res.ok ? res.rows : [];
  const tracked = rows.filter((r) => r.tracked);
  const soldOut = tracked.filter((r) => r.available === 0);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      {/* Header */}
      <section className="fujisan-dark-panel bg-[#0B1A2E] text-[#F2E4C7]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 px-7 pb-10 pt-[124px] md:flex-row md:items-end md:justify-between md:px-12 md:pb-12 md:pt-[150px]">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-jp text-[12px] tracking-[0.34em] text-[#E2C97E]">
                ― 在庫 ―
              </span>
              <span className="h-px w-10 bg-[#E2C97E]/50" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#E2C97E]/80">
                Inventory
              </span>
            </div>
            <h1 className="mt-6 font-serif text-[clamp(24px,2.8vw,34px)] font-semibold leading-[1.16] tracking-[0.06em] text-[#F2E4C7]">
              在庫の管理
            </h1>
            <p className="mt-4 max-w-[52ch] text-[13px] leading-[1.85] tracking-[0.02em] text-[#F2E4C7]/72">
              数えた本数を入れると、その銘柄の在庫管理が始まります。管理を開始した
              SKU は在庫を超える注文を受け付けません。未設定の SKU はこれまでどおり
              数量無制限で販売されます。
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-10 gap-y-2">
            <div className="flex flex-col gap-1">
              <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
                TRACKED
              </dt>
              <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
                {tracked.length}
                <span className="ml-1 text-[11px] text-[#F2E4C7]/55">
                  / {rows.length} SKU
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[9px] font-semibold tracking-[0.32em] text-[#F2E4C7]/55">
                SOLD OUT
              </dt>
              <dd className="font-serif text-[18px] tracking-[0.02em] text-[#F2E4C7]">
                {soldOut.length}
                <span className="ml-1 text-[11px] text-[#F2E4C7]/55">SKU</span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto w-full max-w-[1280px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {!res.ok && (
          <p
            role="alert"
            className="border border-[#8B1A1A]/40 bg-[#8B1A1A]/6 px-4 py-3 text-[12.5px] text-[#8B1A1A]"
          >
            在庫の読み込みに失敗しました。時間をおいて再度お試しください。
          </p>
        )}

        {soldOut.length > 0 && (
          <p className="mb-6 border border-[#8B1A1A]/35 bg-[#8B1A1A]/[0.06] px-5 py-3 text-[12.5px] leading-[1.7] text-[#8B1A1A]">
            <strong className="font-semibold">
              {soldOut.length} SKU が在庫切れです
            </strong>
            — 販売可能数が 0 のため、新規のご注文は受け付けていません。
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <AdminInventoryRow key={`${row.slug}-${row.ml}`} row={row} />
          ))}
        </ul>

        <div className="mt-10 border border-[#0B1A2E]/12 bg-paper/70 px-6 py-5 text-[12px] leading-[1.85] text-[#0B1A2E]/72">
          <p className="font-semibold text-[#0B1A2E]">在庫の数え方</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
            <li>
              <strong>実在庫</strong> … 蔵にある本数。棚卸しで数えた数をそのまま入れます。
            </li>
            <li>
              <strong>決済待ち</strong> … 決済ページを開いている方が確保している本数。
              自動で増減するため編集できません。支払いが完了すると実在庫から引かれ、
              期限切れになると戻ります。
            </li>
            <li>
              <strong>販売可能</strong> … 実在庫 − 決済待ち。この数を超える注文は受け付けません。
            </li>
            <li>
              発送前の注文を返金すると実在庫に自動で戻ります。発送後の返品は、
              品物を受け取ってからここで足してください。
            </li>
          </ul>
        </div>

        {/* Footer nav */}
        <div className="mt-12 flex items-center justify-between border-t border-[#0B1A2E]/12 pt-8">
          <div className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
            >
              ← 注文管理へ
            </Link>
            <Link
              href="/admin/contacts"
              className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
            >
              お問い合わせへ
            </Link>
            {isOwnerUser && (
              <Link
                href="/admin/team"
                className="text-[11px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 no-underline hover:text-[#0B1A2E]"
              >
                メンバー管理へ
              </Link>
            )}
          </div>
          <LogoutButton />
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}

function ForbiddenView({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />
      <section className="mx-auto flex w-full max-w-[680px] flex-1 flex-col items-center justify-center px-7 pb-24 pt-[140px] text-center md:pt-[180px]">
        <p className="font-serif text-[10px] font-semibold tracking-[0.34em] text-[#8B1A1A]">
          STAFF ACCESS REQUIRED
        </p>
        <h1 className="mt-5 font-serif text-[28px] font-semibold leading-[1.18] tracking-[0.04em] text-[#0B1A2E]">
          このページは蔵スタッフ専用です。
        </h1>
        <p className="mt-5 text-[13px] leading-[1.85] text-[#1D2432]/78">
          現在のログイン:{" "}
          <span className="font-semibold">{email ?? "（未ログイン）"}</span>
        </p>
        <div className="mt-9">
          <LogoutButton />
        </div>
      </section>
      <FujisanFooter />
    </main>
  );
}
