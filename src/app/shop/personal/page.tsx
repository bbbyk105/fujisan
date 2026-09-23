import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import {
  EditorialSection,
  EditorialSectionHead,
} from "@/components/fujisan/editorial/EditorialSection";
import {
  EdActions,
  EdDataList,
  EdNote,
  EdSteps,
} from "@/components/fujisan/editorial/ui";
import { ShopCollectionGrid } from "@/components/fujisan/ShopCollectionGrid";
import { fujisanProducts } from "@/data/fujisan-products";
import {
  FUJISAN_LEGAL,
  UNDERAGE_NOTICE_JP,
  UNDERAGE_NOTICE_EN,
} from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "For your table",
  description:
    "Order a single bottle of Fujisan sake for your home. Five expressions, nationwide delivery, age verification at every step.",
  path: "/shop/personal",
});

const yen = new Intl.NumberFormat("ja-JP");

const steps = [
  {
    heading: <L en="Choose your bottle" ja="一本を選ぶ" />,
    body: (
      <L
        en="Five expressions of Fujisan. Each detail page carries its serving temperature and the brewer's notes."
        ja="五種の銘柄から、気になる一本を。各商品ページに、おすすめの温度と造り手の言葉を記しています。"
      />
    ),
  },
  {
    heading: <L en="Confirm age and quantity" ja="年齢を確かめ、本数を決める" />,
    body: (
      <L
        en="On the bottle page, confirm that you are 20 or older and choose how many bottles you would like."
        ja="商品ページで、20歳以上であることをご確認のうえ、ご希望の本数をお選びください。"
      />
    ),
  },
  {
    heading: <L en="Receive it at home" ja="ご自宅で受け取る" />,
    body: (
      <L
        en="Checked by hand, packed in a chilled outer box, and dispatched within two business days. The courier verifies age again at the door."
        ja="ひとつずつ検品し、保冷外箱に詰めて、原則2営業日以内に発送します。お受け取りの際にも年齢の確認をお願いします。"
      />
    ),
  },
];

const allPrices = fujisanProducts.flatMap((p) =>
  p.volumes.map((v) => v.priceJpy),
);
const priceMin = Math.min(...allPrices);
const priceMax = Math.max(...allPrices);

const practical = [
  {
    label: <L en="Shipping" ja="送料" />,
    value: (
      <>
        <span className="block">
          <L
            en={FUJISAN_LEGAL.shippingFeeNoteEn}
            ja={FUJISAN_LEGAL.shippingFeeNote}
          />
        </span>
        <span className="ed-small mt-1 block">
          <L
            en={FUJISAN_LEGAL.deliveryTimingEn}
            ja={FUJISAN_LEGAL.deliveryTiming}
          />
        </span>
      </>
    ),
  },
  {
    label: <L en="Payment" ja="お支払い" />,
    value: (
      <>
        <span className="block">
          <L
            en={FUJISAN_LEGAL.paymentMethodsEn}
            ja={FUJISAN_LEGAL.paymentMethods}
          />
        </span>
        <span className="ed-small mt-1 block">
          <L
            en={FUJISAN_LEGAL.paymentTimingEn}
            ja={FUJISAN_LEGAL.paymentTiming}
          />
        </span>
      </>
    ),
  },
  {
    label: <L en="Returns" ja="返品" />,
    value: (
      <>
        <span className="block">
          <L
            en="Alcohol cannot be returned for change of mind. For breakage, wrong items, or defects, write to us within seven days of arrival."
            ja={FUJISAN_LEGAL.returnsPolicy}
          />
        </span>
        <span className="ed-small mt-1 block">
          <L
            en="Full conditions are in the Tokutei Shōtorihiki notice."
            ja="詳しい条件は特定商取引法に基づく表示をご確認ください。"
          />
        </span>
      </>
    ),
  },
];

export default function ShopPersonalPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        width="wide"
        kicker={<L en="Purchase / Personal" ja="ご購入 ／ 個人のお客様" />}
        title={<L en="A bottle, by the bottle" ja="一本から、家へ" />}
        lead={
          <L
            en="Single bottles in 300 ml and 180 ml, gift-ready, shipped with care from Shizuoka. Every order is checked by hand, and age is verified both at order and at delivery."
            ja="300ml・180ml の単品を、贈り物にも。静岡から、ひとつずつ検品してお届けします。ご注文時とお届け時に、年齢を確認します。"
          />
        }
      />

      {/* ===== 選ぶ ===== */}
      <EditorialSection width="wide" ruled={false}>
        <EditorialSectionHead
          label={<L en="The collection" ja="銘柄" />}
          heading={<L en="Five expressions of Fujisan" ja="富士山、五つの表情" />}
          lead={
            <L
              en={`Available in 300 ml and 180 ml, from ¥${yen.format(
                priceMin,
              )} to ¥${yen.format(
                priceMax,
              )} including tax. Add a bottle to your cart, or open one to read the brewer's notes first.`}
              ja={`300ml・180ml をご用意しています。価格は ¥${yen.format(
                priceMin,
              )} 〜 ¥${yen.format(
                priceMax,
              )}（税込）。そのままカートへ、あるいは一本を開いて造り手の言葉から。`}
            />
          }
        />

        <ShopCollectionGrid products={fujisanProducts} />
      </EditorialSection>

      {/* ===== 流れ ===== */}
      <EditorialSection>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-16">
          <EditorialSectionHead
            label={<L en="How it works" ja="ご購入の流れ" />}
            heading={
              <L
                en="From Shizuoka to your door"
                ja="静岡から、玄関先まで"
              />
            }
            className="md:sticky md:top-[112px] md:self-start"
          />
          <EdSteps steps={steps} />
        </div>
      </EditorialSection>

      {/* ===== 実務 ===== */}
      <EditorialSection>
        <EditorialSectionHead
          label={<L en="Practical" ja="ご利用について" />}
          heading={
            <L
              en="Shipping, payment, and returns"
              ja="送料・お支払い・返品"
            />
          }
        />

        <EdDataList className="mt-10" rows={practical} />

        {/* 未成年飲酒防止表示は法令上の必須表示。装飾を足さず、位置で目立たせる */}
        <EdNote
          role="note"
          aria-label="未成年飲酒防止のお知らせ"
          className="mt-14"
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

        <EdActions
          className="mt-14"
          primary={{
            href: `/products/${fujisanProducts[0].slug}`,
            label: <L en="Start with our flagship" ja="代表銘柄から選ぶ" />,
          }}
          secondary={{
            href: "/contact",
            label: <L en="Questions? Write to us" ja="ご質問はこちら" />,
          }}
        />
      </EditorialSection>
    </EditorialPage>
  );
}
