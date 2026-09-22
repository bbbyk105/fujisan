# FUJISAN

富士山麓の日本酒「武士道シリーズ」5銘柄を販売する EC サイト。

BtoC（個人）と BtoB（法人取扱店・卸価格表示）の二系統の購入動線、日英 i18n、酒類通販の法令対応を備えます。
決済は Stripe Checkout（ホスト型）、デプロイ先は **Cloudflare Workers**（Vercel ではありません）。

## 技術スタック

| 領域 | 採用 |
| --- | --- |
| フレームワーク | Next.js 16（App Router） |
| ホスティング | Cloudflare Workers（`@opennextjs/cloudflare`） |
| DB | Cloudflare D1（SQLite）+ Drizzle ORM |
| 認証 | Better Auth（メール認証必須 / Google は env 設定時のみ） |
| 決済 | Stripe Checkout + Webhook |
| メール | Resend |
| スタイル | Tailwind CSS v4 |
| テスト | Jest + Testing Library |

## セットアップ

```bash
npm ci
cp .env.example .dev.vars   # 実値を記入する（.dev.vars が真の env ファイル）
npx wrangler d1 migrations apply fujisan-db --local
npm run dev                 # http://localhost:3000
```

`.dev.vars` は `.gitignore` 済みです。`.env.local` ではなく **`.dev.vars`** に書いてください
（`initOpenNextCloudflareForDev()` が dev でもここから D1 バインディングと env を供給します）。

`RESEND_API_KEY` を空のままにすると、メール認証リンクや注文メールはコンソールに出力されます。
ローカルでは実際に送信せずリンクを踏めます。

## コマンド

```bash
npm run dev        # 開発サーバー（--webpack。Turbopack ではない）
npm run lint       # eslint
npm test           # jest
npm run typecheck  # cf-typegen + tsc --noEmit
npm run build      # next build（prebuild で cloudflare-env.d.ts を自動生成）
npm run preview    # Workers 実環境相当でローカル起動
npm run deploy     # 本番デプロイ（人間の承認後）
npm run cf-typegen # cloudflare-env.d.ts 再生成（バインディング変更時）
```

`cloudflare-env.d.ts` は生成物のため `.gitignore` 済みです。`prebuild` が自動生成するので
`npm run build` は clone 直後でも通りますが、エディタの型エラーを消すには一度
`npm run cf-typegen` を実行してください。

## データベース

スキーマは `src/db/`（auth / orders / invite / contact に分割、`schema.ts` が re-export）。

```bash
npx drizzle-kit generate                                  # スキーマ変更から SQL を生成
npx wrangler d1 migrations apply fujisan-db --local       # ローカル D1 へ適用
npx wrangler d1 migrations apply fujisan-db --remote      # 本番 D1 へ適用
```

`--local` と `--remote` は別の DB です。両方に適用を忘れないでください。

## Stripe

決済の確定は **Webhook が正**です（success ページは表示のみ）。ローカルで確定まで通すには
Stripe CLI の転送が必要です。

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
# 表示された whsec_... を .dev.vars の STRIPE_WEBHOOK_SECRET に設定する
```

## 本番環境変数

Cloudflare の secret として投入します。

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put STRIPE_SECRET_KEY
# ... .env.example の各項目について同様に
```

## ドキュメント

設計判断・落とし穴・スキル参照は [`AGENTS.md`](./AGENTS.md) にまとめてあります。
