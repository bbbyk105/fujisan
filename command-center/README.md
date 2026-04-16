# Fuji Command Center

統合デスクトップ UI パネル。Gmail・Google Calendar・プロジェクト管理をツリー構造 + 複数パネルで一元管理する Electron アプリ。

## 技術スタック

- **Electron 33** — クロスプラットフォーム デスクトップラッパー
- **Vite 6** — 高速な開発サーバー
- **React 19 + TypeScript** — UI レイヤー
- **Tailwind CSS 3** — スタイリング
- **Zustand** — 軽量ステート管理
- **googleapis** — Gmail / Calendar API 公式 SDK
- **lucide-react** — アイコン

## レイアウト

```
┌────────────────────────────────────────────────────────────┐
│  TopBar [検索 / 新規 / 通知 / 設定]                        │
├─────────┬──────────────────────────────────────────────────┤
│         │  ┌────────────────────────────────┐              │
│ ツリー  │  │      カレンダーパネル          │              │
│  📂     │  └────────────────────────────────┘              │
│   ├── 📥 │  ┌─────────────┐┌────────────────┐              │
│   ├── 📅 │  │             ││                │              │
│   ├── 📦 │  │ メールパネル││ プロジェクト   │              │
│   │      │  │             ││                │              │
│   └── 🏷  │  └─────────────┘└────────────────┘              │
└─────────┴──────────────────────────────────────────────────┘
```

## セットアップ

```bash
cd command-center
npm install
cp .env.example .env.local
# .env.local に Google OAuth 認証情報を記入
npm run dev
```

初回起動後、アプリ内から「Google アカウントに接続」を実行してください。

## スクリプト

- `npm run dev` — Vite 開発サーバー + Electron ホットリロード
- `npm run build` — プロダクションビルド + インストーラ生成 (`release/`)
- `npm run electron:dev` — ビルド後のアプリを起動

## 構造

```
command-center/
├── electron/                 # メインプロセス (Node.js)
│   ├── main.ts              # ウィンドウ作成 + IPC
│   ├── preload.ts           # contextBridge
│   └── google-service.ts    # Gmail/Calendar API ラッパー
├── src/                     # レンダラープロセス (React)
│   ├── App.tsx              # ルートレイアウト
│   ├── components/
│   │   ├── Sidebar.tsx      # 左: ツリーナビ
│   │   ├── TopBar.tsx       # 上: 検索 + 新規ボタン
│   │   ├── CalendarPanel.tsx
│   │   ├── MailPanel.tsx
│   │   ├── ProjectsPanel.tsx
│   │   └── NewItemMenu.tsx  # 新規作成ドロップダウン
│   ├── lib/
│   │   ├── store.ts         # Zustand ストア
│   │   └── mock.ts          # OAuth 未接続時のサンプルデータ
│   └── types.ts
├── .env.example
└── package.json
```

## Google OAuth

1. Google Cloud Console でプロジェクト作成
2. 「APIs & Services」→「OAuth consent screen」→ Desktop app で設定
3. 「Credentials」→「Create Credentials」→「OAuth client ID」(Desktop app)
4. `Client ID` / `Client Secret` を `.env.local` に記入

必要なスコープ:
- `gmail.readonly` — 受信箱閲覧
- `gmail.send` — 送信
- `calendar` — 予定の読み書き

トークンはユーザーの `app.getPath('userData')/google-token.json` に保存されます。

## ロードマップ

- [ ] OAuth ローカルコールバックサーバー (53682 port)
- [ ] プロジェクト永続化 (SQLite / JSON)
- [ ] タスク管理 (Todoist / Notion 連携)
- [ ] 自動化ルール (If-Then トリガー)
- [ ] グローバルショートカット (`Cmd+Shift+Space`)
- [ ] メニューバー常駐モード
- [ ] マルチアカウント対応
- [ ] AI アシスタント（メール下書き・要約）
