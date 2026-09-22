"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { inventory } from "@/db/inventory-schema";
import { productPrice } from "@/db/price-schema";
import { requireAdmin } from "@/lib/admin";
import { getLiveSkus } from "@/lib/catalog";
import { getFujisanProductBySlug, findVolume } from "@/data/fujisan-products";
import {
  PRICE_MAX_JPY,
  STOCK_MAX_QTY,
  LOW_STOCK_MAX,
} from "@/data/fujisan-admin-limits";

/** 管理画面の 1 行（SKU）。実勢カタログ＋カタログ既定値。 */
export type AdminSkuRow = {
  slug: string;
  ml: number;
  productName: string;
  variant: string;
  variantJp: string;

  /** 実際に売っている価格（上書きがあればその値）。 */
  priceJpy: number;
  wholesalePriceJpy: number;
  caseSize: number;
  /** D1 で上書きしているか。false ならコードのカタログ価格で売っている。 */
  priceOverridden: boolean;
  /** コード側の既定値（「カタログ価格に戻す」で戻る先）。 */
  catalogPriceJpy: number;
  catalogWholesalePriceJpy: number;
  catalogCaseSize: number;

  /** カタログ側の手動「販売停止」スイッチ（在庫数とは独立）。 */
  catalogSoldOut: boolean;

  /** 在庫管理の対象か。false なら数量無制限で売れる。 */
  tracked: boolean;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
  lowStock: boolean;
};

export type AdminProductsError =
  | "unauth"
  | "forbidden"
  | "invalid"
  | "reserved"
  | "db";

/** カタログに存在する SKU か。存在しない組み合わせで行を作らせない。 */
function isKnownSku(slug: string, ml: number): boolean {
  const product = getFujisanProductBySlug(slug);
  return product !== undefined && findVolume(product, ml) !== undefined;
}

/**
 * 全 SKU を価格・在庫つきで返す（staff 以上）。
 *
 * 在庫行・価格行が無い SKU も必ず並べる。並ばないと、
 * 「まだ管理を始めていない SKU」を管理画面から始められない。
 */
export async function adminListProductsAction(): Promise<
  { ok: true; rows: AdminSkuRow[] } | { ok: false; error: AdminProductsError }
> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const skus = await getLiveSkus();
    const rows: AdminSkuRow[] = skus.map((s) => {
      const product = getFujisanProductBySlug(s.slug);
      const volume = product ? findVolume(product, s.ml) : undefined;
      return {
        slug: s.slug,
        ml: s.ml,
        productName: s.name,
        variant: s.variant,
        variantJp: s.variantJp,

        priceJpy: s.priceJpy,
        wholesalePriceJpy: s.wholesalePriceJpy,
        caseSize: s.caseSize,
        priceOverridden: s.priceOverridden,
        catalogPriceJpy: volume?.priceJpy ?? s.priceJpy,
        catalogWholesalePriceJpy: volume?.wholesalePriceJpy ?? s.wholesalePriceJpy,
        catalogCaseSize: volume?.caseSize ?? s.caseSize,

        catalogSoldOut: s.catalogSoldOut,

        tracked: s.tracked,
        onHand: s.onHand ?? 0,
        reserved: s.reserved ?? 0,
        available: s.available ?? 0,
        lowStockThreshold: s.lowStockThreshold,
        lowStock: s.lowStock,
      };
    });
    return { ok: true, rows };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 実在庫の本数と僅少しきい値を設定する（在庫管理の開始も兼ねる。staff 以上）。
 *
 * **`reserved` には触れない。** 決済待ちの引き当ては進行中の注文が持っている
 * ものなので、棚卸しで上書きしてはいけない。ここで動かすのは `onHand` だけ。
 */
export async function adminSetStockAction(input: {
  slug: string;
  ml: number;
  onHand: number;
  lowStockThreshold?: number;
}): Promise<{ ok: true } | { ok: false; error: AdminProductsError }> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  if (
    !Number.isInteger(input.onHand) ||
    input.onHand < 0 ||
    input.onHand > STOCK_MAX_QTY
  ) {
    return { ok: false, error: "invalid" };
  }
  const threshold = input.lowStockThreshold;
  if (
    threshold !== undefined &&
    (!Number.isInteger(threshold) || threshold < 0 || threshold > LOW_STOCK_MAX)
  ) {
    return { ok: false, error: "invalid" };
  }
  if (!isKnownSku(input.slug, input.ml)) return { ok: false, error: "invalid" };

  try {
    const db = await getDb();
    await db
      .insert(inventory)
      .values({
        productSlug: input.slug,
        ml: input.ml,
        onHand: input.onHand,
        reserved: 0,
        ...(threshold !== undefined ? { lowStockThreshold: threshold } : {}),
        updatedByEmail: gate.email,
      })
      .onConflictDoUpdate({
        target: [inventory.productSlug, inventory.ml],
        set: {
          onHand: input.onHand,
          ...(threshold !== undefined ? { lowStockThreshold: threshold } : {}),
          updatedByEmail: gate.email,
        },
      });

    revalidateProducts();
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 在庫管理をやめる（行を削除して数量無制限に戻す。staff 以上）。
 *
 * 決済待ちの引き当てが残っているあいだは消さない — 消すと、
 * その注文が確定・期限切れになったときに戻す先が無くなる。
 */
export async function adminUntrackStockAction(input: {
  slug: string;
  ml: number;
}): Promise<{ ok: true } | { ok: false; error: AdminProductsError }> {
  const gate = await requireAdmin("staff");
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    const [row] = await db
      .select()
      .from(inventory)
      .where(
        and(eq(inventory.productSlug, input.slug), eq(inventory.ml, input.ml)),
      )
      .limit(1);
    if (!row) return { ok: true }; // 既に管理対象外
    if (row.reserved > 0) return { ok: false, error: "reserved" };

    await db
      .delete(inventory)
      .where(
        and(eq(inventory.productSlug, input.slug), eq(inventory.ml, input.ml)),
      );

    revalidateProducts();
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 価格を上書きする（**owner のみ**）。
 *
 * 価格は売上に直結するので staff には触らせない。上書き行があるあいだ、
 * その SKU はコードのカタログ価格ではなくこの値で売られる。
 *
 * 既に決済ページへ進んでいる注文は、注文作成時の価格でスナップショット
 * （`items_json`）を持っているため、ここでの変更に影響されない。
 */
export async function adminSetPriceAction(input: {
  slug: string;
  ml: number;
  priceJpy: number;
  wholesalePriceJpy: number;
  caseSize: number;
}): Promise<{ ok: true } | { ok: false; error: AdminProductsError }> {
  const gate = await requireAdmin("owner");
  if (!gate.ok) return { ok: false, error: gate.reason };

  const { priceJpy, wholesalePriceJpy, caseSize } = input;
  const positiveInt = (n: number, max: number) =>
    Number.isInteger(n) && n >= 1 && n <= max;
  if (
    !positiveInt(priceJpy, PRICE_MAX_JPY) ||
    !positiveInt(wholesalePriceJpy, PRICE_MAX_JPY) ||
    !positiveInt(caseSize, 999)
  ) {
    return { ok: false, error: "invalid" };
  }
  // 卸価格（税抜・1本）が小売（税込）を上回るのは入力ミス。
  // 通してしまうと、取扱店に小売より高い価格表を出すことになる。
  if (wholesalePriceJpy > priceJpy) return { ok: false, error: "invalid" };
  if (!isKnownSku(input.slug, input.ml)) return { ok: false, error: "invalid" };

  try {
    const db = await getDb();
    await db
      .insert(productPrice)
      .values({
        productSlug: input.slug,
        ml: input.ml,
        priceJpy,
        wholesalePriceJpy,
        caseSize,
        updatedByEmail: gate.email,
      })
      .onConflictDoUpdate({
        target: [productPrice.productSlug, productPrice.ml],
        set: {
          priceJpy,
          wholesalePriceJpy,
          caseSize,
          updatedByEmail: gate.email,
        },
      });

    revalidateProducts();
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 価格の上書きをやめ、コードのカタログ価格に戻す（**owner のみ**）。
 * 行を消すだけ。以後はデプロイのたびにカタログの値が効く。
 */
export async function adminResetPriceAction(input: {
  slug: string;
  ml: number;
}): Promise<{ ok: true } | { ok: false; error: AdminProductsError }> {
  const gate = await requireAdmin("owner");
  if (!gate.ok) return { ok: false, error: gate.reason };

  try {
    const db = await getDb();
    await db
      .delete(productPrice)
      .where(
        and(
          eq(productPrice.productSlug, input.slug),
          eq(productPrice.ml, input.ml),
        ),
      );
    revalidateProducts();
    return { ok: true };
  } catch {
    return { ok: false, error: "db" };
  }
}

/**
 * 価格・在庫が変わったときに作り直すページ。
 * 商品ページとショップは静的書き出しなので、ここで明示的に落とさないと
 * 古い価格が出続ける。
 */
function revalidateProducts(): void {
  revalidatePath("/admin/products");
  revalidatePath("/admin");
  revalidatePath("/shop");
  revalidatePath("/shop/business");
  revalidatePath("/products", "layout");
}
