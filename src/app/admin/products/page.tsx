import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminFooterBar,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { AdminSkuRow } from "@/components/fujisan/admin/AdminSkuRow";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { adminListProductsAction } from "@/lib/actions/admin-products";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Admin · Products",
  description: "商品の価格と在庫の管理。",
  path: "/admin/products",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getSession();
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!session) redirect("/login/personal?next=/admin/products");

  const role = await getEffectiveAdminRole({ userId: u?.id, email: u?.email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={u?.email} />;
  const isOwnerUser = isOwner(role);

  const res = await adminListProductsAction();
  const rows = res.ok ? res.rows : [];
  const tracked = rows.filter((r) => r.tracked);
  const soldOut = tracked.filter((r) => r.available === 0);
  const lowStock = tracked.filter((r) => r.lowStock);
  const overridden = rows.filter((r) => r.priceOverridden);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="商品・在庫の管理"
        lead="数えた本数を入れると、その SKU の在庫管理が始まります。管理を開始した SKU は在庫を超える注文を受け付けません。未設定の SKU はこれまでどおり数量無制限で販売されます。"
        email={u?.email}
        isOwnerUser={isOwnerUser}
        current="products"
        kpis={
          <>
            <AdminKpi
              label="在庫管理中"
              value={`${tracked.length}`}
              suffix={`/ ${rows.length} SKU`}
            />
            <AdminKpi label="完売" value={`${soldOut.length}`} suffix="SKU" />
            <AdminKpi label="在庫僅少" value={`${lowStock.length}`} suffix="SKU" />
            <AdminKpi
              label="価格上書き"
              value={`${overridden.length}`}
              suffix="SKU"
            />
          </>
        }
      />

      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        {!res.ok && (
          <p
            role="alert"
            className="mb-6 border border-[#8B1A1A]/40 bg-[#8B1A1A]/6 px-4 py-3 text-[12.5px] text-[#8B1A1A]"
          >
            商品情報の読み込みに失敗しました。時間をおいて再度お試しください。
          </p>
        )}

        {soldOut.length > 0 && (
          <p className="mb-3 border border-[#8B1A1A]/35 bg-[#8B1A1A]/[0.06] px-5 py-3 text-[12.5px] leading-[1.7] text-[#8B1A1A]">
            <strong className="font-semibold">
              {soldOut.length} SKU が完売です
            </strong>
            — 販売可能数が 0 のため、新規のご注文は受け付けていません。
          </p>
        )}
        {lowStock.length > 0 && (
          <p className="mb-6 border border-[#C9A84C]/50 bg-[#C9A84C]/[0.08] px-5 py-3 text-[12.5px] leading-[1.7] text-[#8A6D1F]">
            <strong className="font-semibold">
              {lowStock.length} SKU が在庫僅少です
            </strong>
            — 仕込みか追加の棚卸しをご検討ください。
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <AdminSkuRow
              key={`${row.slug}-${row.ml}`}
              row={row}
              canEditPrice={isOwnerUser}
            />
          ))}
        </ul>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="border border-[#0B1A2E]/12 bg-paper/70 px-6 py-5 text-[12px] leading-[1.85] text-[#0B1A2E]/72">
            <p className="font-semibold text-[#0B1A2E]">在庫の数え方</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>
                <strong>実在庫</strong> …
                蔵にある本数。棚卸しで数えた数をそのまま入れます。
              </li>
              <li>
                <strong>決済待ち</strong> …
                決済ページを開いている方が確保している本数。自動で増減するため編集できません。支払いが完了すると実在庫から引かれ、期限切れになると戻ります。
              </li>
              <li>
                <strong>販売可能</strong> … 実在庫 −
                決済待ち。この数を超える注文は受け付けません。
              </li>
              <li>
                発送前の注文を返金すると実在庫に自動で戻ります。発送後の返品は、品物を受け取ってからここで足してください。
              </li>
            </ul>
          </div>

          <div className="border border-[#0B1A2E]/12 bg-paper/70 px-6 py-5 text-[12px] leading-[1.85] text-[#0B1A2E]/72">
            <p className="font-semibold text-[#0B1A2E]">価格について</p>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>
                変更できるのは<strong>蔵元（owner）</strong>のみです。蔵スタッフには表示だけ見えます。
              </li>
              <li>
                保存すると、その SKU
                はカタログ価格ではなくこの値で売られます。「カタログ価格に戻す」でいつでも元に戻せます。
              </li>
              <li>
                <strong>既に確定した注文の金額は変わりません</strong>。注文は購入時点の価格を控えとして保持しています。
              </li>
              <li>
                卸価格は<strong>承認済みの取扱店</strong>にのみ表示されます（税抜・1本あたり）。
              </li>
            </ul>
          </div>
        </div>

        <AdminFooterBar />
      </section>

      <FujisanFooter />
    </main>
  );
}
