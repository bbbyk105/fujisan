/**
 * @jest-environment node
 */

// 保存期間を過ぎた個人情報の掃除は、管理画面のトップを開いたときに走る。
// ここが外れると、ポリシーの約束が誰にも気づかれずに守られなくなる。

const sweepExpiredPersonalData = jest.fn();
jest.mock("@/lib/order-retention", () => ({
  sweepExpiredPersonalData: (...a: unknown[]) => sweepExpiredPersonalData(...a),
}));

let gateOk = true;
jest.mock("@/lib/admin", () => ({
  requireAdmin: async () =>
    gateOk ? { ok: true } : { ok: false, reason: "forbidden" },
}));
jest.mock("@/lib/catalog", () => ({ getLiveSkus: async () => [] }));

// どの集計にも 0 を返す最小の drizzle スタブ。
function chain(): unknown {
  const row = [{ orders: 0, revenue: 0, n: 0 }];
  return new Proxy(() => undefined, {
    get: (_t, key) =>
      key === "then"
        ? (resolve: (v: unknown) => void) => resolve(row)
        : () => chain(),
  });
}
jest.mock("@/db", () => ({ getDb: async () => chain() }));

import { adminDashboardAction } from "@/lib/actions/admin-dashboard";

beforeEach(() => {
  jest.clearAllMocks();
  gateOk = true;
  sweepExpiredPersonalData.mockResolvedValue(undefined);
});

describe("adminDashboardAction", () => {
  it("管理画面を開くと、保存期間を過ぎた個人情報の掃除を走らせる", async () => {
    await adminDashboardAction();
    expect(sweepExpiredPersonalData).toHaveBeenCalledTimes(1);
  });

  it("権限が無ければ走らせない", async () => {
    gateOk = false;
    expect(await adminDashboardAction()).toMatchObject({ ok: false });
    expect(sweepExpiredPersonalData).not.toHaveBeenCalled();
  });
});
