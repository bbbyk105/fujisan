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
- **本番ドメインは `sakefujisan.com`**（`wrangler.jsonc` の `routes` に custom domain で登録）。www と workers.dev は `next.config.ts` の redirects で apex へ 308 — ただし workers.dev の `/api/stripe/webhook` だけは残す（Stripe はリダイレクトを追わない）。ドメインの出どころはコードでは `SITE_URL`（`src/lib/seo.ts`）、実行時は `BETTER_AUTH_URL`。連絡先とメールの送信元は `info@sakefujisan.com`（受信は Cloudflare Email Routing で Gmail へ転送）。
- **DB**: Cloudflare D1 (SQLite) + Drizzle ORM。スキーマは `src/db/`（auth / orders / invite / contact / inventory / price / trade / rate-limit に分割、`schema.ts` が re-export）。マイグレーション SQL は `drizzle/`（`wrangler d1 migrations apply fujisan-db [--local|--remote]` で適用）。D1 バインディングはリクエスト時にしか取れないため、必ず `getDb()`（`src/db/index.ts`）経由で毎回取得する。
- **認証**: Better Auth + Drizzle アダプタ。メール認証必須・Google ログインは env 設定時のみ有効。`user.role` は `personal | business`（法人は companyName 等の追加フィールドあり。**`business` は「法人として登録した」だけで、卸価格の可否は `trade_account` の審査で決まる** — 下記「取扱店（BtoB）の承認」）。管理者は `owner | staff` の2階層（`src/lib/admin.ts`。**`ADMIN_EMAILS` env は必須**（未設定だと env owner は 0 人。ソースにフォールバックのアドレスは置かない）、メール招待 `teamInvite` → 登録時に `databaseHooks.user.create.after` でロール付与）。**招待は 14 日で失効**する — 期限が無いと、退職者向けや宛先を間違えた古い招待メールのアドレスが後から登録された際に、意図せず管理権限が付く。招待し直しでは `createdAt` も打ち直す。
- **パスワード欄は `PasswordInput`（`src/components/fujisan/auth/PasswordInput.tsx`）を使う**。右端の目のボタンで表示／非表示を切り替える。素の `<input type="password">` を新たに書かないこと（ログイン・登録・再設定・変更の 7 か所はすべてこれ）。
- **メールアドレスの変更は新旧どちらの承認も要る**（`user.changeEmail`）。まず**変更前**のアドレスへ承認リンクを送り、それを踏むと Better Auth が新アドレス宛にも確認メールを出し、そちらを踏んで初めて入れ替わる。宛先を `newEmail` にすると、セッションを奪った側が現アドレスの持ち主に知らせないままアカウントを移せる。設定の要点は `src/lib/__tests__/auth-options.test.ts` で固定している。
- **登録済みのアドレスで新規登録されても、Better Auth は何も送らない**。`requireEmailVerification` が有効だと、登録の有無を漏らさないよう成功と同じ返事（`token: null`）だけを返す。認証済みのアカウントには「確認メールを再送」も黙って成功するだけで送らない。画面は「送信しました」なのに何も届かないので、`emailAndPassword.onExistingUserSignUp` でアドレスの持ち主にだけ「登録済みです（ログイン・パスワード再設定のリンク）」を送っている。**このフックは例外を投げないこと** — 投げると登録済みのときだけ登録がエラーになり、登録の有無が外から分かる。
- **認証メール（確認・パスワード再設定・メール変更の承認・登録済みの案内）は `src/lib/emails/auth-emails.ts` で組む**。HTML（ボタン）とテキストの 2 版で、サイト名の名乗り・有効期限・「心当たりが無い場合」・販売者表記を必ずそろえる。以前はトークン付きの長い URL をテキストに貼っただけで、フィッシングと見分けがつかなかった。**宛名（利用者が入れた名前）は入れない** — 名前は誰でも自由に入れられ、確認メールは本人確認の前に届くので、他人のアドレスで登録するだけで正規のメールの冒頭に好きな文面を載せられる。色は 6 桁の hex で書く（`#RRGGBBAA` は Outlook などで捨てられ、濃紺の上の販売者表記が黒文字になる）。登録済みのアドレスへの案内（`onExistingUserSignUp`）も同じ組みで送る。確認メールは会員登録と**メール変更の最後（新アドレス宛）**の両方で呼ばれるので、トークンの `requestType` を読んで文面を分けている（新アドレス宛に「会員登録」と書くと詐欺に見える）。
- **確認リンクの戻り先は `/email-verified`**（`emailVerifiedCallbackURL`、`src/lib/auth-shared.ts`）。`autoSignInAfterVerification: false` で、確認後は「確認しました」を見せてからログインし直してもらう（転送されたメールを開いた人にセッションを渡さない）。期限切れ・壊れたリンクは Better Auth が `?error=` を付けて同じページへ戻すので、そこで送り直しへ案内する。リンクの期限は `AUTH_LINK_TTL_SEC`（1 時間）で、Better Auth の設定とメール・画面の文言が同じ定数を読む。
- **Server Actions 中心**: ミューテーションは `src/lib/actions/`（checkout / orders / account / contact / admin-*）。API Route は Better Auth の `/api/auth/[...all]` と Stripe Webhook のみ。middleware は無く、ガードは各ページ/アクション内で `getSession()` / `getEffectiveAdminRole()`。
- **商品カタログはコード、価格と在庫は D1 の上書き**: 銘柄・容量・ストーリー・画像は `src/data/fujisan-products.ts`。そこへ D1 の `product_price`（価格の上書き）と `inventory`（在庫）を重ねたものが**実勢カタログ** `src/lib/catalog.ts` で、**決済・管理画面・卸価格表はこれを正とする**。どちらの表も**オプトイン**（行が無ければコードの値／数量無制限）で、D1 が読めなければコードの価格で売り続ける（fail-open）。カタログ定数を直接読むと、管理画面で変えた値が効かない経路が残る。

## Stripe 決済フロー（b86fa89 で統合）

1. カート (`CartView`) → Server Action `startCheckoutAction`（`src/lib/actions/checkout.ts`）
   - ログインまたはゲスト（メールアドレスのみ。下の「ゲスト購入」）。金額はクライアント申告を信用せず、slug+ml から**実勢カタログ**（`getLiveSkuMap`）で引き直す。
   - 注文を `pending` で D1 に保存（**住所は空文字で開始**）→ Checkout Session 作成 → Stripe の URL を返す。
   - お届け先・電話は **Stripe 決済ページで収集**（`shipping_address_collection: JP のみ`）。自前住所フォームは廃止済み。
   - Session 作成失敗時は pending 注文を削除して掃除する。
2. Webhook `/api/stripe/webhook` が **確定の正**（success ページは表示のみ）。
   - `checkout.session.completed` と `async_payment_succeeded`（コンビニ等）を処理。
   - 冪等: `pending → confirmed` を WHERE status='pending' 付き UPDATE で原子的に行い、更新できた初回だけメール送信。
   - 住所・電話は `sessions.retrieve` で取り直して注文に書き戻す。
   - **メール失敗は 500 にしない**（ログのみ）。500 を返すのは DB 確定失敗時だけ（Stripe が再送）。
3. `/checkout/success` は `force-dynamic`。session_id で Stripe を参照し、`payment_status !== "paid"` なら「お支払い手続き中」を表示。マウント時にカートを空にする。

### ゲスト購入とログイン後の戻り先

- ログインしていなくても、カートでメールアドレスを入れれば購入できる。注文は `user_id` が null で、**お届け先と電話番号は Stripe の決済ページで必須**（自前の住所フォームは作らない）。メールアドレスをカートで聞くのは、決済前に `receipt_email` を渡さないと領収書の宛先を指定できないから。
- **20 歳以上の確認はゲストも省けない**。`startCheckoutAction` は UI と同じくサーバーで確かめる。
- ログインなしで注文を作り在庫を 30 分押さえられるので、IP ごとに回数を絞り（`guestCheckout`）、Cloudflare Turnstile でボットを止める。回数制限だけでは防げない（全在庫を 1 回で押さえられるので、1 時間に 2 回で足りる）。入力の検証、Turnstile、回数制限の順に見る。
- Turnstile はサイトキー（`src/data/fujisan-turnstile.ts`、公開してよい値）と秘密鍵（`TURNSTILE_SECRET_KEY`）の**両方がそろったときだけ**動く。Cloudflare の不調や秘密鍵の誤りでは通して `alertOps` で知らせる（`verifyTurnstile`）。**通す判断は Cloudflare からの応答か接続の失敗だけで行うこと** — 利用者が送る値で例外になって通ると、判定を素通りできる（文字列でないトークンを最初に弾いているのはこのため）。トークンは 1 回しか使えないので、決済の開始に失敗したら `key` を変えてウィジェットを作り直す。ゲストのメールアドレスを入れるまで読み込まない（ログインするお客様の情報を Cloudflare へ送らない）。回数は判定を通ってから数える — 落ちる要求に枠を使わせると、ボットが同じ IP のお客様を締め出せる。ウィジェット自体が読めないとトークンが無いのでゲストは止まり、ログインへ案内する（トークン無しを通すと判定の意味が無い）。
- ゲストのメールアドレスは確認欄と照合する（`guestEmailConfirmIssue`）。打ち間違えると、宛名と住所の入った確定メールが他人へ届く。
- ゲストは本人を確かめられないので、`releaseAbandonedCheckoutAction` は注文番号だけでは動かない。決済ページから戻る URL に注文の id（推測できない UUID）を `key` として付け、これを「決済を始めたブラウザ」の鍵にする。
- **「戻る」で注文を消す前に `checkout.sessions.expire` で決済ページを閉じる**（ゲストも会員も）。Session は期限まで有効で、閉じないと注文の無い支払いができてしまう。閉じられないときや id が無いときは消さずに Webhook へ任せる（期限切れなら消す）。そのために決済の開始で `stripe_session_id` を控えている。ブラウザの「戻る」は `cancel_url` を通らないので、`pageshow` で同じ解放を行う。解放のあとは `refreshLiveCatalog` で在庫を取り直す。
- `user_id` が null の注文にはログインできるアカウントが無い（ゲストと退会者）。メールは `noAccount` を渡して `/account` へ案内しない。9 年後の匿名化も同じ条件で対象になるので、プライバシーポリシーにもゲストを書いてある。
- カートのログイン・新規登録のリンクは `redirect` に `CHECKOUT_RESUME_PATH` を付ける。20 歳以上の確認を `sessionStorage` に残して移動し（`src/lib/cart/checkout-resume.ts`）、戻ったらそのまま決済を始める。確認が残っていなければカートを見せるだけで、自動では進まない（確認メールを別のタブで開いた場合など）。ログイン画面の案内が「そのまま」と言い切らないのはこのため。
- **`redirect` は必ず `safeRedirectPath` を通し、URL に付けるときは `withRedirect` を使う（未ログインのページから飛ばすときは `loginPathFor`）。** URL から読む値なので、そのまま遷移すると外部サイトや `javascript:` へ飛ばせる。正規化で外へ出る値（`/.//evil.example`）もあるので、自前で書かないこと。
- カートの分岐は `isPending` ではなく `sessionChecked` で見る。Better Auth はタブへ戻るたびにセッションを取り直し、未ログインだとそのあいだ `isPending` が true に戻るので、ゲストの入力欄が作り直される。

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

### Stripe の領収書

領収書は Stripe が出す（2026-11-04 本人）。自前では書面を組まない。宛名の指定もやめた（`orders.receipt_addressee` は使っていない列として残っている）。

- `startCheckoutAction` が `payment_intent_data.receipt_email` と、全ての行に消費税 10%（内税）の `tax_rates` を渡す。領収書の品名・税率は Checkout に渡した内容がそのまま載る。内税なので請求額は変わらない。
- 税率の id は `getConsumptionTaxRateId()` が決済のたびに探し、無ければ作る。**環境変数にもメモリにも持たないこと** — 本番キーへの切り替えやアーカイブで古い id が残ると、全ての決済が止まる。取得に失敗しても決済は止めず、`alertOps` で知らせる。
- Stripe は消費税を行ごとに端数処理するので、領収書の税額が合計からの計算と 1 円ずれることがある（`docs/TODO.md`）。
- 注文番号は領収書に載らない（品名の明細があると支払いの説明は出ない。2026-11-04 に実物で確認）。支払いの説明には入れてあるので、Stripe の管理画面では `FJ-…` で探せる。
- `/account/orders/[orderRef]/receipt` は Stripe の領収書へ転送するだけのページ。リンクは 30 日で切れるので保存せず、`getMyOrderReceiptUrlAction` が開くたびに取り直す（userId でも絞る）。
- 発行者名・問い合わせ先・登録番号は Stripe のダッシュボードの設定で決まる（`SETUP.md` のタスク4-2）。発行者名は「法人名 (屋号)」の欄で、空だと明細書の表記が出る。テスト環境の領収書に登録番号を出すには、テスト環境にも `jp_trn` の税務 ID が要る。
- Stripe の領収書には返金日や返金分の税率が載らない。1 万円以上の一部返金で適格返還請求書を求められたら個別に対応する（`docs/TODO.md`）。

### Workers 上の Stripe（`src/lib/stripe.ts`）
- Node の `http` が無いため `Stripe.createFetchHttpClient()` を必ず使う。
- Webhook 署名検証は `constructEventAsync` + `createSubtleCryptoProvider()`（Web Crypto）。同期版 `constructEvent` は動かない。
- Webhook では **生ボディ（`request.text()`）のまま検証**。先に JSON パースすると署名不一致になる。
- JPY の `unit_amount` は円の整数をそのまま渡す（×100 しない）。

## 在庫と価格

- SKU（銘柄 × 容量）ごとに D1 で持つ。**在庫は `inventory`、価格は `product_price` と表を分ける**（`src/db/price-schema.ts` のコメント参照）。「蔵に何本あるか」は staff が棚卸しのたびに動かし、「いくらで売るか」は owner しか動かさない — 1 表にまとめると、価格だけ直したいのに行ができて在庫 0 の管理対象になり、その場で完売する事故が起きる。在庫のロジックは `src/lib/inventory.ts`、重ね合わせは `src/lib/catalog.ts`。
- 管理画面は `/admin/products`（旧 `/admin/inventory` はリダイレクト）。**価格の編集は owner のみ**、在庫は staff 以上。
- **在庫がしきい値をまたいだ瞬間だけ運用へ通知する**（`commitStock` の戻り値 → `formatStockWarnings` → `alertOps`）。毎回の在庫を送ると読まれなくなり、本当に仕込みが要るときに気づけない。通知の失敗で決済は止めない。判定は実在庫（`on_hand`）の動きで見る — `available` は引き当ての時点で減り、確定では変わらないので、確定の前後で比べても何も検出できない。
- **オプトイン方式**: 行がある SKU だけが管理対象。行が無い SKU は数量無制限で売れる。全 SKU に 0 を入れるとデプロイした瞬間に販売が止まるため、初期データは入れない。蔵で数え終わった SKU から `/admin/products` で管理を開始する。
- `low_stock_threshold` は**売り止めではなく報せるための値**。販売可能数が 0 は「完売」で「僅少」ではない（両方に出すと、仕込むべきものがアラートに埋もれる）。
- 静的書き出しのページ（一覧・商品ページ・カート）は `/api/catalog` から価格と完売をハイドレーション後に取り直す。**卸価格はこのエンドポイントに載せない**（誰でも叩ける）。実在庫もそのままは返さず、カート 1 行の上限（`MAX_QTY_PER_LINE`）で頭打ちにする。カートの合計は実勢価格で計算する — しないと表示額と請求額がずれる。
- カタログの `soldOut` フラグは在庫数とは独立した「販売停止」スイッチとして残る。
- **引き当ての流れ**: 決済開始で `reserved += qty` → 入金確定で `onHand -= qty; reserved -= qty` → 期限切れ・決済失敗・Session 生成失敗で `reserved -= qty`。決済ページに滞在している数分を押さえないと、同じ最後の 1 本を複数人が買えてしまう（「確定時に減らす」だけでは足りない）。
- 売り越さないことを担保しているのは `UPDATE … WHERE on_hand - reserved >= qty` という **1 文の原子性**。D1 に対話的トランザクションは無いので、複数明細で途中が足りなければ、それまでに積んだ分を戻す（補償）。
- `commitStock` は**冪等ではない**。注文の在庫を動かすときは `applyStockMove` を通す。
- **注文の在庫は `orders.stock_state` で持つ。** `reserved`（引き当て中）・`committed`（引き落とし済みで蔵にある）・`shipped`（蔵を出た）・`none`（何も残っていない）の 4 つ。`status` から推測しないこと — 手で動かせるので、pending は引き当て中のことも、確定を手で戻した引き落とし済みのこともある。どのステータスでどの状態になるかは `stockStateFor` に書いてある。
- **`status` と `stock_state` は同じ UPDATE で動かし、WHERE に読んだときの `stock_state` を入れ、更新できたときだけ `applyStockMove`（`src/lib/order-stock.ts`）で本数を動かす。** 2 文に分けると、同時に走ったときに片方だけ動いて食い違う。pending の注文を消す経路は、消せた行だけが本数を動かす（DELETE が確保を兼ねる）。決済の開始で引き当てて、Stripe へ送り出す前に失敗して戻す `startCheckoutAction` だけは、注文がまだ誰にも見えていないので直接呼ぶ。
- 全額返金や取消で戻るのは蔵にある分だけ。戻し終えた注文は `none` なので動かない。**`shipped` は戻らない** — 発送済みを押し間違えたのか品物がお客様の手元にあるのかは操作から分からず、自動で足して実数より多くなると売り越すので、戻っていたら人が数えて `/admin/products` で足す（発送済みから戻したときは `alertOps` で知らせる）。**部分返金では戻さない**（金額からはどの品を何本引き取ったか分からない）。
- `applyStockMove` は例外を投げず、失敗したら `alertOps` で知らせる。D1 に対話的トランザクションが無く、複数行の途中で落ちるとどこまで動いたか分からないので、やり直さずに人が数える。
- **`refunded` は終端**で、管理画面からほかのステータスへ動かせない。返金の操作を通さずに `refunded` へ動かすこともできない。
- **管理画面から手でステータスを動かしたときも辻褄を合わせる**（`adminUpdateOrderAction`）。Webhook の自動経路だけ見ていると手動操作の分がずれる。取り消した注文を確定へ戻すと引き落とし直しになり、在庫が足りなければ保存を止める（`stock`）。更新は読んだときのステータスと在庫の状態を WHERE に入れて行い、開いた画面の値（`expectedStatus`）とも比べる。ずれていたら `conflict` を返す — 古い画面や Webhook と重なったときに、返金済みなどを上書きしない。ステータスが変わらない保存（追跡番号だけなど）では在庫に触らない。
- Checkout Session には `expires_at` を 30 分（Stripe の下限）で入れている。既定の 24 時間のままだと、放棄された決済がまる 1 日ぶん在庫を押さえる。「戻る」で帰ってきた場合は `releaseAbandonedCheckoutAction` が期限切れを待たずに解放する（自分の pending 注文だけが対象）。
- 在庫のテストは **node:sqlite のインメモリ DB に drizzle の実 SQL を流す**（`src/lib/__tests__/inventory.test.ts`）。スタブで戻り値を作ると、肝心の WHERE 句を検証したことにならない。`node:sqlite` の型は `@types/node@20` に無いので `src/types/node-sqlite.d.ts` で補っている。

## 注文の顧客向け機能

- `/account` は **`?tab=orders|profile|security` のタブ**（既定は注文）。以前は 1 枚に縦に積んでいて、注文が増えると登録情報とセキュリティが埋もれた。表示は `AccountView`、取得・認可はページ側。
- `/account/orders/[orderRef]` が注文詳細、`/account/orders/[orderRef]/receipt` が Stripe の領収書への転送。
- **退会しても注文は消さない**。`orders.user_id` は `ON DELETE SET NULL`（`0015`）で、紐づけだけが外れて注文の金額・宛先は残る。領収書の写しの保存が要り、プライバシーポリシーでも保存すると約束しているため。管理画面の注文は `user_id` が null でも `customer_*` の列で表示できるので、`user` と JOIN しないこと。領収書は決済時のメールに残ることを、退会画面で案内している。注文日から 9 年（`ORDER_PII_RETENTION_YEARS`）を過ぎた退会者の注文は、氏名・連絡先・住所と Stripe の ID を消し、金額と品目は残す。お問い合わせは 3 年（`CONTACT_RETENTION_YEARS`）で消す（`sweepExpiredPersonalData`。Cron ではなく `/admin` を開いたときに走る）。**プライバシーポリシーの保有期間がこの 2 つを読んでいる**ので、変えるなら公開の約束も変わる。`user_id` が null の注文はゲスト購入も同じで、9 年後の匿名化の対象になり、メールは `noAccount` で `/account` へ案内しない。
- **注文の取得は必ず userId でも絞る**（`getMyOrderByRefAction`）。orderRef は推測しにくいだけで秘密ではないので、番号だけで引くと他人の注文が見える。
- **返金は全額・一部の両方を扱う**。`orders.refunded_amount` が累計額で、`status = "refunded"` は**全額返金のときだけ**付く（一部返金ではステータスは動かない。案内で「このまま発送」と書けるのは `willStillShip` が真の注文だけ）。判定は `refundStateOf()` に寄せる。冪等性は「返金前の累計」を WHERE と Stripe の idempotencyKey に入れて担保する。Webhook も同じで、同時に届いて先を越されたら読み直す（読み直さないと、今回の額を読み違えたまま返金メールを送る）。Webhook の `charge.refunds` は expand されないので、返金 id は `refunds.list` で引く。
- 返金できる注文は `isRefundable()` で判定する。入金後に取り消した注文や手で pending へ戻した注文も返金でき、未入金の注文は返金できない（`paid_at` で見分ける）。
- 確定を通らなかった入金（取り消した注文へのコンビニ払いや、開いたままの決済ページからの支払い）は、Webhook が入金日・PaymentIntent・お届け先を記録して `alertOps` で知らせる。ステータスは変えない。注文が見つからない入金（決済ページから戻って注文を消したあとの支払い）も知らせる。
- **キャンセルは「依頼」であって実行ではない**。`requestOrderCancellationAction` は発送前（confirmed / preparing）に `cancel_requested_at` を刻んで ops へ通知するだけ。返金の実行は従来どおり owner だけが `adminRefundOrderAction` から行う（お客様の操作でお金が動く経路は作らない）。
- 注文ステータスの表示は `OrderStatusPill`（`Record<OrderStatus, …>` なので新ステータス追加時に型で漏れが出る）と `OrderTimeline`（cancelled / refunded は進行段階ではないので専用表示）。

## 管理画面

- ナビと暗色ヘッダーは `AdminChrome`（`AdminHeader` / `AdminNav` / `AdminSubNav` / `AdminForbidden` / `AdminFooterBar`）に集約。各ページで行き来のリンクを書かない。画面の中の絞り込みタブは `AdminSubNav`（下線だけで現在地を示す）を使い、枠付きのボタンを並べない。
- `/admin` はダッシュボード（売上・要対応・在庫アラート・直近の注文）。期間の区切りは **`jstDayStart` / `jstMonthStart`** を使う（UTC で切ると JST 09:00 で日が変わり、朝の売上が前日に混ざる）。
- 注文一覧は**期間の絞り込みと CSV 書き出しが同じ条件で動く**。画面で絞ったのに CSV が全件出ると、会計に渡す前に突き合わせが要る。期間は SQL 側で絞ること（取得後に捨てると上限 200 件が期間外で埋まる）。
- **CSV は `src/lib/csv.ts` の `toCsv()` を通す。** `=`・`+`・`-`・`@` で始まるセルを表計算ソフトが数式として実行するため無害化し、Excel が UTF-8 と判定できるよう BOM を付ける。素朴な join で書くとどちらも落ちる。
- 納品書は `/admin/orders/[orderRef]/packing-slip`。領収書と役割が違い、**金額は出すが「領収いたしました」とは書かない**（未入金の注文にも同梱しうる）。送り状は配送業者のシステムが発行するものでないと受け付けられないので作らない。
- `/admin/customers` は法人（取扱店）と個人でタブが分かれる。個人側の注文集計は SQL 側で行う。
- 注文一覧と CSV は、未払いで放棄された注文（pending かつ `reserved`）だけを隠す。手で pending へ戻した注文は在庫を引き落としてあるので残す。
- 注文ステータスの日本語ラベルは `src/data/fujisan-orders.ts` が唯一の出どころ（管理画面と顧客向けで言葉が割れていた）。
- **数字（KPI）は暗色のヘッダーに入れず、帯の下の和紙の面に大きく出す**（`AdminHeader` の `kpis`）。ヘッダーは見出し・権限・タブだけ。表の広いページ（注文・商品）は `AdminHeader wide` で本文の幅と揃える。
- ダッシュボードの表示は `AdminDashboardView`（データを受け取るだけ）。取得・認可は `src/app/admin/page.tsx`。直近の注文は `/admin/orders#order-<番号>` へ飛ぶ（`AdminOrderRow` に id を振ってある）。
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
- 管理画面の一覧（`/admin/contacts`）は既定で未対応・対応中だけを出し、対応済みは「すべて」（`?view=all`）で見る。本文は折りたたまない（対応するときは必ず読むので）。対応状況の保存は読んだときの状況を WHERE に入れ、先に変えられていたら `conflict` を返す（古い画面から保存すると対応者の記録が消える）。件数は上限で切られた一覧からではなく SQL で数える。
- **お客様が入力したアドレスの mailto は `mailtoHref`（`src/lib/mailto.ts`）で作る。** 入力の検証は `?` や `&` を通すので、`mailto:${email}` と書くと返信の下書きに BCC や本文を差し込める（HTML のエスケープでは防げない）。
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
- **法令情報の唯一の出どころ**: `src/data/fujisan-legal.ts`。未成年飲酒防止表示（`UNDERAGE_NOTICE_JP/EN`、フッター・商品ページ・特商法ページで参照）、送料 `SHIPPING_FEE`（一律1,100円 / 15,000円以上無料 — カート計算・全ページ表記がこの定数を参照）、特商法・酒類販売管理者標識。**未確定の値はダミー文字列で埋めず `null` にする**（`INVOICE_REGISTRATION_NUMBER`）。それらしい伏せ字は本物に見えたまま公開されうる。`npm run deploy` は predeploy で `scripts/check-legal-disclosure.mjs` を実行し、`src/data/` に伏せ字が残っていればデプロイを止める（dev / build / CI は止めない）。
- **通信販売酒類小売業免許の番号は掲示しない**（2026-11-04 本人の判断）。特商法ページの行、`LIQUOR_LICENCE`、predeploy の番号の検査は外した。
- 発送は日本国内のみ（Stripe の `allowed_countries: ["JP"]` と checkout の郵便番号7桁バリデーションで担保）。

## フォームの保存

- **保存は必ず「保存」ボタンで行う。** 選んだ瞬間・入力を離れた瞬間に保存する作りにしない（以前お問い合わせの対応状況がそうなっていて、選び間違えただけで「対応済み」になり一覧から消えた）。
- **保存していない変更があるときは、画面の移動に確認を挟む。** 各フォームは `useUnsavedChanges(dirty)`（`src/lib/unsaved-changes.ts`）で知らせるだけで、止めるのは layout に 1 つ置いた `UnsavedChangesGuard`。サイト内リンクは document の capture でクリックを受けて止め（`<Link onNavigate>` でも止められるが全リンクの差し替えになる）、タブを閉じる・再読み込みは `beforeunload`。
- `dirty` は「利用者が書き換えたか」で判定する。「保存ボタンを押せるか」と混ぜないこと（未管理の在庫行は常に「管理を開始」が押せるが、それを未保存扱いにすると画面から出られなくなる）。
- **ブラウザの「戻る」は止められない**（App Router では popstate を取り消せない）。
- 新しいフォームを足したら `useUnsavedChanges` も付ける。テストは `src/components/fujisan/__tests__/UnsavedChangesGuard.test.tsx`。

## 編集レイヤー（.fjs-ed）

**トップページ（`/`）と `/products`（コレクション）はデザインの参照元として凍結**し、
それ以外の全ページは `.fjs-ed` という編集レイヤーの上に組み直してある
（`src/app/globals.css` の EDITORIAL LAYER、`src/components/fujisan/editorial/`）。

- 共通 CSS は**すべて `.fjs-ed` 配下に閉じる**。`.fjs-ed` / `.ed-*` は凍結ページの
  マークアップに一つも現れないので、接頭辞を守る限り凍結ページの computed style は動かない。
- CSS は **`@layer components`** に置く。Tailwind v4 は `theme → base → components → utilities`
  の順なので、レイヤー外に書くと全 utility より強くなり、ページ側の `text-[10px]` /
  `min-h-[44px]` が黙って無視される。既定の文字色は `@layer base`。
  **フォーカス指定だけは例外**でレイヤー外に置く（globals.css 冒頭の共通指定と揃える）。
- ページの扉は `EditorialPageHeader`。**`FujisanInnerHero`（写真ヒーロー）は `/products` 専用**なので混ぜない。
  扉の `width` は本文の章（`EditorialSection`）と必ず揃える（左端がずれる）。
- 規約・ポリシーは `editorial/DocumentPage`、法定表示のような一覧は `EdDataList` で表に組む。
- **カードを作らない。** 情報は罫・番号・余白で整理する。金（`gold`）は「いま選ばれている」ことを
  示すときだけで、飾りには使わない。装飾の `→` / `↗`、大文字＋広いレタースペースの見出し、
  `― ○○ ―` の囲み、同じ内容を日英で二度言う組み方は入れないこと。
- 濃色面は `data-tone="dark"` を付けるだけでよい（`--ed-*` 変数が反転し、同じ `.ed-*` が使える）。

## 色

色は増やさないことで統一する。**`src/app/globals.css` の `@theme inline` にある
14 色以外をページに直書きしない**（藍 `indigo` / 和紙 `paper*` / 金 `gold` / 状態色）。
階調は別の色を足すのではなく不透明度（`text-indigo/62` など）で作る。
以前は同系統の紺が 6 つ・金が 4 つ散在していて、ページごとに色がずれていた。

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
- **トップの末尾に購入・お問い合わせへの入口（`FujisanGuide`）を置いた**（2026-09-24）。トップ本体は凍結のままだが、ここだけは「こだわり」（`FujisanDiscover`）と同じ組み方で足してある。**フッターは `FujisanExperience` の中ではなく `src/app/page.tsx` 側に置く**（セクションの中にあると、その後ろに何も足せない）。
- **`/stories` は削除済み**（2026-09-23）。物語の内容は `/craft/[slug]`（水・米・造り）に残る。トップの「造りを読む」導線と `FujisanDiscover` の一覧は `/craft/*` を指す。`/stories` へのリンクを新たに足さないこと。

## 落とし穴

- **`@testing-library/jest-dom` は入っていない**。`toHaveAttribute` などは使えないので、`getAttribute` と `textContent` で確かめる。
- **Better Auth はメールの送信失敗を握りつぶし、画面には「送信しました」を出す**（`runInBackgroundOrAwait` がログに落とすだけで 200 を返す）。本番で届かないときは `npx wrangler tail fujisan --format json` を流しながら 1 通送らせ、`Resend send failed: <status>` を読む（401 はキー、403 はドメイン未認証）。`wrangler secret list` は secret の有無しか見ないので、キーが有効かは分からない（2026-09-24 に無効なキーで全メールが止まっていた）。
- **`drizzle-kit generate` は使える**（以前は journal がずれていて禁止だった）。`meta/_journal.json` が `drizzle/` の SQL と 1 対 1 で対応し、最後のスナップショットが現在のスキーマ。**表を作り直す差分で出る `PRAGMA foreign_keys` は外す**（D1 はトランザクションの中で流すので効かない）。その表を参照する表があるときは `DROP TABLE` の巻き添えを先に確かめること。`0006`〜`0013` は手書きで足された経緯から**中間スナップショットが無い**が、`generate` は最後のスナップショットしか読まないので支障はない（`drizzle-kit up` / `drop` は使わないこと）。このズレは `src/db/__tests__/migrations.test.ts` が見張っていて、SQL を足して journal に載せ忘れると落ちる。**SQL を手で足したときは journal にも追記する。**
- **日付は必ず `src/lib/format-date.ts` のヘルパーで出す**。Workers は UTC で動くため `Intl.DateTimeFormat` に `timeZone: "Asia/Tokyo"` を指定しないと、JST 00:00〜09:00 の出来事が前日の日付になる（注文日や納品書の日付がずれる）。ローカルの OS が JST だと気づけない。
- **Next.js 16 の `error.js` は `reset` ではなく `unstable_retry`**。旧 API 名のままだと再試行ボタンが動かない。`global-error.js` も同じ。
- **`cloudflare-env.d.ts` は生成物で `.gitignore` 済み**。`prebuild` が `cf-typegen` を走らせるので `npm run build` は clone 直後でも通るが、エディタの型エラーを消すには一度 `npm run cf-typegen` が要る。
- **dev は `next dev --webpack`**（Turbopack ではない）。`initOpenNextCloudflareForDev()` により dev でも D1/env バインディングが `.dev.vars` から供給される。
- **`.dev.vars` が真の env ファイル**（BETTER_AUTH_SECRET / BETTER_AUTH_URL / ADMIN_EMAILS / RESEND_API_KEY / GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / TURNSTILE_SECRET_KEY）。本番は `wrangler secret put <NAME>`。`.env.example` は古いテンプレで一部実態と乖離あり。
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
作業（Stripe の Webhook・本番マイグレーション・Resend のドメイン認証・
secret）は [`SETUP.md`](./SETUP.md) にまとめてある。

本番 Worker は main から Cloudflare Workers Builds が自動デプロイする
（2026-09-24 に main と本番が揃った）。D1 のマイグレーションは `0016` まで
本番へ適用済み。**マイグレーションは自動では流れない**ので、スキーマを変えたときは
push より先に `wrangler d1 migrations apply fujisan-db --remote` を実行すること。

## スキル参照

Stripe 作業は `.claude/skills/stripe-*` を先に読むこと。

**`.claude/skills/design-system` は別アプリ（削除済みの command-center）の配色を書いたもので、このサイトには当てはまらない。** FUJISAN の色・余白・タイポグラフィの出どころは `src/app/globals.css` の `@theme inline`（Tailwind v4）で、和紙色（paper 系）と藍（#0B1A2E）・金（#C9A84C）・朱（#8B1A1A）が基調。
