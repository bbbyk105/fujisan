/**
 * @jest-environment node
 */
import { fujisanProducts, getFujisanProductBySlug } from "@/data/fujisan-products";
import {
  FUJISAN_LEGAL,
  SHIPPING_FEE,
  SHIPPING_REGIONS,
} from "@/data/fujisan-legal";

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
/** update された値。決済の開始では Session の id を控える。 */
const updated: Array<Record<string, unknown>> = [];
let updateShouldThrow = false;
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
    update: () => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => {
          if (updateShouldThrow) throw new Error("d1 unavailable");
          updated.push(values);
        },
      }),
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

const consumeRateLimit = jest.fn();
jest.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: (...a: unknown[]) => consumeRateLimit(...a),
  clientIpFrom: () => "203.0.113.1",
}));

const verifyTurnstile = jest.fn();
jest.mock("@/lib/turnstile", () => ({
  verifyTurnstile: (...a: unknown[]) => verifyTurnstile(...a),
}));

let mockSiteKey: string | null = "site";
jest.mock("@/data/fujisan-turnstile", () => ({
  get TURNSTILE_SITE_KEY() {
    return mockSiteKey;
  },
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
/** Stripe に渡した品名。領収書にそのまま載る。 */
const lastLineNames = (): string[] =>
  lastSessionArgs().line_items.map(
    (line: { price_data: { product_data: { name: string } } }) =>
      line.price_data.product_data.name,
  );

beforeEach(() => {
  jest.clearAllMocks();
  inserted.length = 0;
  deleted.length = 0;
  updated.length = 0;
  updateShouldThrow = false;
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
  consumeRateLimit.mockResolvedValue({ ok: true });
  env.TURNSTILE_SECRET_KEY = undefined;
  mockSiteKey = "site";
  verifyTurnstile.mockResolvedValue(true);
});

// ログインなしで注文を作り在庫を押さえられるので、入力と回数をサーバーで絞る。
describe("startCheckoutAction — ゲスト購入", () => {
  const ITEMS = [{ slug: "shogun", ml: 300, qty: 1 }];

  beforeEach(() => {
    getSession.mockResolvedValue(null);
  });

  it("メールアドレスがあれば、アカウントに紐づかない注文を作る", async () => {
    const res = await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(res).toMatchObject({
      ok: true,
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    expect(lastOrder()).toMatchObject({
      userId: null,
      status: "pending",
      customerEmail: "guest@example.com",
      address: "",
    });
  });

  it("住所と電話番号は Stripe の決済ページで必ず入力してもらう", async () => {
    await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(lastSessionArgs()).toMatchObject({
      shipping_address_collection: { allowed_countries: ["JP"] },
      phone_number_collection: { enabled: true },
    });
  });

  it("確認メールの宛先と領収書の宛先に、入力されたアドレスを使う", async () => {
    await start({ items: ITEMS, guestEmail: "  guest@example.com " });

    expect(lastSessionArgs().customer_email).toBe("guest@example.com");
    expect(lastSessionArgs().payment_intent_data.receipt_email).toBe(
      "guest@example.com",
    );
  });

  // 本人を確かめられないので、推測できない注文の id を「決済を始めたブラウザ」の鍵にする。
  it("決済ページから戻る URL に、注文を解放するための鍵を付ける", async () => {
    await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(lastSessionArgs().cancel_url).toContain(
      `&key=${lastOrder().id as string}`,
    );
  });

  // ブラウザの「戻る」は cancel_url を通らないので、画面が自分で解放できるようにする。
  it("注文番号と鍵を返す", async () => {
    const res = await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(res).toMatchObject({
      orderRef: lastOrder().orderRef,
      guestKey: lastOrder().id,
    });
  });

  it("決済ページを閉じられるよう、Session の id を注文に控える", async () => {
    await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(updated).toContainEqual({ stripeSessionId: "cs_test_1" });
  });

  it("Session の id を控えられなくても、決済は止めない", async () => {
    updateShouldThrow = true;
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const res = await start({ items: ITEMS, guestEmail: "guest@example.com" });
    errSpy.mockRestore();

    expect(res.ok).toBe(true);
  });

  it("形式が違うメールアドレスは invalid で拒否し、回数を消費しない", async () => {
    // 全角の入力は Stripe が拒否する。ここで止めないと原因の分からないエラーになる。
    for (const guestEmail of [
      "",
      "   ",
      "not-an-email",
      "ｔａｒｏ@gmail.com",
      "taro@ｇｍａｉｌ.com",
      "a@b..com",
    ]) {
      expect(await start({ items: ITEMS, guestEmail })).toEqual({
        ok: false,
        error: "invalid",
      });
    }
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(0);
  });

  it("20 歳以上の確認は省けず、回数も消費しない", async () => {
    const res = await startCheckoutAction({
      items: ITEMS,
      guestEmail: "guest@example.com",
    });

    expect(res).toEqual({ ok: false, error: "age" });
    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(0);
  });

  it("回数の上限を超えたら rate を返し、注文も在庫も動かさない", async () => {
    consumeRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 60 });

    const res = await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(res).toEqual({ ok: false, error: "rate" });
    expect(consumeRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({ bucket: "guestCheckout" }),
    );
    expect(inserted).toHaveLength(0);
    expect(reserveStock).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  // 1 行ごとの上限だけだと、同じ商品を複数行に分けてすり抜けられる。
  it("同じ商品が複数行に分かれたカートは invalid で拒否する", async () => {
    const res = await start({
      items: [
        { slug: "shogun", ml: 300, qty: 12 },
        { slug: "shogun", ml: 300, qty: 12 },
      ],
      guestEmail: "guest@example.com",
    });

    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
    expect(reserveStock).not.toHaveBeenCalled();
  });

  it("不正なカートでは回数を消費しない", async () => {
    const res = await start({
      items: [{ slug: "nope", ml: 300, qty: 1 }],
      guestEmail: "guest@example.com",
    });

    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("ログイン中ならゲストの入力は使わず、アカウントの注文にする", async () => {
    getSession.mockResolvedValue({
      user: { id: "user_1", email: "a@example.com", name: "佐藤 優子" },
    });

    await start({ items: ITEMS, guestEmail: "guest@example.com" });

    expect(lastSessionArgs().cancel_url).not.toContain("key=");
    expect(lastOrder().id).toBeTruthy();

    expect(lastOrder()).toMatchObject({
      userId: "user_1",
      customerEmail: "a@example.com",
    });
    expect(consumeRateLimit).not.toHaveBeenCalled();
  });
});

// カードなしで在庫を押さえられるので、ゲストの決済開始はボットを止める。
describe("startCheckoutAction — ゲストのボット判定", () => {
  const ITEMS = [{ slug: "shogun", ml: 300, qty: 1 }];
  const guest = (turnstileToken?: string) =>
    start({ items: ITEMS, guestEmail: "guest@example.com", turnstileToken });

  beforeEach(() => {
    getSession.mockResolvedValue(null);
    env.TURNSTILE_SECRET_KEY = "secret";
  });

  it("判定に通れば決済へ進む", async () => {
    const res = await guest("token");

    expect(res.ok).toBe(true);
    expect(verifyTurnstile).toHaveBeenCalledWith({
      secret: "secret",
      token: "token",
      ip: "203.0.113.1",
    });
  });

  it("判定に落ちたら bot を返し、注文も在庫も動かさない", async () => {
    verifyTurnstile.mockResolvedValue(false);

    await expect(guest("token")).resolves.toEqual({ ok: false, error: "bot" });
    expect(inserted).toHaveLength(0);
    expect(reserveStock).not.toHaveBeenCalled();
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  // 判定に落ちる要求に枠を使わせると、ボットが同じ IP のお客様を締め出せる。
  it("判定に落ちたら、回数を消費しない", async () => {
    verifyTurnstile.mockResolvedValue(false);

    await guest("fake-token");

    expect(consumeRateLimit).not.toHaveBeenCalled();
  });

  it("判定を通っても、回数の上限を超えていたら止める", async () => {
    consumeRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 60 });

    await expect(guest("token")).resolves.toEqual({ ok: false, error: "rate" });
    expect(inserted).toHaveLength(0);
  });

  it("秘密鍵が未設定の間は判定しない（キーを入れるまで決済を止めない）", async () => {
    env.TURNSTILE_SECRET_KEY = undefined;

    const res = await guest();

    expect(res.ok).toBe(true);
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });

  // ウィジェットが無いのに判定すると、ゲスト全員が止まる。
  it("サイトキーが無ければ、秘密鍵があっても判定しない", async () => {
    mockSiteKey = null;

    const res = await guest();

    expect(res.ok).toBe(true);
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });

  // トークンの無いボットに枠を使わせると、同じ IP のお客様が締め出される。
  it("トークンが無ければ bot を返し、回数を消費しない", async () => {
    await expect(guest()).resolves.toEqual({ ok: false, error: "bot" });

    expect(consumeRateLimit).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(0);
  });

  it("ログイン中は判定しない", async () => {
    getSession.mockResolvedValue({
      user: { id: "user_1", email: "a@example.com", name: "佐藤 優子" },
    });

    const res = await start({ items: ITEMS });

    expect(res.ok).toBe(true);
    expect(verifyTurnstile).not.toHaveBeenCalled();
  });
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
      shippingRegion: "mainland",
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
      orderRef: lastOrder().orderRef,
    });
    expect(deleted).toHaveLength(0);
  });
});

// 領収書は Stripe が出す。宛先と税率は Stripe に渡した内容からしか作られないので、
// ここで渡し忘れると、領収書が届かない・税率が載らないまま本番に出る。
describe("startCheckoutAction — Stripe の領収書", () => {
  const CART = [{ slug: "shogun", ml: 300, qty: 1 }];

  it("注文者のメールアドレスを領収書の宛先に渡す", async () => {
    await start({ items: CART });
    expect(lastSessionArgs().payment_intent_data.receipt_email).toBe(
      "a@example.com",
    );
  });

  it("注文の逆引きキーは領収書の宛先を足しても残す", async () => {
    await start({ items: CART });
    expect(lastSessionArgs().payment_intent_data.metadata).toEqual(
      lastSessionArgs().metadata,
    );
  });

  it("メールアドレスが無ければ宛先を渡さない（空文字は Stripe が受け付けない）", async () => {
    getSession.mockResolvedValue({ user: { id: "user_1", email: "  " } });
    await start({ items: CART });
    expect(lastSessionArgs().payment_intent_data).not.toHaveProperty(
      "receipt_email",
    );
  });

  // Stripe の税率は行ごとに端数処理するので、領収書に税額が出ると、税率ごとに
  // 1 回という適格請求書の決まりと合わない注文ができる（¥2,100×5 と ¥1,850×5 で
  // Stripe は ¥1,796、1 回で計算すると ¥1,795）。
  it("領収書に税額が出ないよう、Stripe の税率を渡さない", async () => {
    await start({ items: CART });
    const lines = lastSessionArgs().line_items;
    expect(lines.length).toBe(2);
    for (const line of lines) {
      expect(line).not.toHaveProperty("tax_rates");
    }
  });

  // 適格簡易請求書は税額か税率のどちらかでよい。税額を出さないので税率が要る。
  it("領収書の適用税率として、商品と送料の品名に税率を書く", async () => {
    await start({ items: CART });
    const names = lastLineNames();

    expect(names.length).toBe(2);
    for (const name of names) expect(name).toContain("税込・税率10%");
  });

  it("英語のページからの決済は、品名の税率も英語で書く", async () => {
    await start({ items: CART, locale: "en" });

    for (const name of lastLineNames()) {
      expect(name).toContain("incl. 10% consumption tax");
      expect(name).not.toContain("税込");
    }
  });

  it("Stripe へ渡す金額は税込のカタログ価格のまま", async () => {
    await start({ items: CART });
    const [item, shipping] = lastSessionArgs().line_items;
    expect(item.price_data.unit_amount).toBe(SHOGUN_300.priceJpy);
    expect(shipping.price_data.unit_amount).toBe(SHIPPING_FEE.flatJpy);
  });

  it("Stripe の管理画面で探せるよう、注文番号を支払いの説明に入れる", async () => {
    await start({ items: CART });
    const args = lastSessionArgs();
    expect(args.payment_intent_data.description).toBe(
      `ご注文 ${args.metadata.orderRef}`,
    );
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

describe("startCheckoutAction — お届け地域", () => {
  const CART = [{ slug: "shogun", ml: 300, qty: 1 }];
  const shippingLineOf = () =>
    lastSessionArgs().line_items[lastSessionArgs().line_items.length - 1];

  it("選んだ地域の送料を注文と Stripe の両方に載せ、品名に地域を書く", async () => {
    await start({ items: CART, shippingRegion: "hokkaido" });
    const shipping = SHIPPING_FEE.flatJpy + SHIPPING_REGIONS.hokkaido.surchargeJpy;

    expect(lastOrder().shipping).toBe(shipping);
    expect(lastOrder().total).toBe(SHOGUN_300.priceJpy + shipping);
    expect(shippingLineOf().price_data.unit_amount).toBe(shipping);
    expect(shippingLineOf().price_data.product_data.name).toContain("北海道");
    expect(lastSessionArgs().metadata.shippingRegion).toBe("hokkaido");
  });

  it("地域を渡さなければ本州・四国・九州の送料", async () => {
    await start({ items: CART });

    expect(lastOrder().shipping).toBe(SHIPPING_FEE.flatJpy);
    expect(lastSessionArgs().metadata.shippingRegion).toBe("mainland");
  });

  it("送料無料の注文でも、地域の追加分は請求する", async () => {
    await start({
      items: [{ slug: "shogun", ml: 300, qty: 10 }],
      shippingRegion: "remote",
    });

    expect(lastOrder().shipping).toBe(SHIPPING_REGIONS.remote.surchargeJpy);
    expect(shippingLineOf().price_data.unit_amount).toBe(
      SHIPPING_REGIONS.remote.surchargeJpy,
    );
  });

  it("知らない地域は invalid を返し、注文を作らない", async () => {
    const res = await start({
      items: CART,
      shippingRegion: "mars" as never,
    });

    expect(res).toEqual({ ok: false, error: "invalid" });
    expect(inserted).toHaveLength(0);
  });

  it("登録住所の地域と合わなければ、請求せずに地域を返す", async () => {
    profileRow = {
      name: "佐藤 優子",
      phone: "09012345678",
      postalCode: "0600001",
      address: "北海道札幌市中央区北一条西1-1",
    };

    const res = await start({ items: CART, shippingRegion: "mainland" });

    expect(res).toEqual({
      ok: false,
      error: "region",
      shippingRegion: "hokkaido",
    });
    expect(inserted).toHaveLength(0);
    expect(sessionsCreate).not.toHaveBeenCalled();
  });

  it("登録住所の地域と合っていれば、そのまま進む", async () => {
    profileRow = {
      name: "佐藤 優子",
      phone: "09012345678",
      postalCode: "0600001",
      address: "北海道札幌市中央区北一条西1-1",
    };

    const res = await start({ items: CART, shippingRegion: "hokkaido" });

    expect(res.ok).toBe(true);
  });
});

describe("startCheckoutAction — 決済ページの表示", () => {
  const CART = [{ slug: "shogun", ml: 300, qty: 1 }];

  it("確定ボタンの画面に、引渡時期・支払時期・返品の条件を出す", async () => {
    await start({ items: CART });
    const message = lastSessionArgs().custom_text.submit.message;

    expect(message).toContain(FUJISAN_LEGAL.deliveryTiming);
    expect(message).toContain(FUJISAN_LEGAL.paymentTiming);
    expect(message).toContain(FUJISAN_LEGAL.returnsPolicy);
    expect(message.length).toBeLessThanOrEqual(1200);
  });

  it("英語のページでは英語で出す", async () => {
    await start({ items: CART, locale: "en" });
    const message = lastSessionArgs().custom_text.submit.message;

    expect(message).toContain(FUJISAN_LEGAL.returnsPolicyEn);
    expect(message.length).toBeLessThanOrEqual(1200);
  });

  it("住所を Stripe で集めるときは、選んだ地域の住所を入れるよう案内する", async () => {
    await start({ items: CART, shippingRegion: "remote" });

    expect(lastSessionArgs().custom_text.shipping_address.message).toContain(
      "沖縄・離島",
    );
  });

  it("登録住所へ送るときは住所の案内を出さない", async () => {
    profileRow = {
      name: "佐藤 優子",
      phone: "09012345678",
      postalCode: "4170051",
      address: "静岡県富士市吉原2-8-21",
    };
    await start({ items: CART });

    expect(lastSessionArgs().custom_text.shipping_address).toBeUndefined();
  });
});
