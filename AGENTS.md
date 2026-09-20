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
- **DB**: Cloudflare D1 (SQLite) + Drizzle ORM。スキーマは `src/db/`（auth / orders / invite / contact / inventory に分割、`schema.ts` が re-export）。マイグレーション SQL は `drizzle/`（`wrangler d1 migrations apply fujisan-db [--local|--remote]` で適用）。D1 バインディングはリクエスト時にしか取れないため、必ず `getDb()`（`src/db/index.ts`）経由で毎回取得する。
- **認証**: Better Auth + Drizzle アダプタ。メール認証必須・Google ログインは env 設定時のみ有効。`user.role` は `personal | business`（法人は companyName 等の追加フィールドあり）。管理者は `owner | staff` の2階層（`src/lib/admin.ts`。**`ADMIN_EMAILS` env は必須**（未設定だと env owner は 0 人。ソースにフォールバックのアドレスは置かない）、メール招待 `teamInvite` → 登録時に `databaseHooks.user.create.after` でロール付与）。
- **Server Actions 中心**: ミューテーションは `src/lib/actions/`（checkout / orders / account / contact / admin-*）。API Route は Better Auth の `/api/auth/[...all]` と Stripe Webhook のみ。middleware は無く、ガードは各ページ/アクション内で `getSession()` / `getEffectiveAdminRole()`。
- **商品データはコード内カタログ**: `src/data/fujisan-products.ts`（小売価格・卸価格・容量 SKU）。DB に商品テーブルは無い。価格変更＝このファイルの編集。**在庫数だけは D1**（`inventory` 表、下記）。
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

### 購読すべき Webhook イベント

Stripe ダッシュボードで以下を有効にする。どれか欠けると状態が揃わない。

| イベント | 役割 |
| --- | --- |
| `checkout.session.completed` | カード決済の確定（注文確定・メール送信） |
| `checkout.session.async_payment_succeeded` | コンビニ等の後追い入金の確定 |
| `checkout.session.expired` | 未払いのまま期限切れ → pending 注文を掃除 |
| `checkout.session.async_payment_failed` | 後払い失敗 → pending 注文を掃除 |
| `charge.refunded` | **ダッシュボードから返金したとき** DB へ同期（全額のみ。部分返金は ops 通知） |
| `charge.dispute.created` | チャージバックを ops 通知（自動対応は不可、人が期限内に対応する） |

500 を返して Stripe に再送させるのは「注文確定の DB 失敗」と「返金同期の DB 失敗」だけ。
pending の掃除失敗はログのみ（入金に影響しないため）。

### Workers 上の Stripe（`src/lib/stripe.ts`）
- Node の `http` が無いため `Stripe.createFetchHttpClient()` を必ず使う。
- Webhook 署名検証は `constructEventAsync` + `createSubtleCryptoProvider()`（Web Crypto）。同期版 `constructEvent` は動かない。
- Webhook では **生ボディ（`request.text()`）のまま検証**。先に JSON パースすると署名不一致になる。
- JPY の `unit_amount` は円の整数をそのまま渡す（×100 しない）。

## 在庫

- SKU（銘柄 × 容量）ごとに D1 の `inventory` 表で持つ。ロジックは `src/lib/inventory.ts`。
- **オプトイン方式**: 行がある SKU だけが管理対象。行が無い SKU は数量無制限で売れる。全 SKU に 0 を入れるとデプロイした瞬間に販売が止まるため、初期データは入れない。蔵で数え終わった SKU から `/admin/inventory` で管理を開始する。
- カタログの `soldOut` フラグは在庫数とは独立した「販売停止」スイッチとして残る。
- **引き当ての流れ**: 決済開始で `reserved += qty` → 入金確定で `onHand -= qty; reserved -= qty` → 期限切れ・決済失敗・Session 生成失敗で `reserved -= qty`。決済ページに滞在している数分を押さえないと、同じ最後の 1 本を複数人が買えてしまう（「確定時に減らす」だけでは足りない）。
- 売り越さないことを担保しているのは `UPDATE … WHERE on_hand - reserved >= qty` という **1 文の原子性**。D1 に対話的トランザクションは無いので、複数明細で途中が足りなければ、それまでに積んだ分を戻す（補償）。
- `commitStock` は**冪等ではない**。Webhook からは「pending → confirmed に実際に更新できた初回だけ」呼ぶこと。
- 未発送のまま返金すると `onHand` に自動で戻る（`hasLeftTheKura` で判定）。発送後は戻さない — 品物が手元に無いため、返品を受け取ってから管理画面で足す。
- 在庫のテストは **node:sqlite のインメモリ DB に drizzle の実 SQL を流す**（`src/lib/__tests__/inventory.test.ts`）。スタブで戻り値を作ると、肝心の WHERE 句を検証したことにならない。`node:sqlite` の型は `@types/node@20` に無いので `src/types/node-sqlite.d.ts` で補っている。

## 注文の顧客向け機能

- `/account/orders/[orderRef]` が注文詳細、`/account/orders/[orderRef]/receipt` が領収書。
- **注文の取得は必ず userId でも絞る**（`getMyOrderByRefAction`）。orderRef は推測しにくいだけで秘密ではないので、番号だけで引くと他人の注文が見える。
- 領収書は PDF を生成せず、印刷（ブラウザの「PDF として保存」）に最適化したページとして出す。電子発行のため収入印紙は不要。適格請求書の登録番号は `INVOICE_REGISTRATION_NUMBER` が null のあいだ行ごと出さない。
- **キャンセルは「依頼」であって実行ではない**。`requestOrderCancellationAction` は発送前（confirmed / preparing）に `cancel_requested_at` を刻んで ops へ通知するだけ。返金の実行は従来どおり owner だけが `adminRefundOrderAction` から行う（お客様の操作でお金が動く経路は作らない）。
- 注文ステータスの表示は `OrderStatusPill`（`Record<OrderStatus, …>` なので新ステータス追加時に型で漏れが出る）と `OrderTimeline`（cancelled / refunded は進行段階ではないので専用表示）。

## お問い合わせ

- フォーム（`FujisanContactForm`）→ Server Action `submitContactAction`（`src/lib/actions/contact.ts`）。
- **受領の正は D1 の `contact_message` 表**。まず保存してからメールを送るので、Resend が落ちても問い合わせは失われず `/admin/contacts` から拾える。DB 保存に失敗したときだけお客様にエラーを返す。
- スパム対策は 2 段: ハニーポット（`website` の隠し入力。値が入っていたら成功を装って静かに捨てる）＋ 同一 IP の連投制限（10 分に 5 件）。**生 IP は保存せず SHA-256 の先頭16文字だけ**を持つ。
- 用件・対応状況のコードは `src/data/fujisan-contact.ts` が唯一の出どころ。サーバー依存を持たないのでクライアントからも読める（`src/lib/emails/contact-emails.ts` は `server-only` に依存するため、ラベルをそこに置かないこと）。

## SEO

- ページの Metadata は必ず `buildMetadata()`（`src/lib/seo.ts`）を通す。Next.js は `openGraph` のような入れ子フィールドを「最後に定義したセグメントが丸ごと上書き」するため、layout に置いても各ページの og:title には効かない。
- 正規 URL はビルド時に確定する必要がある（ほぼ静的書き出しのため）。Cloudflare env ではなく build-time の `NEXT_PUBLIC_SITE_URL`（未設定なら本番ドメイン）を使う。
- `sitemap.ts` / `robots.ts` / `manifest.ts` / `icon.svg` / `apple-icon.png` は `src/app/` 直下の file convention。OG 画像は `public/images/og/fujisan-og.jpg`（1200×630、`.webp` は OG に使えない）。
- 構造化データは `jsonLdScript()` 経由で出す（`<` をエスケープして `</script>` 脱出を防ぐ）。

## 酒類販売の法令対応

- **年齢確認は二重**:
  1. `AgeGate.tsx`（layout.tsx で全ページに配置）— 20歳確認モーダル。localStorage `fujisan-age-confirmed`、「いいえ」で東京都の未成年飲酒防止ページへ強制遷移。SSR は「確認済み」を返してハイドレーション不整合を回避。
  2. 決済開始前のチェックボックス（`CartView` + `checkoutSchema.ageConfirmed`、Zod で true 必須）。
- **法令情報の唯一の出どころ**: `src/data/fujisan-legal.ts`。未成年飲酒防止表示（`UNDERAGE_NOTICE_JP/EN`、フッター・商品ページ・特商法ページで参照）、送料 `SHIPPING_FEE`（一律1,100円 / 15,000円以上無料 — カート計算・全ページ表記がこの定数を参照）、特商法・通販酒類小売業免許・酒類販売管理者標識。**未確定の値はダミー文字列で埋めず `null` にする**（`LIQUOR_LICENCE` / `INVOICE_REGISTRATION_NUMBER`）。それらしい伏せ字は本物に見えたまま公開されうる。`npm run deploy` は predeploy で `scripts/check-legal-disclosure.mjs` を実行し、未確定が残っていればデプロイを止める（dev / build / CI は止めない）。
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

- **`drizzle/` の journal はずれている**: `0006_user_postal_code.sql` は手書きで追加されており `drizzle/meta/_journal.json` に載っていない。`drizzle-kit generate` を実行すると 0005 のスナップショットから差分を出すため、既に適用済みの列を二重に出力する。当面はマイグレーション SQL を手書きで足す（`wrangler d1 migrations apply` は journal ではなくファイル名順で適用するので動作には影響しない）。
- **日付は必ず `src/lib/format-date.ts` のヘルパーで出す**。Workers は UTC で動くため `Intl.DateTimeFormat` に `timeZone: "Asia/Tokyo"` を指定しないと、JST 00:00〜09:00 の出来事が前日の日付になる（領収書の発行日がずれる）。ローカルの OS が JST だと気づけない。
- **Next.js 16 の `error.js` は `reset` ではなく `unstable_retry`**。旧 API 名のままだと再試行ボタンが動かない。`global-error.js` も同じ。
- **`cloudflare-env.d.ts` は生成物で `.gitignore` 済み**。`prebuild` が `cf-typegen` を走らせるので `npm run build` は clone 直後でも通るが、エディタの型エラーを消すには一度 `npm run cf-typegen` が要る。
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
npm run typecheck  # cf-typegen + tsc --noEmit
npm run build      # next build（prebuild で cloudflare-env.d.ts を自動生成）
npm test           # jest
npm run check:legal # 法令表示の埋め忘れ検査（predeploy で自動実行）
npm run preview    # opennextjs-cloudflare build && preview（Workers 実環境相当）
npm run deploy     # opennextjs-cloudflare build && deploy（人間の承認後）
npm run cf-typegen # cloudflare-env.d.ts 再生成（バインディング変更時）
```

## 未対応事項

公開前に必要な作業（免許番号・Stripe の Webhook 設定・本番マイグレーション）と
フェーズ3 の積み残しは [`docs/TODO.md`](./docs/TODO.md) にまとめてある。

## スキル参照

UI 作業は `.claude/skills/design-system`・`flow-ui`（command-center）、Stripe 作業は `.claude/skills/stripe-*` を先に読むこと。
