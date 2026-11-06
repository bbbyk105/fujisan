/**
 * @jest-environment jsdom
 */

// error.tsx / global-error.tsx の「もう一度試す」で、ページへ戻れること。
//
// 境界のコンポーネントだけを描画して props を手で渡すと、Next が実際に何を渡すかを
// 確かめたことにならない。16.2 → 16.4.5 の更新で `unstable_retry` が渡されなくなった
// ときも、手で渡すテストなら通ってしまう。だから Next の本物の ErrorBoundary に載せて確かめる。
// `next/dist/...` を読んでいるのはこのためで、Next を上げて props が変わればここで落ちる。
//
// tsc ではこのずれを検出できない（`.next/types/validator.ts` が見るのは
// page / layout / route だけで、error / global-error は対象外）。

import { fireEvent, render, screen } from "@testing-library/react";
import {
  ErrorBoundary,
  type ErrorComponent,
} from "next/dist/client/components/error-boundary";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import RouteError from "../error";
import GlobalError from "../global-error";

function Page({ broken }: { broken: { current: boolean } }) {
  if (broken.current) throw new Error("一時的な障害");
  return <p>本来のページ</p>;
}

describe.each([
  ["error.tsx", RouteError],
  ["global-error.tsx", GlobalError],
])("%s の「もう一度試す」", (_file, Boundary) => {
  const uncaught: unknown[] = [];
  const recordUncaught = (event: ErrorEvent) => {
    uncaught.push(event.error);
    event.preventDefault();
  };

  beforeEach(() => {
    uncaught.length = 0;
    window.addEventListener("error", recordUncaught);
    // 境界が受け止めたエラーは React と error.tsx が console.error に出す（想定どおり）
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    window.removeEventListener("error", recordUncaught);
    jest.restoreAllMocks();
  });

  it("サーバーから取り直して、ページへ戻す", async () => {
    // `router.refresh()` が走って初めて直る障害にする。
    // 再取得しない `reset` に戻すと、ここで再び落ちてエラー画面のままになる。
    const broken = { current: true };
    const refresh = jest.fn(() => {
      broken.current = false;
    });

    render(
      <AppRouterContext.Provider
        value={{ refresh } as unknown as AppRouterInstance}
      >
        <ErrorBoundary errorComponent={Boundary as unknown as ErrorComponent}>
          <Page broken={broken} />
        </ErrorBoundary>
      </AppRouterContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /もう一度試す/ }));

    expect(uncaught).toEqual([]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("本来のページ")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /もう一度試す/ })).toBeNull();
  });
});
