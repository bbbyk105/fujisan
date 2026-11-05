import { act, renderHook, waitFor } from "@testing-library/react";
import { refreshLiveCatalog, useLiveCatalog } from "@/lib/cart/useLiveCatalog";

// 決済をやめて引き当てを解放したあと、古い在庫のままだと自分の分が在庫切れに見える。

const response = (stock: number) => ({
  ok: true,
  json: async () => ({
    skus: { "shogun:300": { price: 2750, stock, soldOut: false, low: false } },
  }),
});

const stockOf = (catalog: Record<string, { stock: number | null }>) =>
  Object.values(catalog)[0]?.stock;

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

// 結果はモジュールの中に残るので、このファイルのテストは上から順に積み重なる。
describe("refreshLiveCatalog", () => {
  it("取得済みでも読み直して、画面の在庫を更新する", async () => {
    fetchMock.mockResolvedValueOnce(response(5));
    fetchMock.mockResolvedValueOnce(response(12));
    const { result } = renderHook(() => useLiveCatalog());
    await waitFor(() => expect(stockOf(result.current.catalog)).toBe(5));

    act(() => refreshLiveCatalog());

    await waitFor(() => expect(stockOf(result.current.catalog)).toBe(12));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  // 取得中の結果は解放の前の値かもしれない。そのまま使うと古い在庫が残る。
  it("取得中なら、終わるのを待って読み直す", async () => {
    let finishFirst!: (value: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        finishFirst = resolve;
      }),
    );
    fetchMock.mockResolvedValueOnce(response(3));
    const { result } = renderHook(() => useLiveCatalog());

    act(() => refreshLiveCatalog());
    act(() => refreshLiveCatalog());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => finishFirst(response(5)));

    await waitFor(() => expect(stockOf(result.current.catalog)).toBe(3));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
