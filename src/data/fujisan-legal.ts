/**
 * 酒類通信販売の法令対応情報。
 * 値は実在の事業者情報に置き換えてから本番運用してください（[要確認] のラベル参照）。
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
 * 「全国一律 1,100円（税込）」「クール便指定時 +330円（税込）」の表記を統一する。
 */
export const SHIPPING_FEE = {
  /** 全国一律送料（税込・円）。カート/チェックアウトの合計計算はこの数値を唯一の出どころとする。 */
  flatJpy: 1100,
  flat: "全国一律 1,100円（税込）",
  cool: "クール便指定時 +330円（税込）",
  remote: "北海道・沖縄・離島は別途追加料金がかかる場合があります",
  flatEn: "Flat ¥1,100 nationwide (tax incl.)",
  coolEn: "Cool-chain delivery +¥330 (tax incl.)",
  remoteEn:
    "Surcharges may apply for Hokkaido, Okinawa, and remote islands",
} as const;

/** ご注意: [要確認] が残っている項目は本番公開前に必ず差し替えてください */
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
  // 価格・支払・引渡
  priceNote:
    "各商品ページに表示の金額（消費税10%込）。表示価格以外に送料・代引手数料等が必要となる場合があります。",
  shipping: SHIPPING_FEE,
  shippingFeeNote: `${SHIPPING_FEE.flat}。${SHIPPING_FEE.remote}。${SHIPPING_FEE.cool}。`,
  // 英語ロケール表示用（特商法ページは日本語のまま。EC 説明部分のみ英語へ切替）
  shippingFeeNoteEn: `${SHIPPING_FEE.flatEn}. ${SHIPPING_FEE.remoteEn}. ${SHIPPING_FEE.coolEn}.`,
  paymentMethods:
    "クレジットカード（VISA / Mastercard / JCB / AMEX / Diners）、銀行振込",
  paymentMethodsEn:
    "Credit card (VISA / Mastercard / JCB / AMEX / Diners) and bank transfer.",
  paymentTiming:
    "クレジットカード: ご注文時に確定。銀行振込: ご注文後7日以内にお振込をお願いいたします。",
  paymentTimingEn:
    "Credit card: charged at order. Bank transfer: please remit within 7 days of ordering.",
  deliveryTiming:
    "ご注文確認後（銀行振込の場合は入金確認後）、原則2営業日以内に発送いたします。",
  deliveryTimingEn:
    "Dispatched within two business days of order confirmation (payment confirmation for bank transfers).",
  returnsPolicy:
    "酒類は性質上、開栓後・お客様都合での返品交換はお受けできません。配送中の破損・誤配送・不良品については商品到着後7日以内にメールにてご連絡ください。",
  otherFees:
    "クール便指定時の追加料金、代引手数料、銀行振込手数料はお客様負担となります。",
  // 酒類関連免許・標識
  liquorLicense:
    "通信販売酒類小売業免許（〇〇税務署 酒類指令第〇〇号 [要確認]）",
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
