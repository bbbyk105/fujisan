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
- **DB**: Cloudflare D1 (SQLite) + Drizzle ORM。スキーマは `src/db/`（auth / orders / invite / contact / inventory / price / trade / rate-limit に分割、`schema.ts` が re-export）。マイグレーション SQL は `drizzle/`（`wrangler d1 migrations apply fujisan-db [--local|--remote]` で適用）。D1 バインディングはリクエスト時にしか取れないため、必ず `getDb()`（`src/db/index.ts`）経由で毎回取得する。
- **認証**: Better Auth + Drizzle アダプタ。メール認証必須・Google ログインは env 設定時のみ有効。`user.role` は `personal | business`（法人は companyName 等の追加フィールドあり。**`business` は「法人として登録した」だけで、卸価格の可否は `trade_account` の審査で決まる** — 下記「取扱店（BtoB）の承認」）。管理者は `owner | staff` の2階層（`src/lib/admin.ts`。**`ADMIN_EMAILS` env は必須**（未設定だと env owner は 0 人。ソースにフォールバックのアドレスは置かない）、メール招待 `teamInvite` → 登録時に `databaseHooks.user.create.after` でロール付与）。**招待は 14 日で失効**する — 期限が無いと、退職者向けや宛先を間違えた古い招待メールのアドレスが後から登録された際に、意図せず管理権限が付く。招待し直しでは `createdAt` も打ち直す。
- **メールアドレスの変更は新旧どちらの承認も要る**（`user.changeEmail`）。まず**変更前**のアドレスへ承認リンクを送り、それを踏むと Better Auth が新アドレス宛にも確認メールを出し、そちらを踏んで初めて入れ替わる。宛先を `newEmail` にすると、セッションを奪った側が現アドレスの持ち主に知らせないままアカウントを移せる。設定の要点は `src/lib/__tests__/auth-options.test.ts` で固定している。
- **Server Actions 中心**: ミューテーションは `src/lib/actions/`（checkout / orders / account / contact / admin-*）。API Route は Better Auth の `/api/auth/[...all]` と Stripe Webhook のみ。middleware は無く、ガードは各ページ/アクション内で `getSession()` / `getEffectiveAdminRole()`。
- **商品カタログはコード、価格と在庫は D1 の上書き**: 銘柄・容量・ストーリー・画像は `src/data/fujisan-products.ts`。そこへ D1 の `product_price`（価格の上書き）と `inventory`（在庫）を重ねたものが**実勢カタログ** `src/lib/catalog.ts` で、**決済・管理画面・卸価格表はこれを正とする**。どちらの表も**オプトイン**（行が無ければコードの値／数量無制限）で、D1 が読めなければコードの価格で売り続ける（fail-open）。カタログ定数を直接読むと、管理画面で変えた値が効かない経路が残る。

## Stripe 決済フロー（b86fa89 で統合）

1. カート (`CartView`) → Server Action `startCheckoutAction`（`src/lib/actions/checkout.ts`）
   - 認証必須（ゲスト購入なし）。金額はクライアント申告を信用せず、slug+ml から**実勢カタログ**（`getLiveSkuMap`）で引き直す。
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
| `charge.refunded` | **ダッシュボードから返金したとき** DB へ同期（全額・一部とも金額を記録。一部なら在庫の確認を ops 通知） |
| `charge.dispute.created` | チャージバックを ops 通知（自動対応は不可、人が期限内に対応する） |

500 を返して Stripe に再送させるのは「注文確定の DB 失敗」と「返金同期の DB 失敗」だけ。
pending の掃除失敗はログのみ（入金に影響しないため）。

### Workers 上の Stripe（`src/lib/stripe.ts`）
- Node の `http` が無いため `Stripe.createFetchHttpClient()` を必ず使う。
- Webhook 署名検証は `constructEventAsync` + `createSubtleCryptoProvider()`（Web Crypto）。同期版 `constructEvent` は動かない。
- Webhook では **生ボディ（`request.text()`）のまま検証**。先に JSON パースすると署名不一致になる。
- JPY の `unit_amount` は円の整数をそのまま渡す（×100 しない）。

## 在庫と価格

- SKU（銘柄 × 容量）ごとに D1 で持つ。**在庫は `inventory`、価格は `product_price` と表を分ける**（`src/db/price-schema.ts` のコメント参照）。「蔵に何本あるか」は staff が棚卸しのたびに動かし、「いくらで売るか」は owner しか動かさない — 1 表にまとめると、価格だけ直したいのに行ができて在庫 0 の管理対象になり、その場で完売する事故が起きる。在庫のロジックは `src/lib/inventory.ts`、重ね合わせは `src/lib/catalog.ts`。
- 管理画面は `/admin/products`（旧 `/admin/inventory` はリダイレクト）。**価格の編集は owner のみ**、在庫は staff 以上。
- **在庫がしきい値をまたいだ瞬間だけ運用へ通知する**（`commitStock` の戻り値 → `formatStockWarnings` → `alertOps`）。毎回の在庫を送ると読まれなくなり、本当に仕込みが要るときに気づけない。通知の失敗で決済は止めない。
- **オプトイン方式**: 行がある SKU だけが管理対象。行が無い SKU は数量無制限で売れる。全 SKU に 0 を入れるとデプロイした瞬間に販売が止まるため、初期データは入れない。蔵で数え終わった SKU から `/admin/products` で管理を開始する。
- `low_stock_threshold` は**売り止めではなく報せるための値**。販売可能数が 0 は「完売」で「僅少」ではない（両方に出すと、仕込むべきものがアラートに埋もれる）。
- 静的書き出しのページ（一覧・商品ページ・カート）は `/api/catalog` から価格と完売をハイドレーション後に取り直す。**卸価格はこのエンドポイントに載せない**（誰でも叩ける）。実在庫もそのままは返さず、カート 1 行の上限（`MAX_QTY_PER_LINE`）で頭打ちにする。カートの合計は実勢価格で計算する — しないと表示額と請求額がずれる。
- カタログの `soldOut` フラグは在庫数とは独立した「販売停止」スイッチとして残る。
- **引き当ての流れ**: 決済開始で `reserved += qty` → 入金確定で `onHand -= qty; reserved -= qty` → 期限切れ・決済失敗・Session 生成失敗で `reserved -= qty`。決済ページに滞在している数分を押さえないと、同じ最後の 1 本を複数人が買えてしまう（「確定時に減らす」だけでは足りない）。
- 売り越さないことを担保しているのは `UPDATE … WHERE on_hand - reserved >= qty` という **1 文の原子性**。D1 に対話的トランザクションは無いので、複数明細で途中が足りなければ、それまでに積んだ分を戻す（補償）。
- `commitStock` は**冪等ではない**。Webhook からは「pending → confirmed に実際に更新できた初回だけ」呼ぶこと。
- 未発送のまま返金すると `onHand` に自動で戻る（`hasLeftTheKura` で判定）。発送後は戻さない — 品物が手元に無いため、返品を受け取ってから管理画面で足す。**部分返金では戻さない**（金額からはどの品を何本引き取ったか分からない）。
- **管理画面から手でステータスを動かしたときも辻褄を合わせる**（`adminUpdateOrderAction`）: `pending → confirmed` で確定、`→ cancelled` は pending なら解放・入金済み未発送なら戻し、発送後は何もしない。Webhook の自動経路だけ見ていると手動操作の分がずれる。
- Checkout Session には `expires_at` を 30 分（Stripe の下限）で入れている。既定の 24 時間のままだと、放棄された決済がまる 1 日ぶん在庫を押さえる。「戻る」で帰ってきた場合は `releaseAbandonedCheckoutAction` が期限切れを待たずに解放する（自分の pending 注文だけが対象）。
- 在庫のテストは **node:sqlite のインメモリ DB に drizzle の実 SQL を流す**（`src/lib/__tests__/inventory.test.ts`）。スタブで戻り値を作ると、肝心の WHERE 句を検証したことにならない。`node:sqlite` の型は `@types/node@20` に無いので `src/types/node-sqlite.d.ts` で補っている。

## 注文の顧客向け機能

- `/account/orders/[orderRef]` が注文詳細、`/account/orders/[orderRef]/receipt` が領収書。
- **注文の取得は必ず userId でも絞る**（`getMyOrderByRefAction`）。orderRef は推測しにくいだけで秘密ではないので、番号だけで引くと他人の注文が見える。
- 領収書は PDF を生成せず、印刷（ブラウザの「PDF として保存」）に最適化したページとして出す。電子発行のため収入印紙は不要。適格請求書の登録番号は `INVOICE_REGISTRATION_NUMBER` が null のあいだ行ごと出さない。**宛名は `orders.receipt_addressee` に保存**でき（未指定なら登録名）、金額には影響しない。
- **返金は全額・一部の両方を扱う**。`orders.refunded_amount` が累計額で、`status = "refunded"` は**全額返金のときだけ**付く（一部返金した注文は進行中のままで発送は続く）。判定は `refundStateOf()` に寄せる。冪等性は「返金前の累計」を WHERE と Stripe の idempotencyKey に入れて担保する。領収書は差引領収額を出す — 返した分まで「上記正に領収いたしました」と書くと事実と食い違う。
- **キャンセルは「依頼」であって実行ではない**。`requestOrderCancellationAction` は発送前（confirmed / preparing）に `cancel_requested_at` を刻んで ops へ通知するだけ。返金の実行は従来どおり owner だけが `adminRefundOrderAction` から行う（お客様の操作でお金が動く経路は作らない）。
- 注文ステータスの表示は `OrderStatusPill`（`Record<OrderStatus, …>` なので新ステータス追加時に型で漏れが出る）と `OrderTimeline`（cancelled / refunded は進行段階ではないので専用表示）。

## 管理画面

- ナビと暗色ヘッダーは `AdminChrome`（`AdminHeader` / `AdminNav` / `AdminForbidden` / `AdminFooterBar`）に集約。各ページで行き来のリンクを書かない。
- `/admin` はダッシュボード（売上・要対応・在庫アラート・直近の注文）。期間の区切りは **`jstDayStart` / `jstMonthStart`** を使う（UTC で切ると JST 09:00 で日が変わり、朝の売上が前日に混ざる）。
- 注文一覧は**期間の絞り込みと CSV 書き出しが同じ条件で動く**。画面で絞ったのに CSV が全件出ると、会計に渡す前に突き合わせが要る。期間は SQL 側で絞ること（取得後に捨てると上限 200 件が期間外で埋まる）。
- **CSV は `src/lib/csv.ts` の `toCsv()` を通す。** `=`・`+`・`-`・`@` で始まるセルを表計算ソフトが数式として実行するため無害化し、Excel が UTF-8 と判定できるよう BOM を付ける。素朴な join で書くとどちらも落ちる。
- 納品書は `/admin/orders/[orderRef]/packing-slip`。領収書と役割が違い、**金額は出すが「領収いたしました」とは書かない**（未入金の注文にも同梱しうる）。送り状は配送業者のシステムが発行するものでないと受け付けられないので作らない。
- `/admin/customers` は法人（取扱店）と個人でタブが分かれる。個人側の注文集計は SQL 側で行う。
- 注文ステータスの日本語ラベルは `src/data/fujisan-orders.ts` が唯一の出どころ（管理画面と顧客向けで言葉が割れていた）。
- `/admin/team` は登録済みメンバーに加えて**招待中の一覧**を出す。招待は 14 日で失効し、期限切れも消さずに見せる（黙って消えると、届いていないのか失効したのか区別できない）。

## レート制限

- **カウンタは 2 つあり、守る面が違う**（`src/db/rate-limit-schema.ts`）。片方だけでは迂回される。
  1. `action_rate_limit` — Server Action 用（`src/lib/rate-limit.ts` の `consumeRateLimit`）。ログイン・登録・再設定・認証メール再送は Server Action から `auth.api.*` を**直接**呼ぶため、Better Auth の `rateLimit` は通らない。
  2. `rate_limit` — Better Auth 用（`src/lib/auth.ts` の `rateLimit`）。`/api/auth/*` は UI を経由せず HTTP で直接叩けるので、こちらを塞がないと上の制限を迂回できる。**列の構成は Better Auth が決めている**ので変えないこと。
- **`storage: "database"` が必須**。既定の `"memory"` はアイソレート内の Map で、Workers では回数を共有できず実質機能しない。`enabled` も既定（`NODE_ENV === "production"` 頼み）ではなく明示する — 黙って無効になるのがいちばん困る。
- `advanced.ipAddress.ipAddressHeaders` に `cf-connecting-ip` を入れておく。**IP が取れないと Better Auth はレート制限を丸ごと諦める**。自前側も同じ優先順（CF ヘッダ → XFF）で、XFF はクライアントが詐称できるため後ろに置く。
- 数え落とさないことを担保しているのは **UPSERT 1 文**（`CASE WHEN expires_at <= now THEN 1 ELSE count + 1 END`）。在庫と同じで、読んでから書くと同時アクセスで取りこぼす。
- **DB が落ちているときは通す**（`ok: true`）。レート制限は濫用を遅くする仕組みで、認証の可否を決めるものではない。D1 の不調でログイン不能にしない。
- **自前側は生 IP を保存しない**（SHA-256 の先頭16文字）。一方 **Better Auth は key に生 IP をそのまま入れ、行を自分では消さない**。ハッシュに差し替える口は無い（`getIp` が IP 形式を検証するので、ハッシュを渡すとレート制限ごと無効になる）。そのため `sweepRateLimitCounters()` が 1 時間より古い行を消す。**この掃除がプライバシーポリシーの「最長 1 時間で削除します」を担保している**ので、消すのをやめるならポリシーも直すこと。掃除は Server Action と `/api/auth/*` の両方から間引いて走らせる（HTTP だけ叩かれる場合に走らなくなるため）。
- お問い合わせの連投制限だけは別方式で、`contact_message` の行数を IP ハッシュで数えている（受領そのものが記録として要るため。ここを統合しようとしないこと）。
- 入力の形式チェックは**カウンタを消費する前**に行う。無害な不正入力で枠を食わせられると、攻撃側が正規の利用者を締め出せる。

## 取扱店（BtoB）の承認

- **卸価格の表示条件は `user.role === "business"` ではなく `trade_account.status === "approved"`**（`src/lib/trade.ts` の `canSeeWholesalePricing`）。登録は自己申告なので role だけを条件にすると誰でも卸価格を見られる。`WholesalePriceList` / `TradeAccessBand` / `/account` はすべてこの判定を通す。
- **行が無い＝未承認**。この機能より前に登録した法人には行が無いので、`/admin/customers` から承認すると upsert で行ができる（`adminReviewTradeAccountAction`）。ここを「行が無ければ許可」にすると、旧アカウントに素通りされる。
- 審査状況の取得に失敗したときは**見せない側に倒す**。一度表示した価格は取り消せない。
- 業態は `src/data/fujisan-trade.ts` が唯一の出どころ（クライアントからも読めるようサーバー依存を持たせない）。**酒類販売業免許番号を必須にするのは転売する業態（`retailer` / `wholesaler`）だけ** — 飲食店・宿泊施設の店内提供は「販売」ではないので免許が要らない。実態に合わない項目を必須にすると、正しい相手を弾いて嘘の入力を誘発する。
- 登録（`registerBusinessAction`）は **サインアップ成功後に pending 行を作る**。行の作成やメールに失敗しても登録は取り消さない（取りこぼしても未承認扱いなので価格は漏れない）。
- 見送りの理由（`review_note`）は**そのままお客様へのメールに載る**。管理画面の入力欄にもその旨を書いてある。
- `"use server"` のファイルは async 関数以外を export できないため、`TRADE_REVIEW_NOTE_MAX` のような定数は `src/data/fujisan-trade.ts` 側に置く（Server Action と同居させるとビルドが落ちる）。

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
  2. 決済開始前のチェックボックス（`CartView`）。**クライアントの state だけに頼らず、`startCheckoutAction` が `ageConfirmed !== true` を `age` エラーで弾く**（Server Action は直接呼べるため）。以前ここにあった `checkoutSchema.ageConfirmed`（Zod）は自前の住所フォーム廃止と同時に消えている。
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

- **`drizzle-kit generate` は使える**（以前は journal がずれていて禁止だった）。`meta/_journal.json` が `drizzle/` の SQL 15 本と 1 対 1 で対応し、最後の `0014_snapshot.json` が現在のスキーマ。`0006`〜`0013` は手書きで足された経緯から**中間スナップショットが無い**が、`generate` は最後のスナップショットしか読まないので支障はない（`drizzle-kit up` / `drop` は使わないこと）。このズレは `src/db/__tests__/migrations.test.ts` が見張っていて、SQL を足して journal に載せ忘れると落ちる。**SQL を手で足したときは journal にも追記する。**
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

コード側の積み残しは [`docs/TODO.md`](./docs/TODO.md)、環境を触らないと終わらない
作業（免許番号・Stripe の Webhook・本番マイグレーション・Resend のドメイン認証・
secret）は [`SETUP.md`](./SETUP.md) にまとめてある。

**本番 Worker は main ではなく未マージのブランチで動いている**期間があり、
在庫の実装が 2 系統に分かれていた。`0012` で `product_price` + `inventory` に
一本化済みだが、本番へ反映するまではこのズレが残る（SETUP.md の冒頭を参照）。

## スキル参照

Stripe 作業は `.claude/skills/stripe-*` を先に読むこと。

**`.claude/skills/design-system` は別アプリ（削除済みの command-center）の配色を書いたもので、このサイトには当てはまらない。** FUJISAN の色・余白・タイポグラフィの出どころは `src/app/globals.css` の `@theme inline`（Tailwind v4）で、和紙色（paper 系）と藍（#0B1A2E）・金（#C9A84C）・朱（#8B1A1A）が基調。
