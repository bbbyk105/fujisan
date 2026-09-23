# FUJISAN 本番セットアップ TODO

本番公開までに残っている設定作業。上から順に進めれば詰まりません。

- 本番 URL: https://fujisan.bbbyk105.workers.dev
- 独自ドメイン（未接続）: `mtfuji-kikkou.com`
- Worker 名: `fujisan` / D1: `fujisan-db`

コマンドはすべて `~/Desktop/Projects/fujisan` で実行します。

> **コードの積み残し**は [`docs/TODO.md`](./docs/TODO.md) にあります。
> こちらは「環境を触らないと終わらない作業」だけを扱います。

---

## ⚠️ 先に読む — 本番と main のズレ

本番 Worker には **`feat/admin-products-inventory`（main へ未マージ）** が
デプロイされており、本番 D1 のマイグレーションは `0007_product_sku.sql` までです。
一方 main はその後、別系統で在庫・お問い合わせ・取扱店審査・レート制限を実装しました。

この二重化は `feat/integrate-admin-dashboard-catalog` で解消済みです（`0012` で
`product_sku` を `inventory` + `product_price` へ移行し、表そのものを落とす）。
**マージしてからデプロイしてください。** 先に main だけをデプロイすると、
本番の商品管理画面と在庫上限が消えます。

さらに **`ADMIN_EMAILS` が未設定だと、誰も `/admin` に入れません。**
以前ソースにあったフォールバックの owner アドレスは撤去済みです（下のタスク2）。

---

## 済んでいること

| | 内容 |
|---|---|
| ✅ | 商品・在庫管理（`/admin/products`）と売上ダッシュボード（`/admin`） |
| ✅ | 決済まわりのバグ修正（年齢確認のサーバー検証・ステータス遷移制約・招待の失効 ほか） |
| ✅ | 404 / error / global-error ページ |
| ✅ | 本番デプロイ（Version `ffbf40e4`。**内容は未マージブランチのもの**） |
| ✅ | Stripe 本番 Webhook 作成（`we_1UAthnHTT9ZXTgS1xYg2XRl4`・署名検証の動作確認済み） |
| ✅ | `.dev.vars` から本番キー（`sk_live`）を削除 |

### 本番 Worker の secret（`npx wrangler secret list` で確認済み）

```
OK  BETTER_AUTH_SECRET
OK  BETTER_AUTH_URL          ← ドメイン接続時に要更新（タスク7）
OK  STRIPE_SECRET_KEY
OK  STRIPE_WEBHOOK_SECRET
OK  RESEND_API_KEY           ← 入れ直し推奨（タスク4）
--  RESEND_FROM              ← タスク5
--  ADMIN_EMAILS             ← **必須**（タスク2）
--  GOOGLE_CLIENT_ID         （未設定 = 本番の Google ログインは無効）
--  GOOGLE_CLIENT_SECRET
```

---

## タスク1. 本番 D1 にマイグレーションを適用する【最優先】

未適用は 7 本（`0007`〜`0013`）。

```bash
npx wrangler d1 migrations apply fujisan-db --remote
```

| | 内容 |
|---|---|
| `0007_contact_message` | お問い合わせの受領 |
| `0008_order_cancel_request` | キャンセル依頼 |
| `0009_inventory` | 在庫（引き当て付き） |
| `0010_trade_account` | 取扱店の審査 |
| `0011_rate_limit` | Better Auth 用のレート制限 |
| `0012_product_price` | 価格の上書き表 ＋ **旧 `product_sku` からの移行** |
| `0013_order_partial_refund` | 部分返金の記録 |

`0012` は旧 `product_sku` の**在庫を `inventory` へ引き継いでから表を落とします**。
価格は「管理画面で実際に変更された行」だけ移します（初期投入値のまま移すと、
以後コードのカタログで価格を直しても D1 の同値に上書きされ続けるため）。

ローカルで同じ経路を検証済み（7 SKU が `on_hand=24` で移り、`product_sku` は消え、
`product_price` は空）。`--local` と `--remote` は別の DB です。

---

## タスク2. ADMIN_EMAILS を設定する【必須・これが無いと管理画面に入れない】

```bash
npx wrangler secret put ADMIN_EMAILS
# 値: カンマ区切り。例) byakkokondo@gmail.com
```

以前は `src/lib/admin.ts` に `FALLBACK_OWNER_EMAILS` があり、未設定でも
特定のアドレスが owner になっていました。**個人のアドレスがソースに
コミットされている状態だった**ため撤去済みです。いまは未設定＝env owner 0 人。

staff の追加は `/admin/team` からメール招待でできます（招待は **14 日で失効**）。

---

## タスク3. Stripe Webhook のイベントを追加する

現在 4 イベント。コードは 6 イベントに対応しているので、残り 2 つを追加します。

Stripe ダッシュボード（本番）→ 開発者 → Webhook → `we_1UAthnHTT9ZXTgS1xYg2XRl4`

| イベント | 現状 | 購読しないと起きること |
|---|---|---|
| `checkout.session.completed` | ✅ | 注文が確定しない |
| `checkout.session.async_payment_succeeded` | ✅ | コンビニ払いが確定しない |
| `checkout.session.async_payment_failed` | ✅ | 未払いの pending 注文が溜まる |
| `checkout.session.expired` | ✅ | 同上（在庫も押さえたまま） |
| `charge.refunded` | **要追加** | ダッシュボードから返金しても DB に残らない |
| `charge.dispute.created` | **要追加** | チャージバックに気づけない（放置すると売上が引かれる） |

---

## タスク4. 本番の RESEND_API_KEY を入れ直す

本番に入れた時点のキーと、その後作り直した有効なキーが別物の可能性があります。

```bash
npx wrangler secret put RESEND_API_KEY
```

`.dev.vars` にある有効なキーと同じ値を貼り付けます。

---

## タスク5. Resend のドメイン認証 ＋ RESEND_FROM

**やらないと**: お客様が誰も会員登録を完了できません。現在の送信元は Resend 共有の
`onboarding@resend.dev` で、**Resend アカウント所有者本人にしか配信されません**。

`mtfuji-kikkou.com` は Resend に登録済みですが status が `failed` です。
DNS（Cloudflare で管理しているならそこ）に以下 3 件を追加します。

### 5-1. DKIM

```
Type   TXT
Name   resend._domainkey
Value  p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCtgDLGW+JEMh1A/SznPEUdvEuaC0xgrLpsGPUcnxdgYC3it53wy5tAxbh90q02N+jNvVxknd+QL9X3zNIXMgf9N73B3c6WMaYZPnffwrbgkzNiCWHb/D7rgo+QszoOECLFBNmO25tXrQXw0C4PIrogELh9Ppdp7T7d+QXQ7UBy3wIDAQAB
```

### 5-2. SPF（MX）

```
Type      MX
Name      send
Value     feedback-smtp.ap-northeast-1.amazonses.com
Priority  10
```

### 5-3. SPF（TXT）

```
Type   TXT
Name   send
Value  v=spf1 include:amazonses.com ~all
```

登録後、Resend ダッシュボードの Domains で **Verify**。`verified` になったら：

```bash
npx wrangler secret put RESEND_FROM
# 値: FUJISAN SAKE <noreply@mtfuji-kikkou.com>
```

> **`verified` になる前に RESEND_FROM を設定しない。** 未認証のまま設定すると
> 全メールが 403 で失敗し、自分宛にも届かなくなります（管理画面に入れなくなります）。
>
> Cloudflare DNS の場合、プロキシ（オレンジ雲）は OFF。TXT / MX は元々対象外ですが念のため。

---

## タスク6. 本番でアカウントを作り、管理画面に入る

**現状**: 本番 D1 の `user` テーブルは空です。ローカルで作ったアカウントは
`.wrangler/state/v3/d1`（別DB）にあるだけで、本番には存在しません。

1. タスク2（`ADMIN_EMAILS`）を先に済ませる
2. https://fujisan.bbbyk105.workers.dev/register/personal で登録
3. 確認メールのリンクを踏む（`requireEmailVerification: true` のため必須）
4. https://fujisan.bbbyk105.workers.dev/admin に入れることを確認

> タスク5が終わる前でも、`onboarding@resend.dev` は**あなた宛には届く**ので、
> この作業だけは先に済ませられます。

---

## タスク7. 独自ドメインを接続する

`mtfuji-kikkou.com` は現在サイトに繋がっていません。

### 7-1. Cloudflare で Workers にカスタムドメインを割り当て

Cloudflare ダッシュボード → Workers & Pages → `fujisan` → Settings → Domains & Routes
→ カスタムドメインとして `mtfuji-kikkou.com` を追加。

### 7-2. BETTER_AUTH_URL を更新【重要】

```bash
npx wrangler secret put BETTER_AUTH_URL
# 値: https://mtfuji-kikkou.com
```

Better Auth のベース URL であると同時に、**Stripe 決済後の戻り先
（success_url / cancel_url）の基底**です。古いままだと決済は成功するのに
お客様がサイトへ戻れなくなります。

### 7-3. Stripe Webhook の URL を差し替え

`we_1UAthnHTT9ZXTgS1xYg2XRl4` の URL を
`https://mtfuji-kikkou.com/api/stripe/webhook` に変更。イベントはタスク3の 6 つ。

### 7-4. NEXT_PUBLIC_SITE_URL

canonical / OGP / sitemap の基底は**ビルド時**に決まるため、secret ではなく
ビルド環境の `NEXT_PUBLIC_SITE_URL` に `https://mtfuji-kikkou.com` を設定します。

---

## タスク8. 酒類販売の免許番号を入れる【法令】

`src/data/fujisan-legal.ts` の `LIQUOR_LICENCE` が `null` のままです。

```ts
export const LIQUOR_LICENCE = {
  taxOffice: "◯◯税務署",      // 所轄の税務署名
  number: "酒類指令第◯◯号",   // 免許番号
};
```

埋まるまで `npm run deploy` は predeploy（`scripts/check-legal-disclosure.mjs`）で
止まります。未設定のあいだ特商法ページには「免許番号は確認中です」と表示されます。

**それらしい伏せ字で埋めないこと。** 本物に見えたまま公開されます。

---

## タスク9. 実在庫を入力する

**現状**: 本番の在庫は**全 SKU 一律 24 本の暫定値**です（`0007` の初期値を
`0012` がそのまま引き継ぎます）。

https://fujisan.bbbyk105.workers.dev/admin/products で実際の本数に差し替えます。

- 販売可能数（実在庫 − 決済待ち）が 0 の SKU は自動的に購入不可になります
- 決済開始で引き当て、入金確定で実減算されます
- 「僅少の目安」を下回ると `/admin` にアラートが出ます
- 在庫の変更は staff 以上、価格の変更は owner のみ

**決済キーは既に本番に入っているため、技術的にはもう購入可能な状態です。**
告知の前に必ず実在庫へ直してください。

---

## タスク10. 本番で実決済テスト

ここまでで**唯一未検証**なのが、Stripe 実決済からの一連の流れです。

```
1. 一番安い「こころ 300ml（¥1,600）」を実際に購入
2. 確認すること
   · 注文確定メールが届く
   · /admin/orders に注文が出る（pending のまま残っていない）
   · /admin/products の在庫が 1本 減っている
3. /admin/orders の返金ボタンで全額返金 → 返金メールが届く・在庫が戻る
4. （任意）別の注文で「この額を返金」に一部だけ入れて、
   注文が進行中のまま残り、差引額が領収書に出ることを確認
```

ここまで通れば、Webhook 確定・在庫減算・メール・返金の全系統が本番で動く証明になります。

> **注意**: 本番キーなので実際にカードへ請求が走ります。返金しても Stripe の
> 決済手数料（¥1,600 なら60円前後）は戻りません。

---

## 任意

### Google ログインを本番で有効にする

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
```

`src/lib/auth.ts` は両方揃ったときだけ Google を有効にします。片方だけでは無効のまま。
Google Cloud 側のリダイレクト URI に本番ドメインの登録も必要です。

### SNS アカウント

`FujisanFooter.tsx` の `SOCIAL_LINKS` に URL を入れるとアイコンが出ます（空なら非表示）。

### 適格請求書（インボイス）登録番号

`INVOICE_REGISTRATION_NUMBER`。未登録なら `null` のままでよい（領収書に行が出ません）。

---

---

## タスク11. GitHub を Cloudflare に接続して自動デプロイにする

`npm run deploy` を手で打つ代わりに、**main への push で自動デプロイ**にする。
Cloudflare の Workers Builds を使う（GitHub Actions は不要）。

### 11-1. 接続

Cloudflare ダッシュボード → **Compute (Workers & Pages)** → `fujisan`
→ **Settings** → **Build** → **Connect to Git**

1. GitHub を認可する（Cloudflare の GitHub App をインストール）。
   対象リポジトリは `bbbyk105/fujisan` だけに絞ってよい
2. **Production branch**: `main`
3. **Root directory**: `/`（既定のまま）

### 11-2. コマンド

| 欄 | 値 |
|---|---|
| Build command | `npm run lint && npm test && npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

- **Build command を `npm run build` にしない。** `next build` だけでは
  `.open-next/worker.js` が作られず、`wrangler.jsonc` の `main` が指す先が無いまま
  デプロイ段階へ進んで必ず落ちる。OpenNext への変換まで含めて 1 本のコマンドにすること。
- **Deploy command は既定の `npx wrangler deploy` から必ず変えること。** 既定のままだと
  OpenNext の変換前の状態を上げようとして失敗する。
  `npx wrangler preview` も**不可**（Wrangler 1 系で廃止済みのコマンドで、4 系には無い。
  デプロイ段階が数秒で終了コード非 0 になり、ログにも原因が出にくい）。
- **PR のブランチでもビルドは走る。** Deploy command は production / non-production で
  分かれていないため、このままだと PR を出すたびに本番が差し替わる。非本番ブランチの
  ビルドを切るか、非本番側は `npx wrangler versions upload`（本番を差し替えずに
  バージョンだけ上げる）にしておくこと。
- lint と test をビルドコマンドに入れているのは、**落ちているコードが本番に出ないようにする門番**が
  他に無くなるため。Workers Builds には「テストが通ったら」という条件設定が無いので、
  ビルドコマンドの `&&` で繋ぐのがその代わりになる。
- `npm ci` は Workers Builds が lockfile を見て自動で走らせるので、書かなくてよい。
- `npm run cf-typegen` も不要（`cloudflare-env.d.ts` は gitignore 済みだが、
  無くてもビルドは通ることを実機で確認済み）。

### 11-3. 環境変数（ビルド時）

独自ドメインを繋いだら（タスク7）、**Build variables** に追加する。

```
NEXT_PUBLIC_SITE_URL = https://mtfuji-kikkou.com
```

canonical / OGP / sitemap の基底はビルド時に確定するため、Worker の secret ではなく
**ビルド変数**側に置く。未設定ならコード側の既定（本番ドメイン）にフォールバックする。

> `wrangler secret put` で入れた値（`STRIPE_SECRET_KEY` など）は**デプロイで消えない**。
> ビルド変数に入れ直す必要はない。

### 11-4. 接続後に変わること

- **`npm run deploy` の法令チェックが効かなくなる。** あれは `predeploy` フックなので、
  Cloudflare 側のビルドコマンドからは呼ばれない。免許番号が届いたら、
  Build command の先頭に `npm run check:legal &&` を足して門番を戻すこと。
- **D1 のマイグレーションは自動では流れない**（これは意図どおり）。`0012` のように表を
  落とすものがあり、コードのデプロイと同時に自動で流すと順番次第で本番が壊れる。
  スキーマを変えたときは、**先に**手でマイグレーションを適用してから push する。

  ```bash
  npx wrangler@4.136.2 d1 migrations apply fujisan-db --remote
  ```

  > 同梱の wrangler 4.86.0 は `d1 migrations apply --remote` が Cloudflare API から
  > 7403 を返す（`list` と `execute` は同じ認証で通るので、権限の問題ではない）。
  > 依存の wrangler を上げたら、このバージョン指定は外してよい。

- main 以外のブランチも既定ではビルドされ、プレビュー版が作られる。
  ビルド時間を使いたくなければ Settings で止める。

---

## 公開前の最終チェック

- [ ] `feat/integrate-admin-dashboard-catalog` を main へマージ
- [ ] 本番 D1 に `0013` まで適用済み（`product_sku` が消えている）
- [ ] `ADMIN_EMAILS` が設定済みで、`/admin` に入れる
- [ ] Stripe Webhook が 6 イベント
- [ ] Resend のドメインが `verified`
- [ ] `RESEND_FROM` が自社ドメイン（`onboarding@resend.dev` のままでない）
- [ ] 自分以外のメールアドレスで会員登録が完了できる
- [ ] `/admin/products` の在庫が実在庫
- [ ] `BETTER_AUTH_URL` が本番ドメイン
- [ ] 免許番号が入っている（`npm run check:legal` が通る）
- [ ] 実決済テストで在庫が減り、返金もできた
- [ ] （自動デプロイにしたなら）Build command に `npm run check:legal &&` を戻した

---

## よく使うコマンド

```bash
# 本番 secret の一覧（名前のみ。値は表示されません）
npx wrangler secret list --name fujisan

# 本番の適用済みマイグレーション
npx wrangler d1 execute fujisan-db --remote --command "SELECT name FROM d1_migrations ORDER BY id;"

# 本番の在庫を直接確認
npx wrangler d1 execute fujisan-db --remote \
  --command "SELECT product_slug, ml, on_hand, reserved, low_stock_threshold FROM inventory ORDER BY product_slug, ml;"

# 価格を上書きしている SKU（空なら全部カタログ価格）
npx wrangler d1 execute fujisan-db --remote --command "SELECT * FROM product_price;"

# Webhook が生きているか（400 が返れば正常。500 なら鍵が未設定）
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://fujisan.bbbyk105.workers.dev/api/stripe/webhook \
  -H "stripe-signature: t=0,v1=invalid" -H "content-type: application/json" -d '{}'

# デプロイ（lint / test / build を通してから）
npm run lint && npm test && npm run build && npm run deploy
```
