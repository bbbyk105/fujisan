import "server-only";
import {
  parseOrderItems,
  type OrderLine,
  type StockState,
} from "@/db/orders-schema";
import {
  commitStock,
  formatStockWarnings,
  releaseStock,
  reserveStock,
  restockCommitted,
} from "@/lib/inventory";
import { alertOps } from "@/lib/ops-alert";

/**
 * 注文に紐づく在庫の本数の移動。
 *
 * ## 呼び方
 * `commitStock` などは冪等ではなく、2 回呼べば 2 回動く。そこで呼び出し元は
 * **`status` と `stock_state` を同じ UPDATE で動かし**、WHERE に読んだときの
 * `stock_state` を入れて、更新できたときだけ `applyStockMove` を呼ぶ。この 1 文が
 * 原子的なので、同時に走っても本数を動かすのは 1 回だけになる。2 文に分けると、
 * 片方だけ動いてステータスと在庫の状態が食い違う。
 *
 * ## 途中で失敗したとき
 * D1 に対話的トランザクションは無く、複数行の注文の途中で落ちると一部だけ動いた状態に
 * なる。どこまで動いたかは分からないので、やり直さずに人へ知らせて数えてもらう。
 */

const STOCK_STATE_LABELS: Record<StockState, string> = {
  reserved: "引き当て中",
  committed: "引き落とし済み（発送前）",
  shipped: "引き落とし済み（発送済み）",
  none: "在庫への反映なし",
};

async function moveStock(
  from: StockState,
  to: StockState,
  items: readonly OrderLine[],
): Promise<void> {
  if (to === "none") {
    if (from === "reserved") await releaseStock(items);
    if (from === "committed") await restockCommitted(items);
    return;
  }

  // 蔵にある品物が蔵を出ただけで、本数は動かない。
  if (from === "committed") return;

  if (from === "none") {
    const reservation = await reserveStock(items);
    if (!reservation.ok) {
      throw new Error(
        reservation.reason === "shortage"
          ? "在庫が足りません"
          : "在庫の引き当てに失敗しました",
      );
    }
  }

  const message = formatStockWarnings(await commitStock(items));
  if (message) await alertOps(message.subject, message.body);
}

/**
 * `stock_state` の移動に合わせて本数を動かす。状態は呼び出し元が動かしておくこと。
 *
 * **例外は投げない。** 注文の更新や入金は既に成立しているので、失敗は運用へ知らせて、
 * 呼び出し元の処理は続ける。
 */
export async function applyStockMove(
  order: { orderRef: string; itemsJson: string },
  from: StockState,
  to: StockState,
): Promise<void> {
  if (from === to) return;

  const items = parseOrderItems(order.itemsJson);
  try {
    await moveStock(from, to, items);
  } catch (err) {
    console.error("[order-stock] 在庫の更新に失敗:", err);
    await alertOps(
      "注文の在庫を更新できませんでした",
      [
        `注文番号: ${order.orderRef}`,
        `在庫の状態: ${STOCK_STATE_LABELS[from]} → ${STOCK_STATE_LABELS[to]}`,
        `商品: ${items.map((it) => `${it.name} ${it.variant} ${it.ml}ml × ${it.qty}`).join(" / ")}`,
        `error: ${err instanceof Error ? err.message : "unknown"}`,
        "",
        "本数が反映されていない、または途中までしか反映されていないことがあります。/admin/products で実在庫を数えて合わせてください。",
      ].join("\n"),
    );
  }
}
