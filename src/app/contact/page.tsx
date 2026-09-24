import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import { EditorialSection } from "@/components/fujisan/editorial/EditorialSection";
import { EdDataList } from "@/components/fujisan/editorial/ui";
import { FujisanContactForm } from "@/components/fujisan/FujisanContactForm";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contact FUJISAN SAKE about our sake, your order, trade and wholesale, or brewery visits.",
  path: "/contact",
});

/**
 * 連絡先は装飾を足さない。ラベルと値だけの素の組みにする。
 * バッジやピルで「2営業日以内」と書き、本文でも同じことを言う――という
 * 二重表示をしない。
 */
const desk = [
  {
    label: <L en="Email" ja="メール" />,
    value: (
      <a href={`mailto:${FUJISAN_LEGAL.email}`} className="ed-link">
        {FUJISAN_LEGAL.email}
      </a>
    ),
  },
  {
    label: <L en="Reply" ja="ご返信" />,
    value: (
      <L
        en="Within two business days, in Japanese or English."
        ja="通常2営業日以内に、日本語または英語でご返信します。"
      />
    ),
  },
  {
    label: <L en="Address" ja="所在地" />,
    value: (
      <>
        <span className="block">〒417-0051</span>
        <span className="block">静岡県富士市吉原 2-8-21</span>
        <span className="ed-small mt-1 block">
          2-8-21 Yoshiwara, Fuji, Shizuoka 417-0051, Japan
        </span>
      </>
    ),
  },
];

const hours = [
  {
    label: <L en="Mon – Fri" ja="月〜金" />,
    value: "09:00 – 17:00 JST",
  },
  {
    label: <L en="Saturday" ja="土曜" />,
    value: "10:00 – 15:00 JST",
  },
  {
    label: <L en="Sunday & holidays" ja="日曜・祝日" />,
    value: <L en="Closed" ja="休業" />,
  },
];

export default function ContactPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        width="wide"
        title={<L en="Contact" ja="お問い合わせ" />}
        lead={
          <L
            en="Questions about our sake or your order, trade listings, and brewery visits."
            ja="商品やご注文について、お店でのお取り扱い、蔵見学のご相談を承ります。"
          />
        }
      />

      <EditorialSection width="wide" ruled={false}>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.1fr_minmax(0,380px)] lg:gap-24">
          {/* フォーム */}
          <div>
            <h2 className="ed-label">
              <L en="Send a message" ja="メッセージを送る" />
            </h2>
            <Reveal className="mt-8" delay={revealDelays.d1}>
              <FujisanContactForm />
            </Reveal>
          </div>

          {/* 直接の連絡先 */}
          <aside className="lg:border-l lg:border-[var(--ed-rule)] lg:pl-14">
            <h2 className="ed-label">
              <L en="Or reach us directly" ja="直接のご連絡" />
            </h2>

            <EdDataList className="mt-6" rows={desk} />

            <h2 className="ed-label mt-14">
              <L en="Opening hours" ja="営業時間" />
            </h2>
            <EdDataList className="mt-6" rows={hours} />

            <p className="ed-small mt-10">
              <L
                en={
                  <>
                    Many questions are already answered on the{" "}
                    <a href="/faq" className="ed-link">
                      FAQ page
                    </a>
                    .
                  </>
                }
                ja={
                  <>
                    よくいただくご質問は
                    <a href="/faq" className="ed-link">
                      FAQ
                    </a>
                    にまとめています。
                  </>
                }
              />
            </p>
          </aside>
        </div>
      </EditorialSection>
    </EditorialPage>
  );
}
