import type { ReactNode } from "react";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";

/**
 * トップページと /products 以外の全ページの外枠。
 *
 * `.fjs-ed` を付けるのはここだけ。編集レイヤーの CSS（globals.css の
 * EDITORIAL LAYER）はすべてこのクラスの配下に閉じてあるので、凍結ページの
 * 見た目には触れない。
 */
export function EditorialPage({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main className={`fjs-ed min-h-screen ${className}`}>
      <FujisanNav />
      {children}
      <FujisanFooter />
    </main>
  );
}
