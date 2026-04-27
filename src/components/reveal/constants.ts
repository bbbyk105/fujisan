/** スクロール演出用の遅延トークン（サーバー・クライアント共通で import 可） */
export const revealEase = [0.22, 1, 0.36, 1] as [
  number,
  number,
  number,
  number,
];

export const revealDelays = { d1: 0.12, d2: 0.26, d3: 0.42 } as const;
