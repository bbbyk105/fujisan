<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# FUJISAN — プロジェクト知識

## 概要

富士山麓の日本酒「武士道シリーズ」5銘柄を販売する EC サイト（Next.js 16 App Router）。
BtoC（個人）と BtoB（法人取扱店・卸価格表示）の二系統の購入動線を持ち、日英 i18n と酒類通販の法令対応を実装済み。決済は Stripe Checkout（ホスト型）。

## アーキテクチャ

- **デプロイ**: `@opennextjs/cloudflare` で Cloudflare Workers へ。`wrangler.jsonc` が正（worker 名 `fujisan`、D1 バインディング `DB` = `fujisan-db`）。Vercel ではない。
- **DB**: Cloudflare D1 (SQLite) + Drizzle ORM。スキーマは `src/db/`（auth / orders / invite に分割、`schema.ts` が re-export）。マイグレーション SQL は `drizzle/`（`wrangler d1 migrations apply fujisan-db [--local|--remote]` で適用）。D1 バインディングはリクエスト時にしか取れないため、必ず `getDb()`（`src/db/index.ts`）経由で毎回取得する。
- **認証**: Better Auth + Drizzle アダプタ。メール認証必須・Google ログインは env 設定時のみ有効。`user.role` は `personal | business`（法人は companyName 等の追加フィールドあり）。管理者は `owner | staff` の2階層（`src/lib/admin.ts`。`ADMIN_EMAILS` env が owner のブートストラップ、メール招待 `teamInvite` → 登録時に `databaseHooks.user.create.after` でロール付与）。
- **Server Actions 中心**: ミューテーションは `src/lib/actions/`（checkout / orders / account / admin-*）。API Route は Better Auth の `/api/auth/[...all]` と Stripe Webhook のみ。middleware は無く、ガードは各ページ/アクション内で `getSession()` / `getEffectiveAdminRole()`。
- **商品データはコード内カタログ**: `src/data/fujisan-products.ts`（小売価格・卸価格・容量 SKU）。DB に商品テーブルは無い。価格変更＝このファイルの編集。
- **command-center/** はダッシュボード用の別 Vite アプリ（jest 対象外）。本体とはビルドも独立。

## Stripe 決済フロー（b86fa89 で統合）

1. カート (`CartView`) → Server Action `startCheckoutAction`（`src/lib/actions/checkout.ts`）
   - 認証必須（ゲスト購入なし）。金額はクライアント申告を信用せず slug+ml からカタログ価格を引き直す。
   - 注文を `pending` で D1 に保存（**住所は空文字で開始**）→ Checkout Session 作成 → Stripe の URL を返す。
   - お届け先・電話は **Stripe 決済ページで収集**（`shipping_address_collection: JP のみ`）。自前住所フォームは廃止済み。
   - Session 作成失敗時は pending 注文を削除して掃除する。
2. Webhook `/api/stripe/webhook` が **確定の正**（success ページは表示のみ）。
   - `checkout.session.completed` と `async_payment_succeeded`（コンビニ等）を処理。
   - 冪等: `pending → confirmed` を WHERE status='pending' 付き UPDATE で原子的に行い、更新できた初回だけメール送信。
   - 住所・電話は `sessions.retrieve` で取り直して注文に書き戻す。
   - **メール失敗は 500 にしない**（ログのみ）。500 を返すのは DB 確定失敗時だけ（Stripe が再送）。
3. `/checkout/success` は `force-dynamic`。session_id で Stripe を参照し、`payment_status !== "paid"` なら「お支払い手続き中」を表示。マウント時にカートを空にする。

### Workers 上の Stripe（`src/lib/stripe.ts`）
- Node の `http` が無いため `Stripe.createFetchHttpClient()` を必ず使う。
- Webhook 署名検証は `constructEventAsync` + `createSubtleCryptoProvider()`（Web Crypto）。同期版 `constructEvent` は動かない。
- Webhook では **生ボディ（`request.text()`）のまま検証**。先に JSON パースすると署名不一致になる。
- JPY の `unit_amount` は円の整数をそのまま渡す（×100 しない）。

## 酒類販売の法令対応

- **年齢確認は二重**:
  1. `AgeGate.tsx`（layout.tsx で全ページに配置）— 20歳確認モーダル。localStorage `fujisan-age-confirmed`、「いいえ」で東京都の未成年飲酒防止ページへ強制遷移。SSR は「確認済み」を返してハイドレーション不整合を回避。
  2. 決済開始前のチェックボックス（`CartView` + `checkoutSchema.ageConfirmed`、Zod で true 必須）。
- **法令情報の唯一の出どころ**: `src/data/fujisan-legal.ts`。未成年飲酒防止表示（`UNDERAGE_NOTICE_JP/EN`、フッター・商品ページ・特商法ページで参照）、送料 `SHIPPING_FEE`（一律1,100円 / 15,000円以上無料 — カート計算・全ページ表記がこの定数を参照）、特商法・通販酒類小売業免許・酒類販売管理者標識。**`[要確認]` ラベルの免許番号が未確定**なので本番公開前に差し替えること。
- 発送は日本国内のみ（Stripe の `allowed_countries: ["JP"]` と checkout の郵便番号7桁バリデーションで担保）。

## i18n（ja/en）

- **ルート分割ではなく CSS 切替方式**。`<L ja={...} en={...} />`（`src/i18n/Localized.tsx`）が両言語を DOM に出力し、`<html data-locale>` を見るグローバル CSS（globals.css の `.i18n-fragment`）で片方を隠す。静的書き出しのまま Workers で配信でき、ハイドレーションのちらつきが無い。
- `data-locale` は `LocaleBoot`（head 内のインラインスクリプト）がハイドレーション前に localStorage `fujisan-locale` → `navigator.language` の順で確定。切替 UI は `LocaleSwitch`。
- **翻訳の追加手順**: 文言を `<L ja en>` / `LText` で包むだけ。翻訳ファイルは存在しない。placeholder 等の属性値だけは `useLocale()`（MutationObserver 購読、SSR は "ja"）で切り替える。
- Stripe 決済ページの言語もサイトの locale を渡して同期する（`startCheckoutAction` の `locale` 引数）。

## 重要な設計判断

- **画像は `unoptimized: true`**: opennext-cloudflare では `/_next/image` が最適化されず原寸を返すため、事前に WebP 化した画像を直接配信（next.config.ts のコメント参照）。新規画像も事前 WebP 化すること。
- **Better Auth は二重インスタンス**（`src/lib/auth.ts`）: 実行時は `getAuth()`（Cloudflare コンテキスト依存の動的 import、worker 生存中キャッシュ）。`export const auth` は CLI (`generate`) 専用の静的ダミーで logger 無効。**実行時に `auth` を使わない**。`nextCookies()` プラグインは必ず配列の最後。
- **env は `process.env` ではなく `getCloudflareContext({ async: true }).env`** から読む（Server Action / Route Handler 共通パターン）。
- 注文明細は `items_json` にスナップショット保存（後からカタログ価格が変わっても注文は不変）。金額は全て円・税込の整数。
- メール送信（`src/lib/email.ts`）は Resend。`RESEND_API_KEY` 未設定ならコンソール出力に落ちる（ローカルで認証リンクを踏める）。
- `/craft` は `/stories` に redirect 統合済み（詳細 `/craft/[slug]` は残存）。

## 落とし穴

- **dev は `next dev --webpack`**（Turbopack ではない）。`initOpenNextCloudflareForDev()` により dev でも D1/env バインディングが `.dev.vars` から供給される。
- **`.dev.vars` が真の env ファイル**（BETTER_AUTH_SECRET / BETTER_AUTH_URL / ADMIN_EMAILS / RESEND_API_KEY / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET）。本番は `wrangler secret put <NAME>`。`.env.example` は古いテンプレで一部実態と乖離あり。
- STRIPE_SECRET_KEY 未設定だと checkout は `config` エラーを返す。Webhook のローカル検証は Stripe CLI の forward が必要（`STRIPE_WEBHOOK_SECRET` を合わせる）。
- スキーマ変更後は drizzle-kit で SQL 生成 + `wrangler d1 migrations apply` を忘れない（`--local` と `--remote` は別 DB）。Better Auth のフィールド変更時は CLI `generate` が静的 `auth` インスタンスを読む。
- 成功リダイレクトに依存する処理を書かない（確定・メールは Webhook 側。ユーザーがタブを閉じても成立する設計）。
- `BETTER_AUTH_URL` が success_url / cancel_url の基底になる。環境ごとに正しく設定しないと Stripe から戻れない。

## コマンド

```bash
npm run dev        # localhost:3000（--webpack、.dev.vars 読込）
npm run lint       # eslint
npm run build      # next build（デプロイ前に必須）
npm test           # jest（cart-core / validation / i18n / auth コンポーネント）
npm run preview    # opennextjs-cloudflare build && preview（Workers 実環境相当）
npm run deploy     # opennextjs-cloudflare build && deploy（人間の承認後）
npm run cf-typegen # cloudflare-env.d.ts 再生成（バインディング変更時）
```

## スキル参照

UI 作業は `.claude/skills/design-system`・`flow-ui`（command-center）、Stripe 作業は `.claude/skills/stripe-*` を先に読むこと。
