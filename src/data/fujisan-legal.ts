/**
 * 酒類通信販売の法令対応情報。全ページ・特商法表示はここを唯一の出どころにする。
 *
 * 未確定の値はダミー文字列で埋めず、`null` として型で表すこと。
 * それらしい伏せ字（〇〇 など）を置くと、本物のように見えたまま公開されうる。
 * `npm run deploy` は predeploy で `scripts/check-legal-disclosure.mjs` を実行し、
 * `src/data/` に伏せ字が残っていればデプロイを止める（`null` は検査しない）。
 */

export const UNDERAGE_NOTICE_JP = [
  "20歳未満の者の飲酒は法律で禁止されています。",
  "20歳未満の者には酒類を販売いたしません。",
] as const;

/** 英語ロケール表示用の未成年飲酒防止表示（日本語表記は常に DOM 内に保持） */
export const UNDERAGE_NOTICE_EN = [
  "Drinking by anyone under the age of 20 is prohibited by law.",
  "We do not sell alcoholic beverages to anyone under the age of 20.",
] as const;

/**
 * お届け地域と、基本の送料に足す額（税込・円）。金額を変えるときはここだけを直す。
 *
 * Stripe のホスト型の決済ページは入力された住所で送料を変えられないので、カートで
 * お客様に地域を選んでもらう。離島は同じ都道府県の中にあって郵便番号の先頭では
 * 分からないため、自己申告になる。決済後に住所と合わなければ運用へ通知する。
 */
export const SHIPPING_REGIONS = {
  mainland: { ja: "本州・四国・九州", en: "Honshu, Shikoku and Kyushu", surchargeJpy: 0 },
  hokkaido: { ja: "北海道", en: "Hokkaido", surchargeJpy: 500 },
  remote: { ja: "沖縄・離島", en: "Okinawa and remote islands", surchargeJpy: 1700 },
} as const;

export type ShippingRegion = keyof typeof SHIPPING_REGIONS;

/**
 * 送料表記の唯一の出どころ。全ページ・特商法表示はこのトークンを参照し、
 * 「本州・四国・九州 1,100円（税込）」「15,000円以上で基本送料は無料」の表記を統一する。
 *
 * ※ ここに書いてよいのは **実際に決済で課金される料金だけ**。
 *    選択 UI が無い追加オプション（クール便の加算など）を書くと、
 *    表示と請求額が食い違い景表法上の問題になる。追加する場合は
 *    Stripe の shipping_options とカートの合計計算を先に実装すること。
 */
export const SHIPPING_FEE = {
  /** 基本送料（税込・円）。地域の追加分は SHIPPING_REGIONS。合計はこの 2 つから計算する。 */
  flatJpy: 1100,
  /** この税込小計（円）以上で送料無料。0 で無効化。 */
  freeThresholdJpy: 15000,
  flat: "本州・四国・九州 1,100円（税込）",
  remote: `北海道は${SHIPPING_REGIONS.hokkaido.surchargeJpy.toLocaleString("ja-JP")}円、沖縄・離島は${SHIPPING_REGIONS.remote.surchargeJpy.toLocaleString("ja-JP")}円（税込）を追加します。この追加分は送料無料の対象外です`,
  free: "15,000円（税込）以上のご購入で基本送料は無料",
  flatEn: "¥1,100 (tax incl.) to Honshu, Shikoku and Kyushu",
  remoteEn: `Add ¥${SHIPPING_REGIONS.hokkaido.surchargeJpy.toLocaleString("en-US")} for Hokkaido and ¥${SHIPPING_REGIONS.remote.surchargeJpy.toLocaleString("en-US")} for Okinawa and remote islands (tax incl.). These additions are not covered by free shipping`,
  freeEn: "Base shipping is free on orders of ¥15,000 (tax incl.) or more",
} as const;

/**
 * 適格請求書発行事業者の登録番号（インボイス制度。"T" + 13桁）。
 *
 * 領収書は Stripe が出すので、領収書に載る番号は Stripe のダッシュボードの設定で
 * 決まる（`SETUP.md` のタスク4-2）。ここは控えで、検査用数字のテストの対象にしている。
 */
export const INVOICE_REGISTRATION_NUMBER: string | null = "T4080103000596";

/**
 * 領収書の適用税率。Stripe の領収書には税額を出さず、品名のこの表記で税率を示す。
 * 酒類は軽減税率の対象外で、送料も 10%。
 */
export const CONSUMPTION_TAX_NOTE = {
  ja: "税込・税率10%",
  en: "incl. 10% consumption tax",
} as const;

export const FUJISAN_LEGAL = {
  // 特商法
  sellerName: "株式会社 近藤薬局",
  representative: "代表取締役 近藤 弘人",
  address: "〒417-0051 静岡県富士市吉原 2-8-21",
  addressEn: "2-8-21 Yoshiwara, Fuji-shi, Shizuoka 417-0051, Japan",
  phone: "070-9323-4144",
  phoneHours: "平日 9:00 – 17:00（土日祝・年末年始を除く）",
  phoneHoursEn: "Weekdays 9:00–17:00 JST, excl. weekends and holidays",
  email: "info@sakefujisan.com",
  ecManager: "通販責任者 近藤 弘人",
  // 製造者（醸造元）。武士道シリーズは牧野酒造合資会社による醸造（販売者は近藤薬局の OEM 商品）。
  brewer: "牧野酒造合資会社",
  brewerEn: "Makino Shuzo Goshi Kaisha (Makino Sake Brewery)",
  // 価格・支払・引渡
  priceNote:
    "各商品ページに表示している金額（消費税10%込）です。表示価格のほかに送料が必要となる場合があります。",
  shipping: SHIPPING_FEE,
  shippingFeeNote: `${SHIPPING_FEE.flat}です。${SHIPPING_FEE.remote}。${SHIPPING_FEE.free}です。`,
  // 英語ロケール表示用（特商法ページは日本語のまま。EC 説明部分のみ英語へ切替）
  shippingFeeNoteEn: `${SHIPPING_FEE.flatEn}. ${SHIPPING_FEE.remoteEn}. ${SHIPPING_FEE.freeEn}.`,
  // 個人（toC）のお支払いは Stripe Checkout で使える手段。銀行振込は法人（toB）専用。
  // Stripe のダッシュボードで決済手段を増減したら、ここも合わせる。
  paymentMethods:
    "クレジットカード（VISA / Mastercard / JCB / AMEX / Diners）、Apple Pay、Google Pay、Link",
  paymentMethodsEn:
    "Credit card (VISA / Mastercard / JCB / AMEX / Diners), Apple Pay, Google Pay, Link.",
  paymentTiming: "お支払いはご注文時に確定します。",
  paymentTimingEn: "Payment is charged at order.",
  deliveryTiming: "ご注文確認後、原則2営業日以内に発送いたします。",
  deliveryTimingEn:
    "Dispatched within two business days of order confirmation.",
  returnsPolicy:
    "酒類は性質上、開栓後・お客様都合での返品交換はお受けできません。配送中の破損・誤配送・不良品については商品到着後7日以内にメールにてご連絡ください。当社の負担で代替品の発送またはご返金の対応をいたします。",
  returnsPolicyEn:
    "Due to the nature of alcoholic beverages, we cannot accept returns or exchanges of opened bottles, or returns for change of mind. For breakage in transit, wrong delivery, or defects, please contact us by email within 7 days of arrival; we will arrange a replacement or refund at our cost.",
  // 商品代金以外にお客様へご負担いただくのは送料のみ（決済で実際に加算されるもの）。
  otherFees:
    "商品代金以外には送料のみを申し受けます。お届け地域はカートでお選びいただきます。",
  otherFeesEn:
    "Shipping is the only charge in addition to the product price. You choose your delivery area in the cart.",
  // 酒類販売管理者標識（5項目）— 受講証より転記
  liquorManager: {
    storeName: "株式会社 近藤薬局",
    storeAddress: "〒417-0051 静岡県富士市吉原 2-8-21",
    managerName: "近藤 弘人",
    trainingDate: "2024年5月23日",
    nextTrainingDeadline: "2027年5月22日",
    trainingProvider: "静岡県小売酒販組合連合会",
  },
} as const;
