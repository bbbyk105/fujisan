"use client";

import { useState } from "react";
import { AdminContactRow } from "@/components/fujisan/admin/AdminContactRow";
import type { AdminContactItem } from "@/lib/actions/admin-contacts";

/**
 * お問い合わせの一覧。
 *
 * 既定の表示は対応済みを出さないので、対応済みで保存した行はその場で消える
 * （ほかの管理者が先に対応済みにしていた場合も同じ）。行の中の表示は見えなく
 * なるため、結果は一覧の側に残す。
 * 行が 1 件も無くなっても結果を出せるよう、空の表示もここで持つ。
 */
export function AdminContactList({
  messages,
  openOnly,
}: {
  messages: AdminContactItem[];
  openOnly: boolean;
}) {
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <>
      <div role="status" data-testid="contact-result">
        {notice !== null && (
          <p className="mt-6 text-[13px] leading-[1.8] text-indigo/80 [overflow-wrap:anywhere]">
            {notice}
          </p>
        )}
      </div>

      {messages.length === 0 ? (
        <div className="py-16">
          <p className="font-serif text-[18px] font-medium text-indigo">
            {openOnly
              ? "未対応・対応中のお問い合わせはありません。"
              : "お問い合わせはまだありません。"}
          </p>
          {openOnly && (
            <p className="mt-2 text-[13px] leading-[1.8] text-indigo/65">
              対応済みのお問い合わせは「すべて」で確認できます。
            </p>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-indigo/12">
          {messages.map((m) => (
            <AdminContactRow
              key={m.id}
              message={m}
              onDone={
                openOnly
                  ? () =>
                      setNotice(`${m.name} 様のお問い合わせを対応済みにしました。`)
                  : undefined
              }
              onConflict={
                openOnly
                  ? () =>
                      setNotice(
                        `${m.name} 様のお問い合わせは、ほかの管理者が先に更新しました。`,
                      )
                  : undefined
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}
