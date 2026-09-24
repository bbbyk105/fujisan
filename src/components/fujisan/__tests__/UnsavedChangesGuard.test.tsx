/**
 * @jest-environment jsdom
 */

// 保存していない変更があるとき、画面の移動に確認を挟むこと。
// 守りたいのは次の 4 点:
//   1. 未保存が無ければ、確認を出さずにそのまま通す
//   2. 未保存があるとき「キャンセル」なら移動を止める（Link の onClick まで届かない）
//   3. 「移動する」を選んだら通し、同じ移動の途中でもう一度は聞かない
//   4. 画面を離れない操作（新しいタブ・mailto・同じページの #見出し）は止めない

import { act, render, fireEvent } from "@testing-library/react";
import { useState } from "react";
import { UnsavedChangesGuard } from "../UnsavedChangesGuard";
import {
  confirmLeave,
  hasUnsavedChanges,
  useUnsavedChanges,
} from "@/lib/unsaved-changes";

function DirtyForm({ initiallyDirty }: { initiallyDirty: boolean }) {
  const [dirty, setDirty] = useState(initiallyDirty);
  useUnsavedChanges(dirty);
  return (
    <button type="button" onClick={() => setDirty(false)}>
      保存
    </button>
  );
}

function Page({
  dirty,
  onNavigate,
  href = "/admin/orders",
  target,
}: {
  dirty: boolean;
  onNavigate: () => void;
  href?: string;
  target?: string;
}) {
  return (
    <>
      <UnsavedChangesGuard />
      <DirtyForm initiallyDirty={dirty} />
      {/* Next.js の Link も最終的には a の onClick で遷移する */}
      <a
        href={href}
        target={target}
        onClick={(e) => {
          e.preventDefault();
          onNavigate();
        }}
      >
        移動
      </a>
    </>
  );
}

describe("UnsavedChangesGuard", () => {
  let confirmSpy: jest.SpyInstance;

  beforeEach(() => {
    confirmSpy = jest.spyOn(window, "confirm");
  });
  afterEach(() => {
    confirmSpy.mockRestore();
  });

  it("未保存が無ければ、確認を出さずに移動させる", () => {
    const onNavigate = jest.fn();
    const { getByText } = render(<Page dirty={false} onNavigate={onNavigate} />);

    fireEvent.click(getByText("移動"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("未保存があり「キャンセル」なら、移動を止める", () => {
    confirmSpy.mockReturnValue(false);
    const onNavigate = jest.fn();
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />);

    fireEvent.click(getByText("移動"));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it("「移動する」を選んだら通し、未保存の登録を捨てる", () => {
    confirmSpy.mockReturnValue(true);
    const onNavigate = jest.fn();
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />);

    fireEvent.click(getByText("移動"));

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(hasUnsavedChanges()).toBe(false);
  });

  it("保存して変更が無くなれば、確認を出さない", () => {
    const onNavigate = jest.fn();
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />);

    act(() => {
      fireEvent.click(getByText("保存"));
    });
    fireEvent.click(getByText("移動"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["新しいタブで開くリンク", { target: "_blank" }],
    ["mailto のリンク", { href: "mailto:kura@example.com" }],
    ["同じページの見出しへのリンク", { href: "#orders" }],
  ])("%s は画面を離れないので止めない", (_label, props) => {
    const onNavigate = jest.fn();
    const { getByText } = render(
      <Page dirty onNavigate={onNavigate} {...props} />,
    );

    fireEvent.click(getByText("移動"));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("Cmd / Ctrl を押しながらのクリックは新しいタブなので止めない", () => {
    const onNavigate = jest.fn();
    const { getByText } = render(<Page dirty onNavigate={onNavigate} />);

    fireEvent.click(getByText("移動"), { metaKey: true });

    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it("タブを閉じる・再読み込みでは、未保存があるときだけ引き止める", () => {
    const { unmount } = render(<Page dirty onNavigate={jest.fn()} />);

    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);

    unmount();
    render(<Page dirty={false} onNavigate={jest.fn()} />);
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);
  });
});

describe("confirmLeave", () => {
  it("未保存が無ければ尋ねずに true を返す", () => {
    const spy = jest.spyOn(window, "confirm");
    expect(confirmLeave()).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
