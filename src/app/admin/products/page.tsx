import { redirect } from "next/navigation";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import {
  AdminForbidden,
  AdminHeader,
  AdminKpi,
} from "@/components/fujisan/admin/AdminChrome";
import { AdminSkuRow } from "@/components/fujisan/admin/AdminSkuRow";
import { getSession } from "@/lib/session";
import { getEffectiveAdminRole, isOwner, isStaffOrAbove } from "@/lib/admin";
import { adminListSkusAction } from "@/lib/actions/admin-products";

export const metadata = {
  title: "Admin · Products — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const yen = new Intl.NumberFormat("ja-JP");

export default async function AdminProductsPage() {
  const session = await getSession();
  const sessUser = session?.user as { id?: string; email?: string } | undefined;
  const email = sessUser?.email;

  if (!session) redirect("/login/personal?next=/admin/products");

  const role = await getEffectiveAdminRole({ userId: sessUser?.id, email });
  if (!isStaffOrAbove(role)) return <AdminForbidden email={email} />;
  const isOwnerUser = isOwner(role);

  const res = await adminListSkusAction();
  const skus = res.ok ? res.skus : [];

  const onSale = skus.filter((s) => !s.soldOut).length;
  const lowStock = skus.filter((s) => s.lowStock).length;
  const soldOut = skus.filter((s) => s.soldOut).length;
  const totalBottles = skus.reduce((n, s) => n + (s.stockQty ?? 0), 0);

  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <AdminHeader
        title="商品・在庫の管理"
        email={email}
        isOwnerUser={isOwnerUser}
        current="products"
        kpis={
          <>
            <AdminKpi label="販売中" value={`${onSale}`} suffix="SKU" />
            <AdminKpi label="在庫僅少" value={`${lowStock}`} suffix="SKU" />
            <AdminKpi label="完売" value={`${soldOut}`} suffix="SKU" />
            <AdminKpi
              label="総在庫"
              value={yen.format(totalBottles)}
              suffix="本"
            />
          </>
        }
      />

      <section className="mx-auto w-full max-w-[1480px] flex-1 px-7 pb-24 pt-12 md:px-12 md:pt-14">
        <div className="border border-[#0B1A2E]/15 bg-paper-tint/60 px-6 py-5 text-[12px] leading-[1.85] text-[#1D2432]/80 md:px-7">
          <p>
            在庫が <strong className="font-semibold">0本</strong> になった SKU
            は、商品ページとカートで自動的に購入不可になります。決済が確定した時点で在庫は自動的に減ります。
          </p>
          <p className="mt-1.5 text-[#1D2432]/65">
            銘柄名・ストーリー・写真の変更はコード側（デプロイが必要）です。ここで変更できるのは価格と在庫のみです。
          </p>
        </div>

        {skus.length === 0 ? (
          <div className="mt-8 border border-dashed border-[#0B1A2E]/25 bg-paper/55 px-7 py-16 text-center">
            <p className="font-serif text-[15px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
              SKU を読み込めませんでした。
            </p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[12.5px] leading-[1.75] text-[#0B1A2E]/70">
              マイグレーション（drizzle/0007_product_sku.sql）が適用されているか確認してください。
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-4">
            {skus.map((sku) => (
              <AdminSkuRow key={sku.id} sku={sku} canEditPrice={isOwnerUser} />
            ))}
          </div>
        )}
      </section>

      <FujisanFooter />
    </main>
  );
}
