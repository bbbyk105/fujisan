import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { inventory, type StockLevel } from "@/db/inventory-schema";
import type { OrderLine } from "@/db/orders-schema";

/**
 * 在庫の引き当て・確定・解放。
 *
 * ## オプトイン
 * `inventory` に行がある SKU だけを管理対象とする。行が無い SKU は
 * 「数量無制限」として扱い、引き当ても解放も何もしない。デプロイした瞬間に
 * 全 SKU が在庫 0 になって販売が止まるのを避けるため。
 *
 * ## なぜ「確定時に減らす」だけでは足りないか
 * 決済ページに滞在している数分のあいだ在庫を押さえないと、
 * 同じ最後の 1 本を複数人が同時に買えてしまう。そこで
 * 決済開始で `reserved` を積み、入金確定で `onHand` から落とす。
 *
 * ## D1 に対話的トランザクションが無いことへの対処
 * 明細が複数行ある注文では UPDATE も複数回になる。途中で足りなくなった場合は
 * **それまでに積んだ分を戻す**（補償）。1 文ごとの
 * `UPDATE … WHERE on_hand - reserved >= qty` は原子的なので、
 * 同時実行で売り越すことはない。
 */

/** 在庫が足りなかった SKU。UI でどれが買えないかを示すのに使う。 */
export type ShortageLine = { slug: string; ml: number; available: number };

export type ReserveResult =
  | { ok: true }
  | { ok: false; reason: "shortage"; shortages: ShortageLine[] }
  | { ok: false; reason: "db" };

/** 引き当て対象の行（注文明細のうち在庫に関係する部分だけ）。 */
type StockLine = { slug: string; ml: number; qty: number };

function toStockLines(items: readonly OrderLine[]): StockLine[] {
  return items.map((it) => ({ slug: it.slug, ml: it.ml, qty: it.qty }));
}

/**
 * 在庫を引き当てる（`reserved` を積む）。
 *
 * 管理対象外の SKU は素通りする。1 行でも足りなければ、
 * それまでに積んだ分をすべて戻してから `shortage` を返す。
 */
export async function reserveStock(
  items: readonly OrderLine[],
): Promise<ReserveResult> {
  const lines = toStockLines(items);
  if (lines.length === 0) return { ok: true };

  const db = await getDb();
  /** 実際に積めた行。失敗時はこれを戻す。 */
  const reserved: StockLine[] = [];

  try {
    for (const line of lines) {
      const updated = await db
        .update(inventory)
        .set({ reserved: sql`${inventory.reserved} + ${line.qty}` })
        .where(
          and(
            eq(inventory.productSlug, line.slug),
            eq(inventory.ml, line.ml),
            // 販売可能数が足りるときだけ積む。この 1 文が原子的なので、
            // 同時に走っても合計が on_hand を超えることはない。
            gte(
              sql`${inventory.onHand} - ${inventory.reserved}`,
              line.qty,
            ),
          ),
        )
        .returning({ slug: inventory.productSlug });

      if (updated.length > 0) {
        reserved.push(line);
        continue;
      }

      // 更新できなかった。管理対象外（行が無い）なら成功扱い、
      // 行があるなら在庫不足。
      const level = await readStock(line.slug, line.ml);
      if (level === null) continue; // 管理対象外 → 無制限

      await releaseLines(reserved);
      return {
        ok: false,
        reason: "shortage",
        shortages: [
          { slug: line.slug, ml: line.ml, available: level.available },
        ],
      };
    }
    return { ok: true };
  } catch {
    // 途中で落ちた分は戻す（戻せなくても、あとで解放されずに残るだけ）。
    try {
      await releaseLines(reserved);
    } catch {
      /* 補償の失敗は握りつぶす。呼び出し元には db エラーを返す。 */
    }
    return { ok: false, reason: "db" };
  }
}

/**
 * 引き当てを確定する（入金が成立したとき）。
 * `onHand` と `reserved` を同時に減らす。
 *
 * **冪等ではない**ので、Webhook からは「pending → confirmed に実際に
 * 更新できた初回だけ」呼ぶこと。
 */
export async function commitStock(items: readonly OrderLine[]): Promise<void> {
  const db = await getDb();
  for (const line of toStockLines(items)) {
    await db
      .update(inventory)
      .set({
        onHand: sql`max(0, ${inventory.onHand} - ${line.qty})`,
        reserved: sql`max(0, ${inventory.reserved} - ${line.qty})`,
      })
      .where(
        and(
          eq(inventory.productSlug, line.slug),
          eq(inventory.ml, line.ml),
        ),
      );
  }
}

/**
 * 引き当てを解放する（決済されないまま終わったとき）。
 * `reserved` だけを戻す。`max(0, …)` で負に振れないようにする。
 */
export async function releaseStock(items: readonly OrderLine[]): Promise<void> {
  await releaseLines(toStockLines(items));
}

async function releaseLines(lines: readonly StockLine[]): Promise<void> {
  if (lines.length === 0) return;
  const db = await getDb();
  for (const line of lines) {
    await db
      .update(inventory)
      .set({ reserved: sql`max(0, ${inventory.reserved} - ${line.qty})` })
      .where(
        and(
          eq(inventory.productSlug, line.slug),
          eq(inventory.ml, line.ml),
        ),
      );
  }
}

/**
 * 確定済みの在庫を戻す（未発送の注文を返金・取消したとき）。
 * 発送済みの注文には使わない（品物は手元に戻っていない）。
 */
export async function restockCommitted(
  items: readonly OrderLine[],
): Promise<void> {
  const db = await getDb();
  for (const line of toStockLines(items)) {
    await db
      .update(inventory)
      .set({ onHand: sql`${inventory.onHand} + ${line.qty}` })
      .where(
        and(
          eq(inventory.productSlug, line.slug),
          eq(inventory.ml, line.ml),
        ),
      );
  }
}

/** 1 SKU の在庫。管理対象外なら null。 */
export async function readStock(
  slug: string,
  ml: number,
): Promise<StockLevel | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.productSlug, slug), eq(inventory.ml, ml)))
    .limit(1);
  if (!row) return null;
  return {
    productSlug: row.productSlug,
    ml: row.ml,
    onHand: row.onHand,
    reserved: row.reserved,
    available: Math.max(0, row.onHand - row.reserved),
  };
}

/** 管理対象の全 SKU。キーは `${slug}__${ml}`。 */
export async function readAllStock(): Promise<Map<string, StockLevel>> {
  const db = await getDb();
  const rows = await db.select().from(inventory);
  return new Map(
    rows.map((row) => [
      `${row.productSlug}__${row.ml}`,
      {
        productSlug: row.productSlug,
        ml: row.ml,
        onHand: row.onHand,
        reserved: row.reserved,
        available: Math.max(0, row.onHand - row.reserved),
      },
    ]),
  );
}
