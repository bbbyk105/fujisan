import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { inventory, type StockLevel } from "@/db/inventory-schema";
import type { OrderLine } from "@/db/orders-schema";
import { skuKey } from "@/data/fujisan-products";

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

/** 確定によって在庫が減り、報せる価値が出た SKU。 */
export type StockWarning = {
  slug: string;
  ml: number;
  /** 確定後に売れる本数。 */
  available: number;
  lowStockThreshold: number;
  /** 完売したか（available === 0）。 */
  soldOut: boolean;
};

/**
 * 引き当てを確定する（入金が成立したとき）。
 * `onHand` と `reserved` を同時に減らす。
 *
 * **冪等ではない**ので、Webhook からは「pending → confirmed に実際に
 * 更新できた初回だけ」呼ぶこと。
 *
 * 戻り値は「この確定で**はじめて**僅少・完売になった SKU」。
 * 呼び出し元がこれを人へ知らせる。毎回の在庫を通知すると鬱陶しくて
 * 読まれなくなるので、**またいだ瞬間だけ**を返す
 * （確定前から既に僅少だった SKU は含めない）。
 */
export async function commitStock(
  items: readonly OrderLine[],
): Promise<StockWarning[]> {
  const db = await getDb();
  const warnings: StockWarning[] = [];

  for (const line of toStockLines(items)) {
    // 減らす前の状態。しきい値をまたいだかの判定に要る。
    const before = await readStock(line.slug, line.ml);

    const [row] = await db
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
      )
      .returning();

    // 管理対象外（行が無い）なら報せることは無い。
    if (!row || !before) continue;

    const after = toLevel(row);
    const wasFine = !before.lowStock && before.available > 0;
    const nowNeedsAttention = after.lowStock || after.available === 0;
    if (wasFine && nowNeedsAttention) {
      warnings.push({
        slug: after.productSlug,
        ml: after.ml,
        available: after.available,
        lowStockThreshold: after.lowStockThreshold,
        soldOut: after.available === 0,
      });
    }
  }

  return warnings;
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
  return toLevel(row);
}

/** 管理対象の全 SKU。キーは `skuKey(slug, ml)`。 */
export async function readAllStock(): Promise<Map<string, StockLevel>> {
  const db = await getDb();
  const rows = await db.select().from(inventory);
  return new Map(
    rows.map((row) => [skuKey(row.productSlug, row.ml), toLevel(row)]),
  );
}

/** 行 → StockLevel。`available` と `lowStock` の導出を 1 か所に閉じる。 */
function toLevel(row: typeof inventory.$inferSelect): StockLevel {
  const available = Math.max(0, row.onHand - row.reserved);
  return {
    productSlug: row.productSlug,
    ml: row.ml,
    onHand: row.onHand,
    reserved: row.reserved,
    available,
    lowStockThreshold: row.lowStockThreshold,
    // 0 本は「完売」であって「僅少」ではない。両方に出すと、完売の SKU が
    // アラートに二重で並んで、仕込むべきものが埋もれる。
    lowStock: available > 0 && available <= row.lowStockThreshold,
  };
}

/**
 * 在庫の警告を運用へ知らせる文面。
 *
 * **通知は「またいだ瞬間だけ」**（`commitStock` の戻り値がそれ）。
 * 毎回の在庫を送ると読まれなくなり、本当に仕込みが要るときに気づけない。
 */
export function formatStockWarnings(warnings: readonly StockWarning[]): {
  subject: string;
  body: string;
} | null {
  if (warnings.length === 0) return null;

  const soldOut = warnings.filter((w) => w.soldOut);
  const low = warnings.filter((w) => !w.soldOut);

  const subject =
    soldOut.length > 0
      ? `在庫が切れました（${soldOut.length} SKU）`
      : `在庫が少なくなりました（${low.length} SKU）`;

  const lines: string[] = [];
  if (soldOut.length > 0) {
    lines.push("■ 完売（新規のご注文を受け付けません）");
    for (const w of soldOut) lines.push(`  ・${w.slug} ${w.ml}ml`);
    lines.push("");
  }
  if (low.length > 0) {
    lines.push("■ 残りわずか");
    for (const w of low) {
      lines.push(
        `  ・${w.slug} ${w.ml}ml … 残り ${w.available} 本（目安 ${w.lowStockThreshold} 本以下）`,
      );
    }
    lines.push("");
  }
  lines.push("仕込みか棚卸しをご検討ください。");
  lines.push("在庫は /admin/products で確認・変更できます。");

  return { subject, body: lines.join("\n") };
}
