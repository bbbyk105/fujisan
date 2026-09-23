import Link from "next/link";
import { fujisanProducts, skuKey } from "@/data/fujisan-products";
import { getLiveSkuMap } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { readTradeAccount } from "@/lib/trade";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

/**
 * 卸価格表。
 *
 * **表示の条件は「role が business」ではなく「審査が approved」**。
 * 登録は自己申告なので、role だけを条件にすると誰でも卸価格を見られる。
 * 審査状況の取得に失敗したときは見せない側に倒す（価格は一度見られたら
 * 取り消せない）。
 */
export async function WholesalePriceList() {
  const session = await getSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  const isBusiness = user?.role === "business" && Boolean(user.id);

  let status: "approved" | "rejected" | "pending" | null = null;
  if (isBusiness && user?.id) {
    try {
      const account = await readTradeAccount(user.id);
      // 行が無い（この機能より前に登録した）法人は審査待ちとして扱う。
      status = account?.status ?? "pending";
    } catch {
      status = "pending";
    }
  }

  if (isBusiness && status !== "approved") {
    return <UnderReviewPanel rejected={status === "rejected"} />;
  }

  if (!isBusiness) {
    return (
      <Gate
        heading={
          <L
            en="Wholesale pricing is shown to signed-in trade accounts."
            ja="卸価格は、ログインした取扱店にのみ表示しています。"
          />
        }
        body={
          <L
            en="Sign in to see per-bottle and per-case pricing. Opening a new account takes a couple of minutes."
            ja="ログインすると、1本・1ケースあたりの卸価格をご覧いただけます。新規登録は数分で完了します。"
          />
        }
        actions={
          <>
            <Link
              href="/login/business?redirect=/shop/business"
              className="ed-btn"
            >
              <L en="Trade sign in" ja="取扱店ログイン" />
            </Link>
            <Link href="/register/business" className="ed-link text-[13px]">
              <L en="Open an account" ja="新規登録" />
            </Link>
          </>
        }
      />
    );
  }

  // 実勢の卸価格。**公開の /api/catalog には載せない**ので、承認済みの
  // 取扱店に見せるこの経路だけがサーバー側で D1 から読む。
  // 読めなければカタログ価格で表示する（getLiveSkuMap が fail-open）。
  const live = await getLiveSkuMap();

  return (
    <div>
      {/* 数字の表。枠で囲わず、行の罫と右揃えの等幅数字だけで読ませる */}
      <div className="border-t border-[var(--ed-rule-strong)]">
        <div className="grid grid-cols-[1fr_auto_auto] items-end gap-x-6 py-3 sm:gap-x-12">
          <span className="ed-label">
            <L en="Product" ja="銘柄" />
          </span>
          <span className="ed-label text-right">
            <L en="Per bottle" ja="1本" />
          </span>
          <span className="ed-label text-right">
            <L en="Per case" ja="1ケース" />
          </span>
        </div>

        {fujisanProducts.map((p) => (
          <div key={p.slug} className="border-t border-[var(--ed-rule)]">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5 pb-1 pt-5">
              <h3 className="ed-h3">
                {p.name} / {p.variant.replace(/\n/g, " ")}
              </h3>
              <span className="ed-small font-jp">
                {p.variantJp}・{p.variantLineJp}
              </span>
            </div>

            {p.volumes.map((v) => {
              const sku = live.get(skuKey(p.slug, v.ml));
              const unit = sku?.wholesalePriceJpy ?? v.wholesalePriceJpy;
              const caseSize = sku?.caseSize ?? v.caseSize;
              return (
                <div
                  key={`${p.slug}-${v.ml}`}
                  className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-6 py-3 sm:gap-x-12"
                >
                  <span className="ed-small">{v.ml} ml</span>
                  <span className="text-right font-serif text-[15px] tabular-nums text-indigo">
                    {yen(unit)}
                  </span>
                  <span className="text-right font-serif text-[15px] tabular-nums text-indigo">
                    {yen(unit * caseSize)}
                    <span className="ml-2 align-baseline text-[11px] font-normal tabular-nums text-indigo/55">
                      ×{caseSize}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        ))}
        <div className="border-t border-[var(--ed-rule-strong)]" />
      </div>

      <p className="ed-small mt-7">
        <L
          en="Prices are per bottle (300 ml / 180 ml as listed), excluding tax, for reference (estimated CIF, Asia region). MOQ 3,000 bottles per shipment, mixed SKUs allowed — contact your trade desk for a formal quote."
          ja="価格は1本あたり（300ml／180ml）・税抜の参考価格です（アジア向け CIF 概算）。最小ロットは1出荷あたり3,000本（銘柄混載可）。正式なお見積りは担当窓口までご相談ください。"
        />
      </p>
    </div>
  );
}

/** 価格が出せないときの説明。中央寄せの囲みにせず、本文と同じ組みで置く */
function Gate({
  label,
  heading,
  body,
  actions,
}: {
  label?: React.ReactNode;
  heading: React.ReactNode;
  body: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className="border-t border-[var(--ed-rule-strong)] pt-9">
      {label ? <p className="ed-label">{label}</p> : null}
      <h3 className={`ed-h2 ${label ? "mt-3" : ""}`}>{heading}</h3>
      <p className="ed-p mt-5">{body}</p>
      <div className="mt-9 flex flex-wrap items-center gap-x-10 gap-y-4">
        {actions}
      </div>
    </div>
  );
}

/** 登録済みだが、まだ承認されていない（または見送られた）取扱店への表示。 */
function UnderReviewPanel({ rejected }: { rejected: boolean }) {
  return (
    <Gate
      label={
        rejected ? (
          <L en="About your account" ja="お取引について" />
        ) : (
          <L en="Under review" ja="審査中" />
        )
      }
      heading={
        rejected ? (
          <L
            en="This account is not currently open for trade pricing."
            ja="現在、このアカウントでは卸価格をご案内しておりません。"
          />
        ) : (
          <L
            en="Your trade account is under review."
            ja="取扱口座の審査を承っております。"
          />
        )
      }
      body={
        rejected ? (
          <L
            en="If your situation has changed, please get in touch — we are happy to look again."
            ja="ご状況が変わりましたら、いつでも改めてご相談ください。担当があらためて確認いたします。"
          />
        ) : (
          <L
            en="We verify each licence by hand and reply within two business days. Wholesale pricing appears here once your account has been approved."
            ja="免許の内容を一件ずつ確認のうえ、2営業日以内に結果をご連絡します。承認後、このページに卸価格が表示されます。"
          />
        )
      }
      actions={
        <>
          <Link href="/contact" className="ed-btn-ghost">
            <L en="Contact the trade desk" ja="取扱店窓口へ問い合わせる" />
          </Link>
          <a
            href={`mailto:${FUJISAN_LEGAL.email}`}
            className="ed-link text-[13px]"
          >
            {FUJISAN_LEGAL.email}
          </a>
        </>
      }
    />
  );
}
