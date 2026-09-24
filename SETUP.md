# FUJISAN 本番セットアップ

本番公開までに残っている設定作業と、済んだ設定の控え。上から順に進めれば詰まりません。

- 本番 URL: https://sakefujisan.com（2026-09-24 取得・Cloudflare Registrar）
- 旧 URL: https://fujisan.bbbyk105.workers.dev（Stripe Webhook 以外は sakefujisan.com へ 308）
- Worker 名: `fujisan` / D1: `fujisan-db`
- デプロイ: main への push で Cloudflare Workers Builds が自動で本番へ出す

コマンドはすべて `~/Desktop/Projects/fujisan` で実行します。

> **コードの積み残し**は [`docs/TODO.md`](./docs/TODO.md) にあります。
> こちらは「環境を触らないと終わらない作業」だけを扱います。

---

## いまの状態（2026-09-24 時点）

| | 内容 |
|---|---|
| ✅ | 本番 D1 のマイグレーションは `0014` まで適用済み |
| ✅ | 独自ドメイン `sakefujisan.com`（www・workers.dev は apex へ転送） |
| ✅ | メール送信: Resend で `sakefujisan.com` を認証済み、送信元は `info@sakefujisan.com` |
| ✅ | メール受信: Cloudflare Email Routing で `info@` → `mtfujipharmacy@gmail.com` |
| ✅ | DMARC（`_dmarc` TXT `v=DMARC1; p=none;`） |
| ✅ | Stripe 本番 Webhook（`we_1UAthnHTT9ZXTgS1xYg2XRl4`）: URL は sakefujisan.com、6 イベント |
| ⚠️ | **決済は Stripe の sandbox（テスト）のまま**。本番キーへの切り替えはタスク4 |
| ✅ | `ADMIN_EMAILS` = `mtfujipharmacy@gmail.com,bbbyk105@yahoo.co.jp` |
| ⚠️ | 本番のユーザーは 0 人。管理者のアドレスで会員登録すると `/admin` に入れる（タスク2） |
| ⚠️ | 在庫は全 SKU 一律 24 本の暫定値 |

### 本番 Worker の secret（`npx wrangler secret list` で確認済み）

```
OK  ADMIN_EMAILS             = mtfujipharmacy@gmail.com,bbbyk105@yahoo.co.jp
OK  BETTER_AUTH_SECRET
OK  BETTER_AUTH_URL          = https://sakefujisan.com
OK  RESEND_API_KEY           ← 2026-09-24 に差し替え（前のキーは 401 で全メールが止まっていた）
OK  RESEND_FROM              = FUJISAN SAKE <info@sakefujisan.com>
OK  STRIPE_SECRET_KEY        ← sandbox のキー。本番公開時に差し替え（タスク4）
OK  STRIPE_WEBHOOK_SECRET    ← 同上
--  GOOGLE_CLIENT_ID         （未設定 = Google ログインは無効）
--  GOOGLE_CLIENT_SECRET
```

---

## タスク1. ADMIN_EMAILS を設定する（済: 2026-09-24）

```bash
npx wrangler secret put ADMIN_EMAILS
# 値: カンマ区切り。例) byakkokondo@gmail.com,mtfujipharmacy@gmail.com
```

未設定のあいだは誰も `/admin` に入れず、お問い合わせの管理者通知や障害通知の宛先も 0 件になる
（お問い合わせ自体は D1 に保存されるので失われないが、届いたことに気づけない）。
staff の追加は `/admin/team` からメール招待でできます（招待は **14 日で失効**）。

## タスク2. 本番でアカウントを作り、管理画面に入る

本番 D1 の `user` テーブルは空です（ローカルの `.wrangler/state/v3/d1` は別 DB）。

1. タスク1 を先に済ませる
2. https://sakefujisan.com/register/personal で登録
3. 確認メールのリンクを踏む（`requireEmailVerification: true` のため必須）
4. https://sakefujisan.com/admin に入れることを確認

## タスク3. 酒類販売の免許番号を入れる【法令】

`src/data/fujisan-legal.ts` の `LIQUOR_LICENCE` が `null` のままです。
通信販売での酒類販売では、免許番号の表示が必須です。

```ts
export const LIQUOR_LICENCE = {
  taxOffice: "◯◯税務署",      // 所轄の税務署名
  number: "酒類指令第◯◯号",   // 免許番号
};
```

未設定のあいだ特商法ページには「免許番号は確認中です」と表示されます。
**それらしい伏せ字で埋めないこと。** 本物に見えたまま公開されます。

埋めたら、Workers Builds の Build command の先頭に `npm run check:legal &&` を足す
（タスク7）。`npm run check:legal` は `npm run deploy` の predeploy でしか走らず、
**自動デプロイでは未記入のままでも本番に出せてしまう**ため。

## タスク4. Stripe を本番モードに切り替える

いまの `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` は sandbox のもの。

1. Stripe の本番利用申請（事業者情報・振込先口座）を済ませる
2. 本番の Webhook はもうある（`we_1UAthnHTT9ZXTgS1xYg2XRl4`、sakefujisan.com、6 イベント）。
   ダッシュボード（本番）→ 開発者 → Webhook → このエンドポイント → 署名シークレットを表示
3. 本番の鍵を入れる

   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY      # sk_live_...
   npx wrangler secret put STRIPE_WEBHOOK_SECRET  # 手順2の whsec_...
   ```

   **2 つは必ず同時に入れ替える。** 片方だけだと、決済は通るのに Webhook の署名検証が
   失敗して注文が確定しない。

sandbox 側の Webhook の URL が旧 URL（workers.dev）のままでも、`/api/stripe/webhook` だけは
転送から外してあるので届く。sandbox を使い続けるなら、sandbox のダッシュボードでも URL を
`https://sakefujisan.com/api/stripe/webhook` にしておく。

## タスク5. 実在庫を入力する

https://sakefujisan.com/admin/products で実際の本数に差し替えます（タスク2 の後）。

- 販売可能数（実在庫 − 決済待ち）が 0 の SKU は自動的に購入不可になります
- 決済開始で引き当て、入金確定で実減算されます
- 「僅少の目安」を下回ると `/admin` にアラートが出ます
- 在庫の変更は staff 以上、価格の変更は owner のみ

## タスク6. 本番で実決済テスト（タスク4 の後）

Stripe 本番の決済からの一連の流れは、まだ本番で通していません。

```
1. 一番安い「こころ 300ml（¥1,600）」を実際に購入
2. 確認すること
   · 注文確定メールが info@sakefujisan.com から届く
   · /admin/orders に注文が出る（pending のまま残っていない）
   · /admin/products の在庫が 1本 減っている
3. /admin/orders の返金ボタンで全額返金 → 返金メールが届く・在庫が戻る
4. （任意）別の注文で「この額を返金」に一部だけ入れて、
   注文が進行中のまま残り、差引額が領収書に出ることを確認
```

> **注意**: 本番キーなので実際にカードへ請求が走ります。返金しても Stripe の
> 決済手数料（¥1,600 なら60円前後）は戻りません。

## タスク7. Workers Builds の非本番ブランチを直す

PR のブランチでもビルドが走り、非本番ブランチからは本番へ出せないため**必ず失敗する**
（PR に常に赤いチェックが付く）。

Cloudflare ダッシュボード → Workers & Pages → `fujisan` → Settings → Build →
Branch control で、どちらかにする。

- **プレビューを使う（推奨）**: 非本番ブランチの Deploy command を
  `npx opennextjs-cloudflare upload` にする。本番を差し替えずにバージョンだけを上げ、
  PR ごとのプレビュー URL が出る
- **使わない**: 「非本番ブランチのビルド」を無効にする

あわせて、タスク3 が済んだら Build command を次にする。

```
npm run check:legal && npm run lint && npm test && npx opennextjs-cloudflare build
```

---

## 任意

- **Google ログイン**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を両方入れる（片方だけでは無効）。
  Google Cloud 側の承認済みリダイレクト URI に
  `https://sakefujisan.com/api/auth/callback/google` を登録する
- **SNS**: `FujisanFooter.tsx` の `SOCIAL_LINKS`（空なら非表示）
- **インボイス登録番号**: `INVOICE_REGISTRATION_NUMBER`。未登録なら `null` のままでよい
- **Google Search Console**: `sakefujisan.com` を登録し、`https://sakefujisan.com/sitemap.xml` を送信

---

## 公開前の最終チェック

- [x] `ADMIN_EMAILS` が設定済み
- [ ] 管理者のアドレスで登録し、`/admin` に入れる
- [ ] 自分以外のメールアドレスで会員登録が完了できる（確認メールが info@ から届く）
- [ ] 免許番号が入っている（`npm run check:legal` が通る）
- [ ] Workers Builds の Build command に `npm run check:legal &&` が入っている
- [ ] Stripe が本番キー（`STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` を同時に差し替え済み）
- [ ] `/admin/products` の在庫が実在庫
- [ ] 実決済テストで在庫が減り、返金もできた
- [x] 本番 D1 に `0014` まで適用済み
- [x] `BETTER_AUTH_URL` が `https://sakefujisan.com`
- [x] Resend のドメインが `verified`、`RESEND_FROM` が `info@sakefujisan.com`
- [x] `info@sakefujisan.com` 宛のメールが Gmail に届く
- [x] Stripe 本番 Webhook の URL が sakefujisan.com・6 イベント

---

## 済んだ設定の控え

### 独自ドメイン

- `wrangler.jsonc` の `routes` に `sakefujisan.com` と `www.sakefujisan.com` を custom domain で登録
  （DNS レコードと証明書は Cloudflare が自動で作る）
- www と workers.dev は `next.config.ts` の redirects で apex へ 308。workers.dev の
  `/api/stripe/webhook` だけは転送しない（Stripe はリダイレクトを追わない）
- `BETTER_AUTH_URL` は Better Auth のベース URL であると同時に、**Stripe 決済後の戻り先
  （success_url / cancel_url）の基底**
- canonical / OGP / sitemap は `src/lib/seo.ts` の `SITE_URL`（既定が sakefujisan.com。
  プレビューで変えたいときだけビルド変数 `NEXT_PUBLIC_SITE_URL` を入れる）

### メール

- 送信（Resend、Tokyo リージョン）: DKIM `resend._domainkey`（TXT）、`send` / `rsend`（CNAME、DNS only）。
  `rsend` のターゲットは `rsend-apne1.forge.rmta.net`（`-apne1` が抜けると SPF が通らない）
- **`RESEND_FROM` はドメインが `verified` になってから入れる。** 未認証のまま入れると全メールが
  403 で失敗し、自分宛にも届かなくなる
- 受信（Email Routing）: apex の MX 3 件と SPF は Email Routing が自動で入れたもの。
  ルールは `info@` → `mtfujipharmacy@gmail.com` の 1 本、キャッチオールは無効（ドロップ）
- DMARC: `_dmarc` TXT `v=DMARC1; p=none;`

### Stripe Webhook のイベント

| イベント | 購読しないと起きること |
|---|---|
| `checkout.session.completed` | 注文が確定しない |
| `checkout.session.async_payment_succeeded` | コンビニ払いが確定しない |
| `checkout.session.async_payment_failed` | 未払いの pending 注文が溜まる |
| `checkout.session.expired` | 同上（在庫も押さえたまま） |
| `charge.refunded` | ダッシュボードから返金しても DB に残らない |
| `charge.dispute.created` | チャージバックに気づけない（放置すると売上が引かれる） |

### Workers Builds（自動デプロイ）

| 欄 | 値 |
|---|---|
| Production branch | `main` |
| Build command | `npm run lint && npm test && npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

- **Build command を `npm run build` にしない。** `next build` だけでは `.open-next/worker.js` が
  作られず、デプロイ段階で必ず落ちる
- **Deploy command を既定の `npx wrangler deploy` にしない。** OpenNext の変換前の状態を
  上げようとして失敗する
- lint と test をビルドコマンドに入れているのは、落ちているコードが本番に出ないようにする
  門番が他に無いため
- `wrangler secret put` で入れた値は**デプロイで消えない**。ビルド変数に入れ直す必要はない
- **D1 のマイグレーションは自動では流れない**（意図どおり）。スキーマを変えたときは、
  **先に**手でマイグレーションを適用してから push する

  ```bash
  npx wrangler@4.136.2 d1 migrations apply fujisan-db --remote
  ```

  > 同梱の wrangler 4.86.0 は `d1 migrations apply --remote` が Cloudflare API から
  > 7403 を返す（`list` と `execute` は同じ認証で通るので、権限の問題ではない）。
  > 依存の wrangler を上げたら、このバージョン指定は外してよい。

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
  https://sakefujisan.com/api/stripe/webhook \
  -H "stripe-signature: t=0,v1=invalid" -H "content-type: application/json" -d '{}'
```
