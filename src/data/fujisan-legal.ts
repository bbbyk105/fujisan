/**
 * 酒類通信販売の法令対応情報。全ページ・特商法表示はここを唯一の出どころにする。
 *
 * 未確定の値はダミー文字列で埋めず、`null` として型で表すこと。
 * それらしい伏せ字（〇〇 など）を置くと、本物のように見えたまま公開されうる。
 * `npm run deploy` は predeploy で `scripts/check-legal-disclosure.mjs` を実行し、
 * 未確定の項目が残っていればデプロイを止める。
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
 * 送料表記の唯一の出どころ。全ページ・特商法表示はこのトークンを参照し、
 * 「全国一律 1,100円（税込）」「15,000円以上で送料無料」の表記を統一する。
 *
 * ※ ここに書いてよいのは **実際に決済で課金される料金だけ**。
 *    選択 UI が無い追加オプション（クール便の加算など）を書くと、
 *    表示と請求額が食い違い景表法上の問題になる。追加する場合は
 *    Stripe の shipping_options とカートの合計計算を先に実装すること。
 */
export const SHIPPING_FEE = {
  /** 全国一律送料（税込・円）。カート/チェックアウトの合計計算はこの数値を唯一の出どころとする。 */
  flatJpy: 1100,
  /** この税込小計（円）以上で送料無料。0 で無効化。 */
  freeThresholdJpy: 15000,
  flat: "全国一律 1,100円（税込）",
  remote: "北海道・沖縄・離島は別途追加料金がかかる場合があります",
  free: "15,000円（税込）以上のご購入で送料無料",
  flatEn: "Flat ¥1,100 nationwide (tax incl.)",
  remoteEn:
    "Surcharges may apply for Hokkaido, Okinawa, and remote islands",
  freeEn: "Free shipping on orders of ¥15,000 (tax incl.) or more",
} as const;

/**
 * 通信販売酒類小売業免許。
 *
 * **番号が未着のため未確定**。ダミーの番号を置くと本物に見えてしまうため、
 * 「未確定」を `null` として型で表す。判明したら両方を埋めること
 * （例: taxOffice に所轄税務署名、number に酒類指令の番号）。
 *
 * 埋まるまで `npm run deploy` は predeploy の検査
 * （`scripts/check-legal-disclosure.mjs`）で止まる。酒類の通信販売は
 * 免許番号の表示が必須なので、この状態で本番公開してはならない。
 */
export const LIQUOR_LICENCE: {
  /** 免許を付与した税務署名。未確定なら null。 */
  taxOffice: string | null;
  /** 酒類指令番号。未確定なら null。 */
  number: string | null;
} = {
  taxOffice: null,
  number: null,
};

/** 免許番号を掲示できる状態か（税務署名と番号が両方そろっているか）。 */
export function isLiquorLicenceDisclosed(): boolean {
  return Boolean(LIQUOR_LICENCE.taxOffice?.trim() && LIQUOR_LICENCE.number?.trim());
}

/**
 * 特商法ページに出す免許の表記。
 * 未確定のあいだは、番号をでっち上げずに「確認中」であることをそのまま書く。
 */
export function liquorLicenceLine(locale: "ja" | "en"): string {
  if (!isLiquorLicenceDisclosed()) {
    return locale === "ja"
      ? "通信販売酒類小売業免許（免許番号は確認中です。確認でき次第、本ページに掲示いたします）"
      : "Mail-order liquor retail licence (licence number is being confirmed and will be published on this page once available)";
  }
  return locale === "ja"
    ? `通信販売酒類小売業免許（${LIQUOR_LICENCE.taxOffice} ${LIQUOR_LICENCE.number}）`
    : `Mail-order liquor retail licence (issued by the ${LIQUOR_LICENCE.taxOffice}, ${LIQUOR_LICENCE.number})`;
}

export const FUJISAN_LEGAL = {
  // 特商法
  sellerName: "株式会社 近藤薬局",
  representative: "代表取締役 近藤 弘人",
  address: "〒417-0051 静岡県富士市吉原 2-8-21",
  addressEn: "2-8-21 Yoshiwara, Fuji-shi, Shizuoka 417-0051, Japan",
  phone: "070-9323-4144",
  phoneHours: "平日 10:00 – 17:00（土日祝・年末年始を除く）",
  email: "mtfujipharmacy@gmail.com",
  ecManager: "通販責任者 近藤 弘人",
  // 製造者（醸造元）。武士道シリーズは牧野酒造合資会社による醸造（販売者は近藤薬局の OEM 商品）。
  brewer: "牧野酒造合資会社",
  brewerEn: "Makino Shuzo Goshi Kaisha (Makino Sake Brewery)",
  // 価格・支払・引渡
  priceNote:
    "各商品ページに表示の金額（消費税10%込）。表示価格以外に送料等が必要となる場合があります。",
  shipping: SHIPPING_FEE,
  shippingFeeNote: `${SHIPPING_FEE.flat}。${SHIPPING_FEE.free}。${SHIPPING_FEE.remote}。`,
  // 英語ロケール表示用（特商法ページは日本語のまま。EC 説明部分のみ英語へ切替）
  shippingFeeNoteEn: `${SHIPPING_FEE.flatEn}. ${SHIPPING_FEE.freeEn}. ${SHIPPING_FEE.remoteEn}.`,
  // 個人（toC）のお支払いはクレジットカードのみ（Stripe Checkout）。銀行振込は法人（toB）専用。
  paymentMethods:
    "クレジットカード（VISA / Mastercard / JCB / AMEX / Diners）",
  paymentMethodsEn:
    "Credit card (VISA / Mastercard / JCB / AMEX / Diners).",
  paymentTiming: "クレジットカード: ご注文時に確定。",
  paymentTimingEn: "Credit card: charged at order.",
  deliveryTiming: "ご注文確認後、原則2営業日以内に発送いたします。",
  deliveryTimingEn:
    "Dispatched within two business days of order confirmation.",
  returnsPolicy:
    "酒類は性質上、開栓後・お客様都合での返品交換はお受けできません。配送中の破損・誤配送・不良品については商品到着後7日以内にメールにてご連絡ください。",
  // 商品代金以外にお客様へご負担いただくのは送料のみ（決済で実際に加算されるもの）。
  otherFees:
    "商品代金以外には送料のみを申し受けます。北海道・沖縄・離島は別途追加料金がかかる場合があり、その場合は発送前にご連絡いたします。",
  // 酒類関連免許・標識
  liquorLicense: LIQUOR_LICENCE,
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
