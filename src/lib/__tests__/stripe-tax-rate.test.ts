/**
 * @jest-environment node
 */

// 領収書に税率を載せるには、Stripe 上の Tax Rate が要る。
// id を環境変数で持つと、本番キーへ切り替えたときに sandbox の id が残り、
// Stripe が「No such tax rate」を返して全ての決済が止まる。そこでキーごとに探して使う。

import type Stripe from "stripe";
import { getConsumptionTaxRateId } from "@/lib/stripe";

function fakeStripe(existing: Array<Record<string, unknown>> = []) {
  const list = jest.fn<Promise<{ data: unknown[] }>, unknown[]>(async () => ({
    data: existing,
  }));
  const create = jest.fn<Promise<{ id: string }>, unknown[]>(async () => ({
    id: "txr_created",
  }));
  return {
    stripe: { taxRates: { list, create } } as unknown as Stripe,
    list,
    create,
  };
}

const JCT_10 = {
  id: "txr_existing",
  percentage: 10,
  inclusive: true,
  country: "JP",
};

describe("getConsumptionTaxRateId", () => {
  it("内税 10% の税率があれば、それを使う（増やさない）", async () => {
    const { stripe, create } = fakeStripe([JCT_10]);
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_existing");
    expect(create).not.toHaveBeenCalled();
  });

  it("有効で内税の税率だけを Stripe に問い合わせる", async () => {
    const { stripe, list } = fakeStripe([JCT_10]);
    await getConsumptionTaxRateId(stripe);
    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({ active: true, inclusive: true }),
      expect.anything(),
    );
  });

  it("他の国・他の税率は使わない", async () => {
    const { stripe, create } = fakeStripe([
      { ...JCT_10, id: "txr_8", percentage: 8 },
      { ...JCT_10, id: "txr_us", country: "US" },
    ]);
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_created");
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("無ければ内税 10% で作る（外税だと請求額が増える）", async () => {
    const { stripe, create } = fakeStripe();
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_created");
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: "消費税",
        percentage: 10,
        inclusive: true,
        country: "JP",
        tax_type: "jct",
      }),
      expect.anything(),
    );
  });

  // アカウントは天地星空と共用で、ダッシュボードから税率をアーカイブできる。
  // id を持ち続けると、アーカイブした瞬間に全ての決済が止まる。
  it("税率がアーカイブされたら（一覧から消えたら）作り直す", async () => {
    const { stripe, list, create } = fakeStripe([JCT_10]);
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_existing");

    list.mockResolvedValueOnce({ data: [] });
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_created");
    expect(create).toHaveBeenCalledTimes(1);
  });

  // 在庫を押さえたあとの経路で待つので、遅いときは税率を諦めて決済へ進む。
  it("問い合わせは短く打ち切り、再試行しない", async () => {
    const { stripe, list, create } = fakeStripe();
    await getConsumptionTaxRateId(stripe);

    const limits = { timeout: 3000, maxNetworkRetries: 0 };
    expect(list.mock.calls[0]).toContainEqual(limits);
    expect(create.mock.calls[0]).toContainEqual(limits);
  });

  it("Stripe が失敗したら null を返し、次回は問い合わせ直す", async () => {
    const { stripe, list } = fakeStripe([JCT_10]);
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    list.mockRejectedValueOnce(new Error("stripe down"));

    expect(await getConsumptionTaxRateId(stripe)).toBeNull();
    expect(await getConsumptionTaxRateId(stripe)).toBe("txr_existing");
    consoleError.mockRestore();
  });
});
