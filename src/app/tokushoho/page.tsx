import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import { EditorialSection } from "@/components/fujisan/editorial/EditorialSection";
import { EdDataList, EdNote } from "@/components/fujisan/editorial/ui";
import {
  FUJISAN_LEGAL,
  UNDERAGE_NOTICE_JP,
  UNDERAGE_NOTICE_EN,
  liquorLicenceLine,
} from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "特定商取引法に基づく表示",
  description:
    "FUJISAN SAKE オンラインショップの特定商取引法に基づく表示、酒類販売管理者標識、通信販売酒類小売業免許の情報を掲載しています。",
  path: "/tokushoho",
});

const m = FUJISAN_LEGAL.liquorManager;

/**
 * 法定表示は「読み物」ではなく「表」。番号付きの節に分けて散文で書くと、
 * 監督官庁も購入者も、確かめたい一項目にたどり着けない。
 */
const rows = [
  {
    label: <L en="Seller" ja="販売業者" />,
    value: (
      <>
        <span className="block">{FUJISAN_LEGAL.sellerName}</span>
        <span className="ed-small mt-1 block">
          <L
            en={`Brewer (manufacturer): ${FUJISAN_LEGAL.brewerEn}`}
            ja={`醸造元（製造者）: ${FUJISAN_LEGAL.brewer}`}
          />
        </span>
      </>
    ),
  },
  {
    label: <L en="Representative" ja="運営統括責任者" />,
    value: (
      <>
        <span className="block">{FUJISAN_LEGAL.representative}</span>
        <span className="block">{FUJISAN_LEGAL.ecManager}</span>
      </>
    ),
  },
  {
    label: <L en="Address" ja="所在地" />,
    value: <L en={FUJISAN_LEGAL.addressEn} ja={FUJISAN_LEGAL.address} />,
  },
  {
    label: <L en="Contact" ja="お問い合わせ" />,
    value: (
      <>
        <span className="block">
          <L
            en={`Phone: ${FUJISAN_LEGAL.phone} (Weekdays 10:00–17:00 JST, excl. weekends & holidays)`}
            ja={`電話 ${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`}
          />
        </span>
        <a href={`mailto:${FUJISAN_LEGAL.email}`} className="ed-link">
          {FUJISAN_LEGAL.email}
        </a>
        <span className="ed-small mt-1 block">
          <L
            en="We reply to email enquiries within three business days as a rule."
            ja="メールでのお問い合わせは原則3営業日以内にご返信いたします。"
          />
        </span>
      </>
    ),
  },
  {
    label: <L en="Selling price" ja="販売価格" />,
    value: (
      <L
        en="The amount shown on each product page (10% consumption tax included). Fees such as shipping may apply in addition to the listed price."
        ja={FUJISAN_LEGAL.priceNote}
      />
    ),
  },
  {
    label: <L en="Other charges" ja="商品代金以外の必要料金" />,
    value: (
      <>
        <span className="block">
          <L en={FUJISAN_LEGAL.otherFeesEn} ja={FUJISAN_LEGAL.otherFees} />
        </span>
        <span className="ed-small mt-1 block">
          <L
            en={`Shipping: ${FUJISAN_LEGAL.shippingFeeNoteEn}`}
            ja={`送料: ${FUJISAN_LEGAL.shippingFeeNote}`}
          />
        </span>
      </>
    ),
  },
  {
    label: <L en="Payment methods" ja="お支払方法" />,
    value: (
      <L
        en={FUJISAN_LEGAL.paymentMethodsEn}
        ja={FUJISAN_LEGAL.paymentMethods}
      />
    ),
  },
  {
    label: <L en="Payment timing" ja="お支払時期" />,
    value: (
      <L en={FUJISAN_LEGAL.paymentTimingEn} ja={FUJISAN_LEGAL.paymentTiming} />
    ),
  },
  {
    label: <L en="Delivery" ja="商品引渡時期" />,
    value: (
      <L
        en={FUJISAN_LEGAL.deliveryTimingEn}
        ja={FUJISAN_LEGAL.deliveryTiming}
      />
    ),
  },
  {
    label: <L en="Returns & exchanges" ja="返品・交換条件" />,
    value: (
      <L
        en="Due to the nature of alcoholic beverages, we cannot accept returns or exchanges of opened bottles, or returns for change of mind. For breakage in transit, wrong delivery, or defects, please contact us by email within 7 days of arrival; we will arrange a replacement or refund at our cost."
        ja={FUJISAN_LEGAL.returnsPolicy}
      />
    ),
  },
  {
    label: <L en="Liquor sales licence" ja="通信販売酒類小売業免許" />,
    value: <L en={liquorLicenceLine("en")} ja={liquorLicenceLine("ja")} />,
  },
];

/** 酒税法第86条の9 の標識。特商法の表とは根拠法が違うので別の表にする */
const managerRows = [
  {
    label: <L en="Premises name" ja="販売場の名称" />,
    value: m.storeName,
  },
  {
    label: <L en="Premises address" ja="販売場の所在地" />,
    value: m.storeAddress,
  },
  {
    label: <L en="Sales manager" ja="酒類販売管理者の氏名" />,
    value: m.managerName,
  },
  {
    label: <L en="Training completed" ja="酒類販売管理研修受講年月日" />,
    value: m.trainingDate,
  },
  {
    label: <L en="Next training due" ja="次回研修受講期限" />,
    value: m.nextTrainingDeadline,
  },
  {
    label: <L en="Training provider" ja="研修実施団体名" />,
    value: m.trainingProvider,
  },
];

export default function TokushohoPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        kicker={<L en="Legal" ja="法定表示" />}
        title={
          <L
            en="Legal notice"
            ja={
              <>
                特定商取引法に
                <wbr />
                基づく表示
              </>
            }
          />
        }
        lead={
          <L
            en="In accordance with Article 11 of the Act on Specified Commercial Transactions, the sale conditions, business information, and liquor licence details for this shop are disclosed below."
            ja="特定商取引に関する法律第11条（通信販売についての広告）に基づき、当オンラインショップにおける販売条件・事業者情報・酒類販売関連免許情報を開示いたします。"
          />
        }
        meta={<L en="Last updated 2026.09" ja="最終更新 2026.09" />}
      />

      {/* 未成年飲酒防止表示。法定表示の表より前に、独立して置く */}
      <EditorialSection ruled={false} className="py-12 md:py-16">
        <EdNote
          role="note"
          aria-label="未成年飲酒防止のお知らせ"
          label={<L en="Age 20+" ja="未成年者の飲酒防止" />}
        >
          <L
            ja={
              <>
                {UNDERAGE_NOTICE_JP.map((line) => (
                  <p key={line} className="ed-p">
                    {line}
                  </p>
                ))}
              </>
            }
            en={
              <>
                {UNDERAGE_NOTICE_EN.map((line) => (
                  <p key={line} className="ed-p">
                    {line}
                  </p>
                ))}
              </>
            }
          />
        </EdNote>
      </EditorialSection>

      <EditorialSection>
        <EdDataList rows={rows} />
      </EditorialSection>

      <EditorialSection>
        <h2 className="ed-h2">
          <L
            en="Liquor sales manager notice"
            ja="酒類販売管理者標識"
          />
        </h2>
        <p className="ed-p mt-5">
          <L
            en="Pursuant to Article 86-9 of the Liquor Tax Act, the sales manager notice is posted as follows."
            ja="酒税法第86条の9に基づき、以下のとおり標識を掲示いたします。"
          />
        </p>
        <EdDataList rows={managerRows} className="mt-10" />
      </EditorialSection>
    </EditorialPage>
  );
}
