# FUJISAN 本番セットアップ

本番公開までに残っている設定作業と、済んだ設定の控え。上から順に進めれば詰まりません。

- 本番 URL: https://sakefujisan.com（2026-09-24 取得・Cloudflare Registrar）
- 旧 URL: https://fujisan.bbbyk105.workers.dev（Stripe Webhook 以外は sakefujisan.com へ 308）
- Worker 名: `fujisan` / D1: `fujisan-db`
- デプロイ: main への push で Cloudflare Workers Builds が自動で本番へ出す

コマンドはすべて `~/Projects/fujisan` で実行します（wrangler は `wrangler.jsonc` のある
フォルダで動かさないと、`account_id` と D1 の設定を読まない）。

> **コードの積み残し**は [`docs/TODO.md`](./docs/TODO.md) にあります。
> こちらは「環境を触らないと終わらない作業」だけを扱います。

---

## いまの状態（2026-09-24 時点。日付のある行はその日に確認）

| | 内容 |
|---|---|
| ✅ | 本番 D1 のマイグレーションは `0017` まで適用済み（2026-11-05） |
| ✅ | 独自ドメイン `sakefujisan.com`（www・workers.dev は apex へ転送） |
| ✅ | メール送信: Resend で `sakefujisan.com` を認証済み、送信元は `info@sakefujisan.com` |
| ✅ | メール受信: Cloudflare Email Routing で `info@` → `mtfujipharmacy@gmail.com` |
| ✅ | DMARC（`_dmarc` TXT `v=DMARC1; p=none;`） |
| ✅ | Stripe 本番 Webhook（`we_1UAthnHTT9ZXTgS1xYg2XRl4`）: URL は sakefujisan.com、6 イベント |
| ✅ | Stripe は本番の制限付きキー（`fujisan-production`）に切り替え済み（2026-11-04）。Checkout の開始と期限切れの Webhook は本番で確認済み |
| ⚠️ | **実際の決済と返金のテストは未実施**（タスク6） |
| ✅ | Cloudflare Turnstile はサイトキーと秘密鍵を登録済み（2026-11-05）。ゲストの決済で判定が動くかは実決済で確かめる（タスク6・タスク8） |
| ✅ | `ADMIN_EMAILS` = `mtfujipharmacy@gmail.com,bbbyk105@yahoo.co.jp` |
| ✅ | 管理者のアドレスのアカウントは登録・メール確認済み。`bbbyk105@yahoo.co.jp` で `/admin` に入れることを確認（2026-11-05） |
| ✅ | 本番 D1 の在庫は全 SKU 12 本で、蔵の実数と合っている（2026-11-05 本人確認） |

### 本番 Worker の secret（`npx wrangler secret list` で確認済み）

```
OK  ADMIN_EMAILS             = mtfujipharmacy@gmail.com,bbbyk105@yahoo.co.jp
OK  BETTER_AUTH_SECRET
OK  BETTER_AUTH_URL          = https://sakefujisan.com
OK  RESEND_API_KEY           ← 2026-09-24 に差し替え（前のキーは 401 で全メールが止まっていた）
OK  RESEND_FROM              = FUJISAN SAKE <info@sakefujisan.com>
OK  STRIPE_SECRET_KEY        ← 本番の制限付きキー（タスク4）
OK  STRIPE_WEBHOOK_SECRET    ← 本番 Webhook の署名シークレット（タスク4）
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

## タスク3. 酒類販売の免許番号を入れる（廃止: 2026-11-04）

番号は入れないと本人が決めた。特商法ページの行、フッターの案内、`LIQUOR_LICENCE`、
`npm run check:legal` の番号の検査を外してある（伏せ字の検査は残っている）。

## タスク4. Stripe を本番モードに切り替える

2026-11-04 に本番へ切り替え済み。キーを作り直すときの手順として残す。

本番のキーの発行はダッシュボードでしかできない（`stripe login` のキーは本番アプリ向けではない）。
このアカウントは天地星空と共用なので、既存のキーはローテーションせず、fujisan 専用の
制限付きキーを新しく作る。

| 権限 | 設定 |
| --- | --- |
| Checkout Sessions | 書き込み |
| Payment Intents | 読み取り |
| Charges | 書き込み（Refunds はここに含まれる） |

`Tax Rates` は 2026-11-05 から使っていない。この変更のデプロイ後に `fujisan-production` から外す（デプロイ前に外すと、古いコードの決済で税率を取得できず、運用通知が飛ぶ）。

1. Stripe の本番利用申請（事業者情報・振込先口座）を済ませる
2. 本番の Webhook はもうある（`we_1UAthnHTT9ZXTgS1xYg2XRl4`、sakefujisan.com、6 イベント）。
   ダッシュボード（本番）→ 開発者 → Webhook → このエンドポイント → 署名シークレットを表示
3. 本番の鍵を入れる

   ```bash
   npx wrangler secret put STRIPE_SECRET_KEY      # rk_live_...
   npx wrangler secret put STRIPE_WEBHOOK_SECRET  # 手順2の whsec_...
   ```

   **2 つは必ず同時に入れ替える。** 片方だけだと、決済は通るのに Webhook の署名検証が
   失敗して注文が確定しない。
4. **在庫を数え直す。** sandbox のあいだも、会員登録すれば誰でもテスト用のカードで買え、
   その注文は Webhook で確定して本番 D1 の在庫を減らす。切り替えた直後に蔵の本数と
   「よく使うコマンド」の在庫の SELECT を突き合わせ、ずれていれば `/admin/products` で直す

sandbox 側の Webhook の URL が旧 URL（workers.dev）のままでも、`/api/stripe/webhook` だけは
転送から外してあるので届く。sandbox を使い続けるなら、sandbox のダッシュボードでも URL を
`https://sakefujisan.com/api/stripe/webhook` にしておく。

## タスク4-2. Stripe の領収書の設定（済: 2026-11-04）

領収書は Stripe が出す。Checkout に `receipt_email` を渡しているので、本番の決済が成功すると
自動で届く。アカウントは天地星空（オーストラリア向けのサイト）と共用で、下の設定はそちらにも効く。

| 項目 | 値 | 場所 |
|---|---|---|
| 発行者名 | `株式会社 近藤薬局` | 設定 → ビジネス → ビジネスの詳細 → 公開情報の「法人名 (屋号)」。空だと明細書の表記が出る |
| 明細書の表記 | `KONDO PHARMACY CO.,LTD`・`近藤薬局`・`コンドウヤッキョク` | 同じ画面の「明細書表記」 |
| 問い合わせ先 | `info@sakefujisan.com` | 同じ画面の公開情報 |
| 登録番号 | `JP TRN` `T4080103000596` | 請求書テンプレートの「納税者番号」 |
| 領収書への記載 | 「領収書メールに登録番号を記載する」をオン | 設定 → ビジネス → 送信メール |
| メールの言語 | 英語のまま（2026-11-04 本人） | 同じ画面の「デフォルトの言語」。アカウント全体の設定で、日本語にすると天地星空のお客様にも日本語で届く |

テスト環境の領収書に登録番号を出すには、テスト環境にも税務 ID が要る（登録済み）。
本番の領収書は、実決済（タスク6）で発行者名・問い合わせ先・登録番号・品名の税率を確認する。
テスト環境では自動メールが出ない。領収書は注文詳細の「領収書を表示」か `receipt_url` で開ける。

## タスク5. 実在庫を入力する（済: 2026-10-29）

管理者のアカウントがまだ無いため、wrangler から直接 SQL で全 7 SKU を 20 本にした。
更新前の `reserved` は全 SKU 0。`reserved` と `low_stock_threshold` には触っていない。
2026-11-04 に本人の指示で、同じ方法で全 7 SKU を 12 本にした（`reserved` は全 SKU 0）。
いまの本数は「よく使うコマンド」の在庫の SELECT で見る（ここの本数は当日の記録）。

下の SQL は**そのときに流したものの記録で、棚卸しの手順ではない。** WHERE が無いので
全 SKU が同じ本数になり、行の無い SKU は作らず、管理画面の検証（SKU の確認・上限）も
通らない。棚卸しは管理画面で行う。

```sql
UPDATE inventory SET on_hand = 20, updated_by_email = 'wrangler:2026-10-29 棚卸し',
  updated_at = cast(unixepoch('subsecond') * 1000 as integer);
```

以後の棚卸しは、タスク2 で管理者のアカウントを作ったあと
https://sakefujisan.com/admin/products で実際の本数に差し替えます。

- 販売可能数（実在庫 − 決済待ち）が 0 の SKU は自動的に購入不可になります
- 決済開始で引き当て、入金確定で実減算されます
- 販売可能数が「僅少の目安」以下（0 本を除く）になると `/admin` にアラートが出ます
- 在庫の変更は staff 以上、価格の変更は owner のみ

## タスク6. 本番で実決済テスト（タスク4 の後）

Stripe 本番の決済からの一連の流れは、まだ本番で通していません。

```
1. 一番安い「こころ 300ml（¥1,600）」を実際に購入
2. 確認すること
   · 注文確定メールが info@sakefujisan.com から届く
   · Stripe の領収書が届き、発行者名・登録番号・品名の税率が正しい（タスク4-2）
   · /admin/orders に注文が出る（pending のまま残っていない）
   · /admin/products の在庫が 1本 減っている
3. /admin/orders の返金ボタンで全額返金 → 返金メールが届く・在庫が戻る
4. （任意）別の注文で「この額を返金」に一部だけ入れて、
   注文が進行中のまま残ることを確認
```

> **注意**: 本番キーなので実際にカードへ請求が走ります。返金しても Stripe の
> 決済手数料（¥1,600 なら60円前後）は戻りません。

## タスク7. Workers Builds の非本番ブランチを直す（済: 2026-10-22）

PR のブランチのビルドが**必ず失敗していた**（PR に常に赤いチェックが付いていた）。
非本番ブランチは本番のビルド設定ではなく、Cloudflare の Previews の設定で動く。
その既定が Build command `npm run build`・Deploy command `npx wrangler preview` で、
`next build` だけでは `.open-next/` が作られず、デプロイの段階で
`.open-next/assets` が無いと落ちていた（2026-09-24 に直したつもりで、この既定のままだった）。

2026-10-22 に Previews を止めた（ダッシュボードでは Settings → Build → Branch control の
「Enable Preview Builds」）。PR の確認は GitHub Actions の lint / test / build で行う。

- Deploy command を `npx opennextjs-cloudflare upload` にする方法は使えない。Previews のビルドは
  プレビューを宛先にするので、本番の Worker へ版を上げようとして
  「wrangler.jsonc の name が Worker の名前と一致しない」で落ちる（2026-10-22 に試した）
- プレビューを使うなら `npx opennextjs-cloudflare build` のあと `npx wrangler preview`。
  wrangler 4.135 以上が要る。プレビューは本番の secret を引き継がないので、wrangler.jsonc の
  `previews` にバインディングを書き、secret は `wrangler preview base-config secret put` で入れる。
  D1 を本番と同じ `database_id` にすると、本番と行を共有する

あわせて、Build command に lint とテストを入れる。テストが落ちたまま本番へ出るのを
止めるため。

```
npm run lint && npm test && npx opennextjs-cloudflare build
```

`npm run check:legal` は入れない（2026-11-05）。検査するのは `src/data/` の伏せ字だけで、いまは
残っていない。`npm run deploy` の predeploy でしか走らないので、法令の値を書き換えたときは手で流す。

---


## タスク8. Cloudflare Turnstile を有効にする

ゲストの決済開始のボット判定。カードなしで在庫を 30 分押さえられるので、これが無いと同じ IP から
1 時間に 2 回で売り切れの状態を保てる。

1. Cloudflare のダッシュボード → Turnstile → Add widget
   - Widget name: `fujisan-guest-checkout`
   - Hostname: `sakefujisan.com`
   - Widget mode: Managed
2. 表示された**サイトキー**を `src/data/fujisan-turnstile.ts` に入れてデプロイする（公開してよい値。
   済: 2026-11-05）
3. **秘密鍵**を入れる

   ```bash
   npx wrangler secret put TURNSTILE_SECRET_KEY
   ```

判定はサイトキーと秘密鍵の両方がそろってから動くので、順番はどちらが先でも決済は止まらない。

手元では必ず Cloudflare のテスト用のキーを使う。本番のサイトキーは localhost で動かない（許可しない）
ので、付けずに起動するとゲストの決済へ進めない。秘密鍵は `.dev.vars` の `TURNSTILE_SECRET_KEY`、
サイトキーは起動コマンドの前に付ける。

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npx next dev --webpack -p 3100
```

| 用途 | サイトキー | 秘密鍵 |
| --- | --- | --- |
| 必ず成功 | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| 必ず失敗 | `1x00000000000000000000AA` | `2x0000000000000000000000000000000AA` |

## 任意

- **Google ログイン**: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` を両方入れる（片方だけでは無効）。
  Google Cloud 側の承認済みリダイレクト URI に
  `https://sakefujisan.com/api/auth/callback/google` を登録する
- **SNS**: `FujisanFooter.tsx` の `SOCIAL_LINKS`（空なら非表示）
- **インボイス登録番号**: 済（2026-10-29）。`T4080103000596`。領収書に出す値は Stripe の設定で決まる（タスク4-2）。`INVOICE_REGISTRATION_NUMBER` は控え
- **Google Search Console**: `sakefujisan.com` を登録し、`https://sakefujisan.com/sitemap.xml` を送信

---

## 公開前の最終チェック

- [x] `ADMIN_EMAILS` が設定済み
- [x] 管理者のアドレスで `/admin` に入れる（2026-11-05）
- [x] 自分以外のメールアドレスで会員登録が完了できる（2026-11-05 本人確認）
- [x] Stripe が本番キー（`STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` を同時に差し替え済み）
- [x] 本番 D1 に実在庫を入れた（2026-10-29）
- [x] 本番キーに切り替えたあと、蔵の本数と在庫の SELECT が一致する（2026-11-05 本人確認。全 SKU 12 本）
- [x] `/admin/products` の在庫が、在庫の SELECT と同じ本数で出る（2026-11-05 本人確認）
- [x] Stripe の登録サイトを確認した（2026-11-05 本人確認）
- [x] Cloudflare Turnstile のサイトキーと秘密鍵を入れた（2026-11-05）
- [ ] ゲストの決済で Turnstile の判定が動く（タスク6 の実決済で確かめる）
- [ ] 本番の領収書の発行者名・問い合わせ先・登録番号・品名の税率が正しい（タスク4-2）
- [ ] デプロイ後に `fujisan-production` から `Tax Rates` の権限を外した（タスク4）
- [ ] 実決済テストで在庫が減り、返金もできた
- [x] 本番 D1 に `0017` まで適用済み
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
| Previews（非本番ブランチのビルド） | 無効（タスク7） |

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
  npx wrangler d1 migrations apply fujisan-db --remote
  ```

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
