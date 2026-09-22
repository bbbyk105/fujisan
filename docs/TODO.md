# やるべきこと

最終更新: 2026-09-22

---

## 🚨 本番公開の前に必ず（コードだけでは終わらない作業）

### 1. 通信販売酒類小売業免許の番号を入れる

**番号が未着のため未設定。この状態では公開できない**（酒類の通信販売は免許番号の表示が法令上必須）。

`src/data/fujisan-legal.ts` の 2 行を埋めるだけで、特商法ページの表記とデプロイ検査の両方が通る。

```ts
export const LIQUOR_LICENCE = {
  taxOffice: "◯◯税務署",      // 所轄の税務署名
  number: "酒類指令第◯◯号",   // 免許番号
};
```

埋まるまで `npm run deploy` は `predeploy`（`scripts/check-legal-disclosure.mjs`）で止まる。
未設定のあいだ特商法ページには「免許番号は確認中です」と表示される。

### 2. Stripe ダッシュボードで Webhook イベントを追加する

コードは対応済みだが、**ダッシュボード側で購読しないと届かない**。

| イベント | 購読しないと起きること |
| --- | --- |
| `checkout.session.completed` | （設定済みのはず）注文が確定しない |
| `checkout.session.async_payment_succeeded` | （設定済みのはず）コンビニ払いが確定しない |
| `checkout.session.expired` | 未払いの pending 注文が永久に溜まる |
| `checkout.session.async_payment_failed` | 同上 |
| `charge.refunded` | **ダッシュボードから返金しても DB は confirmed のまま** |
| `charge.dispute.created` | チャージバックに気づけない（放置すると売上が引かれる） |

送信先: `https://<本番ドメイン>/api/stripe/webhook`

### 3. 本番 D1 にマイグレーションを適用する

```bash
npx wrangler d1 migrations apply fujisan-db --remote
```

未適用: `0007_contact_message.sql`（お問い合わせ）、`0008_order_cancel_request.sql`（キャンセル依頼）、
`0009_inventory.sql`（在庫）、`0010_trade_account.sql`（取扱店の審査）。
`--local` と `--remote` は別の DB なので、ローカルで通っていても本番には反映されない。

### 4. 本番 secret を確認する

```bash
npx wrangler secret put ADMIN_EMAILS        # 未設定だと誰も管理画面に入れない
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY      # 未設定だとメールが飛ばない
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put BETTER_AUTH_URL     # Stripe の戻り先の基底になる
```

`ADMIN_EMAILS` はソースのフォールバックを撤去したため**必須**。全項目は `.env.example` 参照。

### 5. 既存の法人アカウントを承認する

取扱店の承認フローを入れたため、**`trade_account` に行が無い法人は未承認**として扱われ、
卸価格が表示されない。この機能より前に登録したお客様がいる場合は
`/admin/customers` で「未申請（旧アカウント）」と表示されるので、確認のうえ承認すること。
新規のお申し込みは登録時に審査待ちの行ができる。

### 6. 在庫の初期設定（任意）

`/admin/inventory` で SKU ごとに本数を入れると在庫管理が始まる。入れないあいだは
従来どおり数量無制限で売れるので、公開のブロッカーではない。
売り越しを防ぎたい SKU から順に設定する。

### 7. 決めれば埋まるもの

- **SNS アカウント** — `FujisanFooter.tsx` の `SOCIAL_LINKS` に URL を入れるとアイコンが出る（空なら非表示）
- **適格請求書（インボイス）登録番号** — `INVOICE_REGISTRATION_NUMBER`。未登録なら `null` のままでよい（領収書に行が出ない）
- **独自ドメイン** — 本番ドメインが `fujisan-sake.com` でないなら `NEXT_PUBLIC_SITE_URL` を設定（canonical / OGP / sitemap の基底）

---

## 積み残し（フェーズ3）

優先度順。着手時はこのファイルを更新すること。

### BtoB の発注機能

承認フローは実装済み（下記）。残るのは**発注そのもの**で、`/shop/business` はいまも
卸価格表の閲覧までしかできない。ここから先は決済条件の判断が要るため保留している。

- 法人向けカート（ケース単位・卸価格）
- 銀行振込／掛売の決済分岐（現状はカードのみ）— **与信の運用と、オフライン入金の消し込みを誰がどう行うかを決めないと設計できない**

#### ~~法人アカウントの承認フロー~~（実装済み）

`trade_account` 表（`0010`）で審査する。**卸価格の表示条件は `role === "business"` ではなく
`status === "approved"`**（`src/lib/trade.ts` の `canSeeWholesalePricing`）。
登録時に業態を選んでもらい、転売する業態（小売・卸）にだけ酒類販売業免許番号を必須にしている
（飲食店・宿泊施設の店内提供は「販売」ではないため。実態に合わない必須項目は嘘の入力を誘発する）。
承認・見送りは `/admin/customers` から。見送りの理由はそのままお客様へのメールに載る。

### ~~在庫管理~~（実装済み）

D1 の `inventory` 表で SKU ごとに管理するようにした。`/admin/inventory` で本数を入れると
その SKU の管理が始まる（オプトイン方式なので、入れるまでは従来どおり無制限）。

残っているのは以下。

- **商品の追加・価格変更は引き続きデプロイが必要**（カタログがコード内のため）
- 入荷予定・ロット・賞味期限の管理は無い
- 在庫切れ間近の通知が無い（`/admin/inventory` を見に行く必要がある）
- 商品ページは静的書き出しのため、リアルタイムの残数を出していない（Worker の CPU 制限を避けるため）。
  在庫切れはカート／決済開始時に判明する

### 管理ダッシュボード

`/admin` は `/admin/orders` へリダイレクトするだけ。売上集計、期間絞り込み、CSV エクスポート、納品書・送り状の印刷が無い。個人顧客の一覧も無い（`/admin/customers` は法人のみ）。

### メールアドレスの変更

Better Auth の `changeEmail` は使えるが、`user.changeEmail.enabled` の設定に加えて「**現在の**アドレスに確認メールを送ってから切り替える」ラウンドトリップが必要。パスワード変更と同じ粒度では収まらないため独立作業として保留中。

### 部分返金

`adminRefundOrderAction` は全額のみ。Webhook 側も部分返金を検知したら ops 通知に留めている（スキーマが表現できないため）。対応するなら `orders` に返金額の列が要る。

---

## 技術的負債

### `drizzle/` の journal がずれている

`0006_user_postal_code.sql` が手書き追加で `drizzle/meta/_journal.json` に載っていない。
このため **`drizzle-kit generate` を実行してはいけない**（0005 のスナップショットとの差分を出すので、適用済みの列を二重に出力する）。

当面はマイグレーション SQL を手書きで追加する。`wrangler d1 migrations apply` は journal ではなくファイル名順で適用するので動作には影響しない。

直すなら、現在のスキーマから snapshot を作り直して journal を 0010 まで揃える。

### 日付フォーマット

Workers は UTC で動く。日付を出すときは必ず `src/lib/format-date.ts` のヘルパーを使うこと
（`timeZone: "Asia/Tokyo"` を省くと JST 00:00〜09:00 の出来事が前日の日付になる）。
ローカルの OS が JST だと気づけない種類のバグ。
