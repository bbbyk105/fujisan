/**
 * お問い合わせの用件・対応状況の定義。
 *
 * フォーム（クライアント）・Server Action・D1 スキーマ・通知メール・管理画面の
 * すべてがここを唯一の出どころにする。サーバー専用の import を持たないので
 * クライアントコンポーネントからも安全に読める。
 */

/** フォームの select と 1:1 で対応する用件コード。 */
export const CONTACT_SUBJECTS = ["general", "trade", "visit", "press"] as const;
export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_SUBJECT_LABELS: Record<
  ContactSubject,
  { ja: string; en: string }
> = {
  general: { ja: "一般のお問い合わせ", en: "General enquiry" },
  trade: { ja: "卸・取扱店", en: "Trade & Wholesale" },
  visit: { ja: "蔵見学", en: "Brewery visit" },
  press: { ja: "取材", en: "Press & Media" },
};

/** 管理画面での対応状況。 */
export const CONTACT_STATUSES = ["new", "in_progress", "done"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "未対応",
  in_progress: "対応中",
  done: "対応済み",
};
