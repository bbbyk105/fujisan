/**
 * @jest-environment node
 */

// 注文の取得とキャンセル依頼。ここで守りたいのは
//   1. 他人の注文が見えないこと（orderRef は秘密ではない）
//   2. 発送後にキャンセル依頼を通さないこと
//   3. 連打しても依頼と通知が 1 回で済むこと

const getSession = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({ api: { getSession } }),
}));

jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...a: unknown[]) => alertOps(...a),
}));

let selectRow: Record<string, unknown> | undefined;
let updateReturns: Array<{ id: string }> = [];
/** select の where に渡された条件（絞り込みの検証に使う）。 */
let lastSelectWhere: unknown;
const updateCalls: Array<Record<string, unknown>> = [];

jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: (cond: unknown) => {
          lastSelectWhere = cond;
          return { limit: async () => (selectRow ? [selectRow] : []) };
        },
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        updateCalls.push(values);
        return {
          where: () => ({ returning: async () => updateReturns }),
        };
      },
    }),
  }),
}));

import {
  getMyOrderByRefAction,
  requestOrderCancellationAction,
} from "@/lib/actions/orders";

const USER_ID = "user_1";

/**
 * drizzle の条件オブジェクトから、束縛された文字列値だけを取り出す。
 * SQL オブジェクトはテーブル定義を相互参照していて JSON 化できないため、
 * 訪問済みを覚えながら手で辿る。
 */
function collectBoundValues(node: unknown, seen = new Set<unknown>()): string[] {
  if (node === null || typeof node !== "object") {
    return typeof node === "string" ? [node] : [];
  }
  if (seen.has(node)) return [];
  seen.add(node);

  if (Array.isArray(node)) {
    return node.flatMap((n) => collectBoundValues(n, seen));
  }
  // Param / SQL チャンクのみを辿る。テーブル定義側へは降りない。
  const out: string[] = [];
  for (const key of ["value", "queryChunks", "left", "right"]) {
    if (key in (node as Record<string, unknown>)) {
      out.push(...collectBoundValues((node as Record<string, unknown>)[key], seen));
    }
  }
  return out;
}

function orderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "order_1",
    userId: USER_ID,
    orderRef: "FJ-ABC123",
    status: "confirmed",
    itemsJson: JSON.stringify([
      {
        slug: "shogun",
        name: "FUJISAN",
        variant: "SHOGUN",
        ml: 300,
        qty: 1,
        unitPrice: 2750,
        lineTotal: 2750,
      },
    ]),
    itemsCount: 1,
    subtotal: 2750,
    shipping: 1100,
    total: 3850,
    customerName: "佐藤 優子",
    customerEmail: "sato@example.com",
    postalCode: "1000001",
    address: "東京都千代田区千代田1-1",
    phone: "09012345678",
    trackingCarrier: null,
    trackingNumber: null,
    shippedAt: null,
    deliveredAt: null,
    paidAt: new Date("2026-09-01T00:00:00Z"),
    cancelRequestedAt: null,
    cancelReason: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    updatedAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  updateCalls.length = 0;
  updateReturns = [{ id: "order_1" }];
  lastSelectWhere = undefined;
  selectRow = orderRow();
  getSession.mockResolvedValue({ user: { id: USER_ID, email: "a@example.com" } });
});

describe("getMyOrderByRefAction", () => {
  it("未ログインなら null（DB も引かない）", async () => {
    getSession.mockResolvedValue(null);
    expect(await getMyOrderByRefAction("FJ-ABC123")).toBeNull();
    expect(lastSelectWhere).toBeUndefined();
  });

  it("空の注文番号なら null", async () => {
    expect(await getMyOrderByRefAction("   ")).toBeNull();
    expect(lastSelectWhere).toBeUndefined();
  });

  it("ログイン中ユーザーの id で必ず絞り込む（他人の注文を引かせない）", async () => {
    await getMyOrderByRefAction("FJ-ABC123");
    // 条件に束縛された値を集め、注文番号とユーザー id の両方が入っていることを見る。
    // （orderRef だけで引いていたら、番号を知っている第三者に中身が見えてしまう）
    const bound = collectBoundValues(lastSelectWhere);
    expect(bound).toContain("FJ-ABC123");
    expect(bound).toContain(USER_ID);
  });

  it("該当が無ければ null（存在の有無を区別しない）", async () => {
    selectRow = undefined;
    expect(await getMyOrderByRefAction("FJ-OTHER")).toBeNull();
  });

  it("見つかったら明細をパースして返す", async () => {
    const order = await getMyOrderByRefAction("FJ-ABC123");
    expect(order).not.toBeNull();
    expect(order?.orderRef).toBe("FJ-ABC123");
    expect(order?.items).toHaveLength(1);
    expect(order?.items[0].slug).toBe("shogun");
    expect(order?.total).toBe(3850);
    expect(order?.paidAt).toBeInstanceOf(Date);
  });

  it("itemsJson が壊れていても落ちず空配列にする", async () => {
    selectRow = orderRow({ itemsJson: "{{not json" });
    const order = await getMyOrderByRefAction("FJ-ABC123");
    expect(order?.items).toEqual([]);
  });
});

describe("requestOrderCancellationAction", () => {
  it("未ログインは unauth", async () => {
    getSession.mockResolvedValue(null);
    expect(
      await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
    ).toEqual({ ok: false, error: "unauth" });
  });

  it("confirmed の注文は依頼を受け付け、依頼日時を記録して通知する", async () => {
    const res = await requestOrderCancellationAction({
      orderRef: "FJ-ABC123",
      reason: "日程が変わったため",
    });

    expect(res).toEqual({ ok: true });
    expect(updateCalls[0].cancelRequestedAt).toBeInstanceOf(Date);
    expect(updateCalls[0].cancelReason).toBe("日程が変わったため");
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(String(alertOps.mock.calls[0][1])).toContain("FJ-ABC123");
  });

  it("preparing でも受け付ける（まだ発送していない）", async () => {
    selectRow = orderRow({ status: "preparing" });
    expect(
      await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
    ).toEqual({ ok: true });
  });

  it("理由が未記入なら null として保存する", async () => {
    await requestOrderCancellationAction({ orderRef: "FJ-ABC123", reason: "  " });
    expect(updateCalls[0].cancelReason).toBeNull();
  });

  it("理由は 500 文字で切り詰める", async () => {
    await requestOrderCancellationAction({
      orderRef: "FJ-ABC123",
      reason: "あ".repeat(600),
    });
    expect((updateCalls[0].cancelReason as string).length).toBe(500);
  });

  it("発送後（shipped / delivered）は受け付けない", async () => {
    for (const status of ["shipped", "delivered"]) {
      selectRow = orderRow({ status });
      expect(
        await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
      ).toEqual({ ok: false, error: "not_cancellable" });
    }
    expect(updateCalls).toHaveLength(0);
    expect(alertOps).not.toHaveBeenCalled();
  });

  it("返金済み・キャンセル済みの注文も受け付けない", async () => {
    for (const status of ["refunded", "cancelled", "pending"]) {
      selectRow = orderRow({ status });
      expect(
        await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
      ).toEqual({ ok: false, error: "not_cancellable" });
    }
  });

  it("既に依頼済みなら already（通知も重ねない）", async () => {
    selectRow = orderRow({ cancelRequestedAt: new Date() });
    expect(
      await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
    ).toEqual({ ok: false, error: "already" });
    expect(alertOps).not.toHaveBeenCalled();
  });

  it("連打で同時に届いても、更新できなかった側は already を返す", async () => {
    updateReturns = []; // 先行リクエストが既に依頼を記録した状態
    expect(
      await requestOrderCancellationAction({ orderRef: "FJ-ABC123" }),
    ).toEqual({ ok: false, error: "already" });
    expect(alertOps).not.toHaveBeenCalled();
  });

  it("他人の注文（該当なし）は not_found", async () => {
    selectRow = undefined;
    expect(
      await requestOrderCancellationAction({ orderRef: "FJ-OTHER" }),
    ).toEqual({ ok: false, error: "not_found" });
  });

  it("通知に失敗しても依頼自体は成功として返す", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    alertOps.mockRejectedValue(new Error("smtp down"));

    const res = await requestOrderCancellationAction({ orderRef: "FJ-ABC123" });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true });
  });
});
