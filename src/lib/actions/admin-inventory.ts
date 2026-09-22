"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/db";
import { inventory } from "@/db/inventory-schema";
import { getEffectiveAdminRole, isStaffOrAbove } from "@/lib/admin";
import { readAllStock } from "@/lib/inventory";
import { fujisanProducts } from "@/data/fujisan-products";

/** カタログの 1 SKU に在庫の状態を重ねたもの。 */
export type InventoryRow = {
  slug: string;
  ml: number;
  productName: string;
  variant: string;
  variantJp: string;
  /** カタログ側の販売停止フラグ（在庫数とは別のスイッチ）。 */
  catalogSoldOut: boolean;
  /** 在庫管理の対象か。false なら数量無制限で売れる。 */
  tracked: boolean;
  onHand: number;
  reserved: number;
  available: number;
};

async function requireStaff(): Promise<
  { ok: true; email: string } | { ok: false; reason: "unauth" | "forbidden" }
> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const u = session?.user as { id?: string; email?: string } | undefined;
  if (!u?.email || !u.id) return { ok: false, reason: "unauth" };
  const role = await getEffectiveAdminRole({ userId: u.id, email: u.email });
  if (!isStaffOrAbove(role)) return { ok: false, reason: "forbidden" };
  return { ok: true, email: u.email };
}

/**
 * カタログの全 SKU に在庫を重ねて返す。
 * 在庫行が無い SKU は `tracked: false`（数量無制限）として並べる。
 */
export async function adminListInventoryAction(): Promise<
  | { ok: true; rows: InventoryRow[] }
  | { ok: false; error: "unauth" | "forbidden" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const stock = await readAllStock();
    const rows: InventoryRow[] = [];
    for (const product of fujisanProducts) {
      for (const volume of product.volumes) {
        const level = stock.get(`${product.slug}__${volume.ml}`);
        rows.push({
          slug: product.slug,
          ml: volume.ml,
          productName: product.name,
          variant: product.variant,
          variantJp: product.variantJp,
          catalogSoldOut: volume.soldOut === true,
          tracked: level !== undefined,
          onHand: level?.onHand ?? 0,
          reserved: level?.reserved ?? 0,
          available: level?.available ?? 0,
        });
      }
    }
    return { ok: true, rows };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 実在庫の本数を設定する（在庫管理の開始も兼ねる）。
 *
 * **`reserved` には触れない。** 決済待ちの引き当ては進行中の注文が持っている
 * ものなので、棚卸しで上書きしてはいけない。ここで動かすのは `onHand` だけ。
 */
export async function adminSetStockAction(input: {
  slug: string;
  ml: number;
  onHand: number;
}): Promise<
  { ok: true } | { ok: false; error: "unauth" | "forbidden" | "invalid" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (!Number.isInteger(input.onHand) || input.onHand < 0) {
    return { ok: false, error: "invalid" };
  }
  // カタログに無い SKU は受け付けない（不正な行を作らせない）。
  const product = fujisanProducts.find((p) => p.slug === input.slug);
  if (!product || !product.volumes.some((v) => v.ml === input.ml)) {
    return { ok: false, error: "invalid" };
  }

  try {
    const db = await getDb();
    await db
      .insert(inventory)
      .values({
        productSlug: input.slug,
        ml: input.ml,
        onHand: input.onHand,
        reserved: 0,
        updatedByEmail: gate.email,
      })
      .onConflictDoUpdate({
        target: [inventory.productSlug, inventory.ml],
        set: { onHand: input.onHand, updatedByEmail: gate.email },
      });

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 在庫管理をやめる（行を削除して数量無制限に戻す）。
 * 決済待ちの引き当てが残っているあいだは消さない — 消すと、
 * その注文が確定・期限切れになったときに戻す先が無くなる。
 */
export async function adminUntrackStockAction(input: {
  slug: string;
  ml: number;
}): Promise<
  | { ok: true }
  | { ok: false; error: "unauth" | "forbidden" | "reserved" | "db" }
> {
  const gate = await requireStaff();
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(inventory)
      .where(
        and(
          eq(inventory.productSlug, input.slug),
          eq(inventory.ml, input.ml),
        ),
      )
      .limit(1);
    if (!row) return { ok: true }; // 既に管理対象外
    if (row.reserved > 0) return { ok: false, error: "reserved" };

    await db
      .delete(inventory)
      .where(
        and(
          eq(inventory.productSlug, input.slug),
          eq(inventory.ml, input.ml),
        ),
      );

    revalidatePath("/admin/inventory");
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}
