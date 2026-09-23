import Link from "next/link";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Page not found — FUJISAN SAKE",
  robots: { index: false, follow: false },
};

/** 存在しない URL、および notFound() を呼んだセグメントの表示。 */
export default function NotFound() {
  return (
    <EditorialPage className="flex flex-col">
      <section className="ed-wrap ed-wrap-narrow flex flex-1 flex-col justify-center pb-24 pt-[150px] md:pt-[190px]">
        <p className="ed-label">404</p>

        <h1 className="ed-title mt-4">
          <L
            en="This page has gone quiet."
            ja="お探しのページは見つかりませんでした。"
          />
        </h1>

        <p className="ed-lead mt-7">
          <L
            en="The page you were looking for may have moved, or the link may be out of date. The collection is still here."
            ja="ページが移動したか、リンクが古くなっている可能性があります。コレクションは、こちらからご覧いただけます。"
          />
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-4">
          <Link href="/products" className="ed-btn">
            <L en="Browse the collection" ja="コレクションを見る" />
          </Link>
          <Link href="/" className="ed-link text-[13px]">
            <L en="Back to home" ja="トップへ戻る" />
          </Link>
        </div>

        <p className="ed-small mt-10">
          <L
            en={
              <>
                Still can&apos;t find it?{" "}
                <Link href="/contact" className="ed-link">
                  Contact us
                </Link>
                .
              </>
            }
            ja={
              <>
                お探しのものが見つからない場合は
                <Link href="/contact" className="ed-link">
                  お問い合わせ
                </Link>
                ください。
              </>
            }
          />
        </p>
      </section>
    </EditorialPage>
  );
}
