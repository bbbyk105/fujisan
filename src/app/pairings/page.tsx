import { redirect } from "next/navigation";

// ペアリングは現在非表示。直接アクセスはトップへ転送する。
// （旧ページの内容は git 履歴に保持）
export default function PairingsPage() {
  redirect("/");
}
