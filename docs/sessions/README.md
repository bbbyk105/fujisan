# Claude Code セッションログ

このディレクトリは Claude Code で行われた作業セッションの記録を保管します。

## 構成

- `raw/` — Claude Code が出力した生の JSONL 形式セッションログ
  - 1行 = 1メッセージ（ユーザー発話 / アシスタント応答 / ツール呼び出し / ツール結果）
  - ファイル名はセッション UUID

## 運用ルール

1. **機密情報は含めない** — パスワード・API キー等は `.env.local`（`.gitignore` 済）に格納
2. **新しいセッション追加** — `~/.claude/projects/<project-hash>/*.jsonl` を `raw/` にコピー
3. **閲覧** — JSONL は `jq` 等で整形すると読みやすい:
   ```bash
   jq -r '.message.content[] | select(.type=="text") | .text' raw/<uuid>.jsonl
   ```

## 注意

- セッションログにはシステムプロンプトやツールの内部メタデータも含まれます
- リポジトリを公開する場合は内容を確認してから push してください
