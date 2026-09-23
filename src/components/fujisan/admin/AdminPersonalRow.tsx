import type { PersonalCustomer } from "@/lib/actions/admin-customers";
import { formatDateShortJp } from "@/lib/format-date";

const yen = new Intl.NumberFormat("ja-JP");

/**
 * 個人のお客様 1 行（表示のみ）。
 *
 * **操作は置かない。** 蔵側が顧客レコードに対してできることは今は無く、
 * 押せるものがあると「何か起きる」と誤解される。連絡先は見れば足りる。
 */
export function AdminPersonalRow({ customer }: { customer: PersonalCustomer }) {
  const hasOrders = customer.orderCount > 0;

  return (
    <li className="border border-indigo/12 bg-white px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <div className="min-w-[240px]">
          <p className="font-serif text-[14.5px] font-semibold tracking-[0.04em] text-indigo">
            {customer.name.trim() || "（お名前未設定）"}
            {!customer.emailVerified && (
              <span className="ml-2 border border-gold/55 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.18em] text-gold-ink">
                メール未確認
              </span>
            )}
          </p>
          <p className="mt-1 text-[11.5px] text-indigo/65">
            {customer.email}
            {customer.phone && (
              <>
                <span className="mx-1.5 text-indigo/30">·</span>
                {customer.phone}
              </>
            )}
          </p>
          {customer.address && (
            <p className="mt-1 text-[11.5px] text-indigo/55">
              〒{customer.postalCode ?? "—"} {customer.address}
            </p>
          )}
        </div>

        <div className="flex items-baseline gap-6 text-[11.5px] tabular-nums">
          <span className="text-indigo/60">
            ご注文{" "}
            <strong className="text-[13px] text-indigo">
              {customer.orderCount}
            </strong>{" "}
            件
          </span>
          <span className="text-indigo/60">
            累計{" "}
            <strong className="text-[13px] text-indigo">
              ¥{yen.format(customer.totalSpent)}
            </strong>
          </span>
          <span className="text-indigo/50">
            {hasOrders && customer.lastOrderedAt
              ? `最終 ${formatDateShortJp(customer.lastOrderedAt)}`
              : `登録 ${formatDateShortJp(customer.createdAt)}`}
          </span>
        </div>
      </div>
    </li>
  );
}
