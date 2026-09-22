/**
 * 取扱店（法人）アカウントの業態・審査状態の定義。
 *
 * 登録フォーム・Server Action・D1 スキーマ・管理画面が共通で参照する。
 * サーバー専用の import を持たないのでクライアントからも読める。
 */

/** 業態。必要な免許が変わるので、登録時に必ず選んでもらう。 */
export const TRADE_BUSINESS_TYPES = [
  "restaurant",
  "retailer",
  "wholesaler",
  "hotel",
  "other",
] as const;
export type TradeBusinessType = (typeof TRADE_BUSINESS_TYPES)[number];

export const TRADE_BUSINESS_TYPE_LABELS: Record<
  TradeBusinessType,
  { ja: string; en: string; note: { ja: string; en: string } }
> = {
  restaurant: {
    ja: "飲食店（店内でのご提供）",
    en: "Restaurant / bar (on-premise)",
    note: {
      ja: "店内でお出しするだけなら酒類販売業免許は不要です",
      en: "No liquor retail licence needed for on-premise service",
    },
  },
  retailer: {
    ja: "小売店（お客様へ販売）",
    en: "Retailer (resale to consumers)",
    note: {
      ja: "一般酒類小売業免許が必要です",
      en: "Requires a general liquor retail licence",
    },
  },
  wholesaler: {
    ja: "卸売",
    en: "Wholesaler",
    note: {
      ja: "酒類卸売業免許が必要です",
      en: "Requires a liquor wholesale licence",
    },
  },
  hotel: {
    ja: "宿泊施設",
    en: "Hotel / ryokan",
    note: {
      ja: "客室や館内での提供のみなら免許は不要です",
      en: "No licence needed for in-house service only",
    },
  },
  other: {
    ja: "その他",
    en: "Other",
    note: {
      ja: "内容をお問い合わせ欄でお知らせください",
      en: "Tell us more in your enquiry",
    },
  },
};

/**
 * 酒類販売業免許の番号が必須な業態か。
 *
 * **転売する場合にだけ免許が要る。** 飲食店や宿泊施設が店内で提供するのは
 * 「販売」ではないので、一律に必須としないこと（実態に合わない項目を必須に
 * すると、正しい相手を弾いて嘘の入力を誘発する）。
 */
export function requiresLiquorLicence(type: TradeBusinessType): boolean {
  return type === "retailer" || type === "wholesaler";
}

/**
 * 見送りの理由の上限。理由はそのままお客様へのメールに載る。
 *
 * ここに置くのは、"use server" のファイルが **async 関数以外を export できない**
 * ため（定数を Server Action と同居させるとビルドが通らない）。
 */
export const TRADE_REVIEW_NOTE_MAX = 500;

/** 審査状態。 */
export const TRADE_STATUSES = ["pending", "approved", "rejected"] as const;
export type TradeStatus = (typeof TRADE_STATUSES)[number];

export const TRADE_STATUS_LABELS: Record<
  TradeStatus,
  { ja: string; en: string }
> = {
  pending: { ja: "審査中", en: "Under review" },
  approved: { ja: "承認済み", en: "Approved" },
  rejected: { ja: "見送り", en: "Not approved" },
};
