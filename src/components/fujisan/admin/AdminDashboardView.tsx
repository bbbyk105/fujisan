import Link from "next/link";
import type { DashboardSummary } from "@/lib/actions/admin-dashboard";
import type { OrderStatus } from "@/db/orders-schema";
import { orderStatusJp } from "@/data/fujisan-orders";
import { formatDayTimeJp } from "@/lib/format-date";

const yen = new Intl.NumberFormat("ja-JP");

/** 状態は文字の色だけで示す（ピル・ドットは作らない）。顧客向けの表示と色を揃える */
const STATUS_TONE: Record<OrderStatus, string> = {
  pending: "text-indigo/55",
  confirmed: "text-gold-ink",
  preparing: "text-gold-ink",
  shipped: "text-moss",
  delivered: "text-moss",
  cancelled: "text-crimson",
  refunded: "text-crimson",
};

/**
 * 管理トップの本文。データは受け取るだけで、取得も認可もしない
 * （ページ側が担う）。表示だけを切り出しておくと、実データなしで見た目を確かめられる。
 */
export function AdminDashboardView({
  summary,
}: {
  summary: DashboardSummary | null;
}) {
  if (!summary) {
    return (
      <div className="border-t border-indigo/15 pt-8">
        <p className="text-[15px] font-semibold text-indigo">
          集計を読み込めませんでした。
        </p>
        <p className="mt-3 max-w-[48ch] text-[14px] leading-[1.9] text-indigo/75">
          時間をおいて再読み込みするか、
          <Link
            href="/admin/orders"
            className="mx-1 text-indigo underline decoration-indigo/30 underline-offset-4"
          >
            注文一覧
          </Link>
          から確認してください。
        </p>
      </div>
    );
  }

  const s = summary;

  // 上段は「気にすべきこと」（要対応・在庫）、下段は「起きたこと」（注文・累計）。
  // 要対応を全幅に伸ばすと、項目名と件数のあいだを目が長く渡ることになる。
  return (
    <div className="flex flex-col gap-14 md:gap-16">
      {/* 上下の段で列の区切りを揃える（ずれると表の端が波打って見える） */}
      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <Todo summary={s} />
        <StockAlerts soldOut={s.soldOut} lowStock={s.lowStock} />
      </div>

      <div className="grid grid-cols-1 gap-14 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <RecentOrders recent={s.recent} />
        <Totals summary={s} />
      </div>
    </div>
  );
}

/** 区画の見出し。左に名前、右に行き先。罫は見出しの下に 1 本だけ */
function Head({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-indigo/20 pb-3">
      <h2 className="font-serif text-[18px] font-medium text-indigo">{title}</h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-[13px] text-indigo/70 underline decoration-indigo/25 underline-offset-4 transition-colors hover:text-indigo hover:decoration-gold"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}

/**
 * 「いま人が動かないと止まるもの」。
 * 0 件の項目は出さない — 常時ゼロが並んでいると、本当に出たときに気づけない。
 */
function Todo({ summary }: { summary: DashboardSummary }) {
  const items = [
    {
      n: summary.actionRequired,
      label: "発送待ちの注文",
      href: "/admin/orders?filter=action",
    },
    {
      n: summary.cancelRequests,
      label: "キャンセルの依頼",
      href: "/admin/orders?filter=action",
    },
    {
      n: summary.newContacts,
      label: "未対応のお問い合わせ",
      href: "/admin/contacts",
    },
    {
      n: summary.pendingTradeAccounts,
      label: "審査待ちの取扱店",
      href: "/admin/customers",
    },
  ].filter((i) => i.n > 0);

  return (
    <section>
      <Head title="要対応" />
      {items.length === 0 ? (
        <p className="pt-5 text-[14px] text-indigo/65">
          いま対応が必要なものはありません。
        </p>
      ) : (
        <ul>
          {items.map((i) => (
            <li key={i.label} className="border-b border-indigo/10">
              {/* 行全体が行き先。名前は左、件数は右端に揃えて縦に比べられるようにする */}
              <Link
                href={i.href}
                className="group flex items-baseline justify-between gap-6 py-4 no-underline"
              >
                <span className="text-[15px] text-indigo underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-gold">
                  {i.label}
                </span>
                <span className="shrink-0 font-serif text-[22px] font-medium leading-none tabular-nums text-gold-ink">
                  {i.n}
                  <span className="ml-1 text-[13px] font-normal text-indigo/55">
                    件
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RecentOrders({ recent }: { recent: DashboardSummary["recent"] }) {
  return (
    <section>
      <Head title="直近の注文" href="/admin/orders" linkLabel="注文一覧へ" />

      {recent.length === 0 ? (
        <p className="pt-5 text-[14px] leading-[1.9] text-indigo/65">
          まだ確定した注文がありません。決済が完了すると、ここに表示されます。
        </p>
      ) : (
        // 表は表として組む。行を罫で仕切り、金額は右揃えの等幅数字
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-indigo/10 text-[12.5px] text-indigo/55">
              <th scope="col" className="py-3 pr-4 font-normal">
                注文番号
              </th>
              <th scope="col" className="hidden py-3 pr-4 font-normal sm:table-cell">
                お客様
              </th>
              <th scope="col" className="py-3 pr-4 font-normal">
                状態
              </th>
              <th scope="col" className="hidden py-3 pr-4 font-normal md:table-cell">
                日時
              </th>
              <th scope="col" className="py-3 text-right font-normal">
                金額
              </th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr
                key={o.id}
                className="border-b border-indigo/10 text-[14px] transition-colors hover:bg-paper-tint/60"
              >
                <td className="py-3.5 pr-4">
                  <Link
                    href={`/admin/orders#order-${o.orderRef}`}
                    className="font-serif tabular-nums text-indigo underline decoration-indigo/20 underline-offset-4 hover:decoration-gold"
                  >
                    {o.orderRef}
                  </Link>
                </td>
                <td className="hidden py-3.5 pr-4 text-indigo/85 sm:table-cell">
                  {o.customerName || (
                    <span className="text-indigo/45">お名前未取得</span>
                  )}
                </td>
                <td
                  className={`py-3.5 pr-4 text-[13.5px] font-semibold ${STATUS_TONE[o.status]}`}
                >
                  {orderStatusJp(o.status)}
                </td>
                <td className="hidden py-3.5 pr-4 tabular-nums text-indigo/60 md:table-cell">
                  {formatDayTimeJp(o.createdAt)}
                </td>
                <td className="py-3.5 text-right font-serif tabular-nums text-indigo">
                  ¥{yen.format(o.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function StockAlerts({
  soldOut,
  lowStock,
}: {
  soldOut: DashboardSummary["soldOut"];
  lowStock: DashboardSummary["lowStock"];
}) {
  const empty = soldOut.length === 0 && lowStock.length === 0;
  return (
    <section>
      <Head title="在庫" href="/admin/products" linkLabel="在庫を編集" />
      {empty ? (
        <p className="pt-5 text-[14px] leading-[1.9] text-indigo/65">
          在庫を管理している銘柄に、完売・残りわずかのものはありません。
        </p>
      ) : (
        <ul>
          {soldOut.map((x) => (
            <li
              key={x.id}
              className="flex items-baseline justify-between gap-4 border-b border-indigo/10 py-3.5"
            >
              <span className="text-[14px] text-indigo">{x.label}</span>
              <span className="shrink-0 text-[13.5px] font-semibold text-crimson">
                完売
              </span>
            </li>
          ))}
          {lowStock.map((x) => (
            <li
              key={x.id}
              className="flex items-baseline justify-between gap-4 border-b border-indigo/10 py-3.5"
            >
              <span className="text-[14px] text-indigo">{x.label}</span>
              <span className="shrink-0 text-[13.5px] font-semibold tabular-nums text-gold-ink">
                残り {x.available} 本
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Totals({ summary }: { summary: DashboardSummary }) {
  const rows = [
    { label: "売上の累計", value: `¥${yen.format(summary.allTime.revenue)}` },
    { label: "注文の累計", value: `${yen.format(summary.allTime.orders)} 件` },
    { label: "今日の注文", value: `${summary.today.orders} 件` },
  ];
  return (
    <section>
      <Head title="累計" />
      <dl>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-4 border-b border-indigo/10 py-3.5"
          >
            <dt className="text-[14px] text-indigo/70">{r.label}</dt>
            <dd className="font-serif text-[16px] tabular-nums text-indigo">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 text-[12.5px] leading-[1.8] text-indigo/55">
        売上はキャンセル・返金を除いた金額です。日付は日本時間で区切っています。
      </p>
    </section>
  );
}
