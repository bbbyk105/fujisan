# Command Center — アーキテクチャ図

## 1. UI レイアウト全体図

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║ ┌──────────┐┌─────────────────────────────────────────────────────────────────┐  ║
║ │ 富 C.C.  ││  🔍 [メール・イベント・プロジェクトを検索…]     [⌘K]          │  ║
║ │(drag)    ││                                  [+ 新規]  [🔔]  [⚙]          │  ║
║ ├──────────┤├─────────────────────────────────────────────────────────────────┤  ║
║ │          ││                                                                 │  ║
║ │📥 受信  ⑫││  ┌───────────────────────────────────────────────────────────┐ │  ║
║ │📅 今日  ④││  │ 📅 カレンダー                         [🔄]  4 件の予定  │ │  ║
║ │📂 ﾌﾟﾛｼﾞｪｸﾄ││  │ ────────────────────────────────────────────────────────  │ │  ║
║ │ ├⬚ 富士酒││  │  今日                                                     │ │  ║
║ │ │⑧      ││  │   ┌────────────────────────────────────────────┐         │ │  ║
║ │ ├⬚ Gmail ││  │   │ 蔵元ミーティング        14:00 – 15:00       │         │ │  ║
║ │ │③      ││  │   │ 📍 Zoom  👥 2                               │         │ │  ║
║ │ └⬚ Cal   ││  │   └────────────────────────────────────────────┘         │ │  ║
║ │  ②      ││  │  明日                                                     │ │  ║
║ │🏷 タグ   ││  │   ┌────────────────────────────────────────────┐         │ │  ║
║ │ ├🔴 緊急 ││  │   │ ボトル撮影              10:00 – 14:00       │         │ │  ║
║ │ ├🟡 ｸﾗｲｱﾝ││  │   │ 📍 スタジオ 青山                            │         │ │  ║
║ │ └🔵 ｱｲﾃﾞｱ ││  │   └────────────────────────────────────────────┘         │ │  ║
║ │📚 ｱｰｶｲﾌﾞ ││  └───────────────────────────────────────────────────────────┘ │  ║
║ │          ││                                                                 │  ║
║ │          ││  ┌──────────────────────┐  ┌────────────────────────────────┐  │  ║
║ │          ││  │ ✉ メール  3 件未読  │  │ 📦 進行中プロジェクト  4 件  │  │  ║
║ │          ││  │ ───────────────────  │  │ ──────────────────────────── │  │  ║
║ │          ││  │ ● 山田           30分│  │ ┌──────────┐┌──────────┐     │  │  ║
║ │          ││  │   FUJI-SAKE 納品     │  │ │富士酒サイト││Gmailﾎﾞｯﾄ  │     │  │  ║
║ │          ││  │   お世話になっ…      │  │ │ 進行中    ││ ﾚﾋﾞｭｰ     │     │  │  ║
║ │          ││  │ ● Vercel         2h  │  │ │ ▓▓▓▓░ 65%││ ▓▓▓▓▓ 82%│     │  │  ║
║ │          ││  │   Deployment OK      │  │ │ あと18日  ││ あと6日★ │     │  │  ║
║ │          ││  │   Your deployment…   │  │ └──────────┘└──────────┘     │  │  ║
║ │          ││  │ ○ 佐藤          6h   │  │ ┌──────────┐┌──────────┐     │  │  ║
║ │          ││  │   蔵元見学のご案内   │  │ │Cal同期    ││DNS設定    │     │  │  ║
║ │          ││  │ ○ GitHub        1d   │  │ │ 進行中    ││ 保留      │     │  │  ║
║ │          ││  │   PR #3              │  │ │ ▓▓░░░ 30%││ ▓░░░░ 10%│     │  │  ║
║ │          ││  │ ○ design@       26h  │  │ │ あと11日  ││ ─         │     │  │  ║
║ │          ││  │   ラベルデザ第2案    │  │ └──────────┘└──────────┘     │  │  ║
║ │          ││  └──────────────────────┘  └────────────────────────────────┘  │  ║
║ │          ││                                                                 │  ║
║ ├──────────┤│                                                                 │  ║
║ │同期 07:11││                                                                 │  ║
║ └──────────┘└─────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════════════╝
 ◉ Sidebar      ◉ TopBar + Content Grid (3 panels)
 256 px         flex-1 / 12-col × 2-row grid
```

---

## 2. コンポーネント階層ツリー

```
<App>                                    src/App.tsx
│
├── <Sidebar>                            src/components/Sidebar.tsx
│   ├── [titlebar-drag] ロゴ + "Command Center"
│   ├── <nav>
│   │   └── <TreeItem> × N               (再帰的)
│   │       ├── ChevronRight/Down
│   │       ├── Icon (Inbox/Folder/Tag/…)
│   │       ├── label
│   │       └── count / color badge
│   └── footer (同期時刻)
│
└── <div flex-col>  ← メインエリア
    ├── <TopBar>                         src/components/TopBar.tsx
    │   ├── Search input  ⌘K
    │   ├── [+ 新規] button  ─────→  toggleNewMenu
    │   ├── Bell icon
    │   └── Settings icon
    │
    ├── <NewItemMenu>  (条件付き)        src/components/NewItemMenu.tsx
    │   ├── メール下書き   → Gmail 新規
    │   ├── 予定を追加     → Calendar
    │   ├── プロジェクト   → addProject()
    │   ├── タスク         → Todo
    │   └── 自動化ルール   → If / Then
    │
    └── <main grid-12×2>
        ├── <MailPanel>         col-4 row-2   src/components/MailPanel.tsx
        │   ├── panel-header (件数バッジ)
        │   └── リスト
        │       └── <MessageRow> × N
        │           ├── 未読ドット
        │           ├── 送信者
        │           ├── 件名
        │           ├── スニペット
        │           └── 相対時刻
        │
        ├── <CalendarPanel>     col-8 row-1   src/components/CalendarPanel.tsx
        │   ├── panel-header
        │   └── 日付グループ × N
        │       └── <EventCard> × N
        │           ├── 件名
        │           ├── 時間帯
        │           ├── 場所 📍
        │           └── 参加者 👥
        │
        └── <ProjectsPanel>     col-8 row-1   src/components/ProjectsPanel.tsx
            ├── panel-header
            └── グリッド (xl:2列)
                └── <ProjectCard> × N
                    ├── 名前
                    ├── ステータスバッジ
                    ├── 次のアクション
                    ├── 進捗バー
                    ├── タグ
                    └── 締切 (緊急色)
```

---

## 3. データフロー / ステート管理

```
                      ┌─────────────────────────────┐
                      │   Zustand Store (store.ts)  │
                      │  ─────────────────────────  │
                      │   selectedNodeId            │
                      │   tree: TreeNode[]          │
                      │   mails: MailMessage[]      │
                      │   events: CalendarEvent[]   │
                      │   projects: Project[]       │
                      │   toggleNewMenu             │
                      │                             │
                      │   actions:                  │
                      │     setMails/setEvents      │
                      │     addProject              │
                      │     setSelectedNodeId       │
                      └──────────┬──────────────────┘
                                 │
          ┌───────┬──────────────┼──────────────┬───────────┐
          ▼       ▼              ▼              ▼           ▼
      Sidebar  TopBar      CalendarPanel   MailPanel   ProjectsPanel
                             (useEffect)   (useEffect)
                                  │              │
                                  └──────┬───────┘
                                         ▼
                                 window.api.*  (preload bridge)
                                         │
                                         ▼
                                  Electron IPC
                                         │
                                         ▼
                                 google-service.ts
                                         │
                                         ▼
                               ┌─────────┴─────────┐
                               ▼                   ▼
                         Gmail API          Calendar API
                         (googleapis)       (googleapis)
```

---

## 4. プロセス境界 (Electron)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Electron アプリ                               │
│                                                                      │
│  ┌─────────────────────┐         ┌─────────────────────────────┐    │
│  │ Main Process        │         │ Renderer Process            │    │
│  │ (Node.js / 特権)    │         │ (Chromium / サンドボックス) │    │
│  │ electron/main.ts    │         │ src/**.tsx                  │    │
│  │                     │         │                             │    │
│  │ • BrowserWindow     │         │ • React 19 + Vite           │    │
│  │ • IPC handlers      │◄────────│ • Zustand                   │    │
│  │ • ファイル I/O       │  invoke │ • Tailwind UI               │    │
│  │ • Google OAuth      │────────►│                             │    │
│  │ • トークン永続化     │  result │                             │    │
│  └──────────┬──────────┘         └─────────────▲───────────────┘    │
│             │                                  │                    │
│             │      ┌──────────────────┐        │                    │
│             └─────►│ preload.ts       │────────┘                    │
│                    │ contextBridge    │   window.api.gmail          │
│                    │ (isolated)       │   window.api.calendar       │
│                    └──────────────────┘   window.api.google         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ google-service.ts  (Main Process のみ)                      │    │
│  │  ─────────────────────────────────────────────────────────  │    │
│  │   getAuthUrl()          ─► OAuth URL 生成                   │    │
│  │   exchangeCode(code)    ─► トークン保存                     │    │
│  │   listMessages(opts)    ─► gmail.users.messages.list        │    │
│  │   listEvents(opts)      ─► calendar.events.list             │    │
│  │                                                              │    │
│  │   Token: userData/google-token.json (ローカル暗号化推奨)     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                ┌─────────────────────────────────┐
                │        Google APIs              │
                │   gmail.readonly / send         │
                │   calendar (read/write)         │
                └─────────────────────────────────┘
```

---

## 5. IPC チャネル一覧

| チャネル名          | 方向        | 引数                          | 戻り値                   |
|---------------------|-------------|-------------------------------|--------------------------|
| `google:auth-url`   | R → M       | —                             | `string` (OAuth URL)     |
| `google:exchange-code` | R → M   | `code: string`                | `{ok: true}`             |
| `gmail:list`        | R → M       | `{maxResults?: number}`       | `MailMessage[]`          |
| `calendar:list`     | R → M       | `{timeMin?, timeMax?}`        | `CalendarEvent[]`        |

※ R = Renderer, M = Main

---

## 6. 起動シーケンス

```
[1] ユーザーが Command Center を起動
       │
       ▼
[2] Electron main.ts
     ├─ BrowserWindow 作成 (1440×900, vibrancy)
     └─ index.html ロード
            │
            ▼
[3] Renderer: React App マウント
     ├─ Zustand Store 初期化 (tree, projects, モック)
     └─ 各 Panel の useEffect 発火
            │
            ▼
[4] window.api.gmail.list() / calendar.list() を呼び出し
     │
     ├─ window.api 存在 & トークン有り → Google API へ
     │
     └─ 失敗 or 未接続 → モックデータにフォールバック
            │
            ▼
[5] Store 更新 → 各 Panel が再レンダリング
            │
            ▼
[6] ユーザー操作 (ツリー選択・新規・検索…)
     └─ ループ
```

---

## 7. 将来拡張時のアーキテクチャ

```
            ┌──────────────────────────────┐
            │     Command Center Core      │
            └──────┬───────────────────────┘
                   │
   ┌───────────────┼──────────────┬─────────────┬──────────────┐
   ▼               ▼              ▼             ▼              ▼
 Gmail        Calendar        Projects       Tasks         AI Agent
 (現在)       (現在)          (JSON/SQL)    (Todoist?)    (Claude API)
                                              │
                                              └─► メール自動返信
                                                  要約・下書き生成
                                                  予定の最適化提案

   ┌─── Automation Engine (If-Then) ───────────────────┐
   │                                                    │
   │  Trigger            →  Condition   →  Action      │
   │  ──────────────────────────────────────────────── │
   │  新着メール(緊急)   →  [AI分類]    →  通知+予定作成│
   │  カレンダー空き     →  [30分以上]  →  集中モード  │
   │  プロジェクト締切   →  [3日以内]   →  毎朝リマインダ│
   │  Gmail ラベル付与   →  [クライアント]→ プロジェクト紐付け│
   └────────────────────────────────────────────────────┘
```
