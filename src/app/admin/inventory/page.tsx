import { redirect } from "next/navigation";

/**
 * 旧 `/admin/inventory`。価格と在庫を 1 画面に統合したため `/admin/products` へ移した。
 * ブックマークと手順書（SETUP.md）が生きているので、リンクは残して転送する。
 */
export default function AdminInventoryRedirect() {
  redirect("/admin/products");
}
