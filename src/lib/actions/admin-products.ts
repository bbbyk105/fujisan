"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { productSku, skuId } from "@/db/products-schema";
import { requireAdmin } from "@/lib/admin";
import { getLiveSkus, type LiveSku } from "@/lib/catalog";
import { getFujisanProductBySlug, findVolume } from "@/data/fujisan-products";

export type AdminSkuItem = LiveSku & {
  /** product_sku の主キー。 */
  id: string;
  /** D1 に行があるか（false＝在庫管理の対象外）。 */
  managed: boolean;
};

type ActionError = "unauth" | "forbidden" | "invalid" | "db";

/** 円・本数の入力チェック。負数・小数・桁あふれを弾く。 */
function toInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.floor(value);
  if (n < min || n > max) return null;
  return n;
}

/**
 * 更新対象の SKU が product_sku に無い場合に備え、コードのカタログから
 * 初期値を組み立てる（INSERT ... ON CONFLICT DO UPDATE の VALUES 用）。
 */
function baseRowFor(id: string) {
  const sep = id.lastIndexOf("-");
  if (sep <= 0) return null;
  const slug = id.slice(0, sep);
  const ml = Number(id.slice(sep + 1));
  if (!Number.isInteger(ml)) return null;

  const product = getFujisanProductBySlug(slug);
  if (!product) return null;
  const volume = findVolume(product, ml);
  if (!volume) return null;

  return {
    id: skuId(slug, ml),
    slug,
    ml,
    priceJpy: volume.priceJpy,
    wholesalePriceJpy: volume.wholesalePriceJpy,
    caseSize: volume.caseSize,
    stockQty: 0,
    lowStockThreshold: 6,
  };
}

/** 管理画面向けの SKU 一覧（staff 以上）。 */
export async function adminListSkusAction(): Promise<
  { ok: true; skus: AdminSkuItem[] } | { ok: false; error: ActionError }
> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const skus = await getLiveSkus();
    return {
      ok: true,
      skus: skus.map((s) => ({
        ...s,
        id: skuId(s.slug, s.ml),
        managed: s.stockQty !== null,
      })),
    };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 在庫数の更新（staff 以上）。
 * 蔵の入出庫に合わせて日々動かす値なので、staff にも開放する。
 */
export async function adminUpdateStockAction(input: {
  skuId: string;
  stockQty: number;
  lowStockThreshold: number;
}): Promise<{ ok: true } | { ok: false; error: ActionError }> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  const base = baseRowFor(input.skuId);
  if (!base) return { ok: false, error: "invalid" };

  const stockQty = toInt(input.stockQty, 0, 100_000);
  const lowStockThreshold = toInt(input.lowStockThreshold, 0, 10_000);
  if (stockQty === null || lowStockThreshold === null) {
    return { ok: false, error: "invalid" };
  }

  try {
    const db = await getDb();
    await db
      .insert(productSku)
      .values({ ...base, stockQty, lowStockThreshold })
      .onConflictDoUpdate({
        target: productSku.id,
        set: { stockQty, lowStockThreshold, updatedAt: new Date() },
      });

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 価格の更新（owner のみ）。
 * 小売価格は特商法表示にも関わるため、変更権限を蔵元に限定する。
 */
export async function adminUpdatePriceAction(input: {
  skuId: string;
  priceJpy: number;
  wholesalePriceJpy: number;
}): Promise<{ ok: true } | { ok: false; error: ActionError }> {
  const gate = await requireAdmin("owner");
  if (!gate.ok) return { ok: false, error: gate.reason };

  const base = baseRowFor(input.skuId);
  if (!base) return { ok: false, error: "invalid" };

  const priceJpy = toInt(input.priceJpy, 1, 1_000_000);
  const wholesalePriceJpy = toInt(input.wholesalePriceJpy, 1, 1_000_000);
  if (priceJpy === null || wholesalePriceJpy === null) {
    return { ok: false, error: "invalid" };
  }

  try {
    const db = await getDb();
    await db
      .insert(productSku)
      .values({ ...base, priceJpy, wholesalePriceJpy })
      .onConflictDoUpdate({
        target: productSku.id,
        set: { priceJpy, wholesalePriceJpy, updatedAt: new Date() },
      });

    revalidatePath("/admin/products");
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
