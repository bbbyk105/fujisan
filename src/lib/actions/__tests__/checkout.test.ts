/**
 * @jest-environment node
 */
import { fujisanProducts, getFujisanProductBySlug } from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";

// ── 依存のモック ───────────────────────────────────────────────
// 決済開始はサーバー専用の依存（認証・D1・Cloudflare env・Stripe）の上に建っている。
// ここで検証したいのは「金額をサーバーで引き直しているか」「完売や不正入力を
// 最後の砦として拒否できるか」「Stripe が落ちたとき pending 注文を掃除するか」。

const getSession = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({ api: { getSession } }),
}));

jest.mock("next/headers", () => ({
  headers: async () => new Headers(),
}));

const env: Record<string, string | undefined> = {
  STRIPE_SECRET_KEY: "sk_test_123",
  BETTER_AUTH_URL: "https://example.com",
};
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env }),
}));

/** insert された注文行と delete された注文 id を記録する最小の drizzle スタブ。 */
const inserted: Array<Record<string, unknown>> = [];
const deleted: unknown[] = [];
/** select（登録済みのお届け先）が返す行。 */
let profileRow: Record<string, unknown> | undefined;

jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => (profileRow ? [profileRow] : [{}]),
        }),
      }),
    }),
    insert: () => ({
      values: async (row: Record<string, unknown>) => {
        inserted.push(row);
      },
    }),
    delete: () => ({
      where: async (cond: unknown) => {
        deleted.push(cond);
      },
    }),
  }),
}));

const sessionsCreate = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getStripe: () => ({ checkout: { sessions: { create: sessionsCreate } } }),
}));

// 在庫の中身は inventory.test.ts が実 SQL で見る。ここでは
// 「決済の流れの正しい位置で呼ばれるか」だけを確かめたいのでモックする。
const reserveStock = jest.fn();
const releaseStock = jest.fn();
jest.mock("@/lib/inventory", () => ({
  reserveStock: (...a: unknown[]) => reserveStock(...a),
  releaseStock: (...a: unknown[]) => releaseStock(...a),
}));

import { startCheckoutAction } from "@/lib/actions/checkout";

const SHOGUN = getFujisanProductBySlug("shogun")!;
const SHOGUN_300 = SHOGUN.volumes.find((v) => v.ml === 300)!;
const KOKORO = getFujisanProductBySlug("kokoro")!;
const KOKORO_300 = KOKORO.volumes.find((v) => v.ml === 300)!;

/**
 * 年齢確認済みを既定にした呼び出しヘルパー。
 * 年齢ゲートそのものは専用の describe で検証する。
 */
const start = (
  input: Parameters<typeof startCheckoutAction>[0] extends infer T
    ? Omit<T & object, "ageConfirmed"> & { ageConfirmed?: boolean }
    : never,
) => startCheckoutAction({ ageConfirmed: true, ...input });

/** 直近の insert 呼び出しで保存された注文行。 */
const lastOrder = () => inserted[inserted.length - 1];
/** Stripe に渡した Checkout Session の引数。 */
const lastSessionArgs = () =>
  sessionsCreate.mock.calls[sessionsCreate.mock.calls.length - 1][0];

beforeEach(() => {
  jest.clearAllMocks();
  inserted.length = 0;
  deleted.length = 0;
  profileRow = undefined;
  env.STRIPE_SECRET_KEY = "sk_test_123";
  getSession.mockResolvedValue({
    user: { id: "user_1", email: "a@example.com", name: "佐藤 優子" },
  });
  sessionsCreate.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/c/pay/cs_test_1",
  });
  reserveStock.mockResolvedValue({ ok: true });
  releaseStock.mockResolvedValue(undefined);
});

describe("startCheckoutAction — ガード", () => {
  it("未ログインは unauth で拒否し、注文を作らない", async () => {
    getSession.mockResolvedValue(null);
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({ ok: false, error: "unauth" });
    expect(inserted).toHaveLength(0);
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("空カートは invalid で拒否する", async () => {
    const res = await start({ items: [] });
    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("存在しない銘柄・容量は invalid で拒否する", async () => {
    expect(
      await start({ items: [{ slug: "nope", ml: 300, qty: 1 }] }),
    ).toEqual({ ok: false, error: "invalid" });
    // 720ml は全銘柄に存在しない
    expect(
      await start({ items: [{ slug: "shogun", ml: 720, qty: 1 }] }),
    ).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("数量が 1 未満・12 超・非整数なら invalid で拒否する", async () => {
    for (const qty of [0, -1, 13, 1.5, Number.NaN]) {
      expect(
        await start({ items: [{ slug: "shogun", ml: 300, qty }] }),
      ).toEqual({ ok: false, error: "invalid" });
    }
    expect(inserted).toHaveLength(0);
  });

  it("STRIPE_SECRET_KEY 未設定なら config を返し、注文を作らない", async () => {
    env.STRIPE_SECRET_KEY = undefined;
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({ ok: false, error: "config" });
    expect(inserted).toHaveLength(0);
  });

  it("年齢確認が無ければ age で拒否する（UI を迂回した直接呼び出し対策）", async () => {
    // Server Action は直接呼べるので、カートのチェックボックスだけでは守りにならない
    for (const ageConfirmed of [undefined, false, "true" as never, 1 as never]) {
      const res = await startCheckoutAction({
        items: [{ slug: "shogun", ml: 300, qty: 1 }],
        ageConfirmed,
      });
      expect(res).toEqual({ ok: false, error: "age" });
    }
    expect(inserted).toHaveLength(0);
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("年齢確認は認証の後に見る（未ログインには unauth を返す）", async () => {
    getSession.mockResolvedValue(null);
    expect(
      await startCheckoutAction({
        items: [{ slug: "shogun", ml: 300, qty: 1 }],
        ageConfirmed: false,
      }),
    ).toEqual({ ok: false, error: "unauth" });
  });

  it("完売 SKU は UI を迂回しても soldout で拒否する", async () => {
    // カタログ側を一時的に完売にする（最後の砦が効くかの確認）
    const original = SHOGUN_300.soldOut;
    SHOGUN_300.soldOut = true;
    try {
      const res = await start({
        items: [{ slug: "shogun", ml: 300, qty: 1 }],
      });
      expect(res).toEqual({ ok: false, error: "soldout" });
      expect(inserted).toHaveLength(0);
    } finally {
      SHOGUN_300.soldOut = original;
    }
  });
});

describe("startCheckoutAction — 金額はサーバーで引き直す", () => {
  it("カタログ価格から明細・小計・合計を組み立てる", async () => {
    const res = await start({
      items: [
        { slug: "shogun", ml: 300, qty: 2 },
        { slug: "kokoro", ml: 300, qty: 1 },
      ],
    });
    expect(res.ok).toBe(true);

    const subtotal = SHOGUN_300.priceJpy * 2 + KOKORO_300.priceJpy;
    const order = lastOrder();
    expect(order.subtotal).toBe(subtotal);
    expect(order.itemsCount).toBe(3);
    expect(order.shipping).toBe(SHIPPING_FEE.flatJpy);
    expect(order.total).toBe(subtotal + SHIPPING_FEE.flatJpy);
    expect(order.status).toBe("pending");
    expect(order.userId).toBe("user_1");

    // 明細は単価・小計ともカタログ由来
    const lines = JSON.parse(order.itemsJson as string);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      slug: "shogun",
      ml: 300,
      qty: 2,
      unitPrice: SHOGUN_300.priceJpy,
      lineTotal: SHOGUN_300.priceJpy * 2,
    });
  });

  it("クライアントが価格を申告しても無視される（型外の細工を渡しても効かない）", async () => {
    await start({
      items: [
        { slug: "shogun", ml: 300, qty: 1, unitPrice: 1, priceJpy: 1 } as never,
      ],
    });
    const lines = JSON.parse(lastOrder().itemsJson as string);
    expect(lines[0].unitPrice).toBe(SHOGUN_300.priceJpy);
    expect(lastOrder().total).toBe(SHOGUN_300.priceJpy + SHIPPING_FEE.flatJpy);
  });

  it("しきい値以上は送料無料になり、Stripe の明細にも送料行が乗らない", async () => {
    // 2,750円 × 6本 = 16,500円 ≧ 15,000円
    await start({ items: [{ slug: "shogun", ml: 300, qty: 6 }] });

    const subtotal = SHOGUN_300.priceJpy * 6;
    expect(subtotal).toBeGreaterThanOrEqual(SHIPPING_FEE.freeThresholdJpy);
    expect(lastOrder().shipping).toBe(0);
    expect(lastOrder().total).toBe(subtotal);

    const lineItems = lastSessionArgs().line_items;
    expect(lineItems).toHaveLength(1);
    expect(
      lineItems.some((li: { price_data: { product_data: { name: string } } }) =>
        li.price_data.product_data.name.includes("配送料"),
      ),
    ).toBe(false);
  });

  it("送料がかかる注文では Stripe の明細にも送料行を足す", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    const lineItems = lastSessionArgs().line_items;
    const shippingLine = lineItems[lineItems.length - 1];
    expect(shippingLine.price_data.product_data.name).toContain("配送料");
    // JPY は最小単位が円。100 倍しない。
    expect(shippingLine.price_data.unit_amount).toBe(SHIPPING_FEE.flatJpy);
    expect(lineItems[0].price_data.unit_amount).toBe(SHOGUN_300.priceJpy);
    expect(lineItems[0].price_data.currency).toBe("jpy");
  });
});

describe("startCheckoutAction — Stripe セッション", () => {
  it("登録住所が揃っていれば Stripe の住所収集を省略し、注文に書き込む", async () => {
    profileRow = {
      name: "近藤 弘人",
      phone: "07093234144",
      postalCode: "4170051",
      address: "静岡県富士市吉原2-8-21",
    };
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });

    const args = lastSessionArgs();
    expect(args.shipping_address_collection).toBeUndefined();
    expect(args.phone_number_collection).toBeUndefined();

    const order = lastOrder();
    expect(order.postalCode).toBe("4170051");
    expect(order.address).toBe("静岡県富士市吉原2-8-21");
    expect(order.phone).toBe("07093234144");
  });

  it("郵便番号が7桁でなければ登録住所とみなさず Stripe 側で収集する", async () => {
    profileRow = {
      name: "近藤 弘人",
      phone: "",
      postalCode: "417-0051", // ハイフン付きは 7 桁数字ではない
      address: "静岡県富士市吉原2-8-21",
    };
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });

    const args = lastSessionArgs();
    expect(args.shipping_address_collection).toEqual({
      allowed_countries: ["JP"],
    });
    expect(args.phone_number_collection).toEqual({ enabled: true });
    // 住所は空で開始し、支払い完了時に Webhook が書き戻す
    expect(lastOrder().postalCode).toBe("");
    expect(lastOrder().address).toBe("");
  });

  it("住所は登録済みだが電話が未登録なら、電話だけ Stripe で収集する", async () => {
    profileRow = {
      name: "近藤 弘人",
      phone: "",
      postalCode: "4170051",
      address: "静岡県富士市吉原2-8-21",
    };
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });

    const args = lastSessionArgs();
    expect(args.shipping_address_collection).toBeUndefined();
    expect(args.phone_number_collection).toEqual({ enabled: true });
  });

  it("発送先は日本国内のみに限定する", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    expect(lastSessionArgs().shipping_address_collection).toEqual({
      allowed_countries: ["JP"],
    });
  });

  it("注文 id / 注文番号を metadata と payment_intent の両方に載せる", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    const args = lastSessionArgs();
    const order = lastOrder();
    expect(args.metadata).toEqual({
      orderId: order.id,
      orderRef: order.orderRef,
    });
    expect(args.payment_intent_data.metadata).toEqual(args.metadata);
    expect(order.orderRef).toMatch(/^FJ-[0-9A-Z]+$/);
  });

  it("サイトの表示言語を Stripe の決済ページへ引き継ぐ", async () => {
    await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
      locale: "en",
    });
    expect(lastSessionArgs().locale).toBe("en");

    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    expect(lastSessionArgs().locale).toBe("ja");
  });

  it("成功時は Stripe の決済 URL を返す", async () => {
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    expect(deleted).toHaveLength(0);
  });
});

describe("startCheckoutAction — 在庫の引き当て", () => {
  it("Stripe へ送り出す前に在庫を押さえる", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 2 }] });

    expect(reserveStock).toHaveBeenCalledTimes(1);
    // 引き当てるのはカタログから引き直した明細
    expect(reserveStock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ slug: "shogun", ml: 300, qty: 2 }),
    ]);
    // 決済ページを出す前に押さえていること（順序が逆だと売り越す）
    expect(reserveStock.mock.invocationCallOrder[0]).toBeLessThan(
      sessionsCreate.mock.invocationCallOrder[0],
    );
  });

  it("在庫が足りなければ soldout を返し、Stripe を呼ばず注文も残さない", async () => {
    reserveStock.mockResolvedValue({
      ok: false,
      reason: "shortage",
      shortages: [{ slug: "shogun", ml: 300, available: 1 }],
    });

    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 2 }],
    });

    expect(res).toEqual({
      ok: false,
      error: "soldout",
      shortages: [{ slug: "shogun", ml: 300, available: 1 }],
    });
    expect(sessionsCreate).not.toHaveBeenCalled();
    expect(deleted).toHaveLength(1); // 作りかけの pending 注文は消す
  });

  it("在庫側が DB エラーなら db を返す", async () => {
    reserveStock.mockResolvedValue({ ok: false, reason: "db" });
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({ ok: false, error: "db" });
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("成功したら在庫は押さえたままにする（解放しない）", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    expect(releaseStock).not.toHaveBeenCalled();
  });

  it("決済ページに 30 分の期限を付ける（放棄分の在庫を1日押さえない）", async () => {
    const before = Math.floor(Date.now() / 1000);
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });

    const expiresAt = lastSessionArgs().expires_at as number;
    // Stripe が許す下限は 30 分。既定の 24 時間では在庫を丸1日押さえてしまう。
    expect(expiresAt).toBeGreaterThanOrEqual(before + 30 * 60);
    expect(expiresAt).toBeLessThanOrEqual(before + 30 * 60 + 5);
  });

  it("キャンセル時の戻り先に注文番号を載せる（その場で解放するため）", async () => {
    await start({ items: [{ slug: "shogun", ml: 300, qty: 1 }] });
    const cancelUrl = lastSessionArgs().cancel_url as string;
    expect(cancelUrl).toContain("canceled=1");
    expect(cancelUrl).toContain(`order=${lastOrder().orderRef}`);
  });
});

describe("startCheckoutAction — 失敗時の後始末", () => {
  it("Stripe が例外を投げたら pending 注文を削除し、押さえた在庫も戻す", async () => {
    sessionsCreate.mockRejectedValue(new Error("stripe down"));
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({ ok: false, error: "stripe" });
    // 孤立した pending 注文を残さない
    expect(inserted).toHaveLength(1);
    expect(deleted).toHaveLength(1);
    // 売れていないのに在庫だけ減ったままにしない
    expect(releaseStock).toHaveBeenCalledTimes(1);
  });

  it("Session に url が無い場合も pending 注文を削除する", async () => {
    sessionsCreate.mockResolvedValue({ id: "cs_test_2", url: null });
    const res = await start({
      items: [{ slug: "shogun", ml: 300, qty: 1 }],
    });
    expect(res).toEqual({ ok: false, error: "stripe" });
    expect(deleted).toHaveLength(1);
    expect(releaseStock).toHaveBeenCalledTimes(1);
  });
});

describe("カタログの前提", () => {
  it("全 SKU の価格が正の整数（JPY は小数を持たない）", () => {
    for (const p of fujisanProducts) {
      for (const v of p.volumes) {
        expect(Number.isInteger(v.priceJpy)).toBe(true);
        expect(v.priceJpy).toBeGreaterThan(0);
        expect(Number.isInteger(v.wholesalePriceJpy)).toBe(true);
      }
    }
  });
});
