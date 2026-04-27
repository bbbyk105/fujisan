import { FUJISAN_NAV_LINKS } from "./fujisan-nav-links";
import { FujisanNavClient } from "./FujisanNavClient";

/** サーバーでリンク定数を束ね、インタラクションのみクライアントに渡す */
export default function FujisanNav() {
  return <FujisanNavClient links={FUJISAN_NAV_LINKS} />;
}
