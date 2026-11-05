export type FujisanNavChild = {
  label: string;
  jp: string;
  href: string;
  desc: string;
  descJp: string;
};

export type FujisanNavLinkItem = {
  href: string;
  /** 英語表示の名前。開閉の状態のキーにも使う */
  label: string;
  /** 日本語表示の名前 */
  jp: string;
  /**
   * Pattern used to derive active state.
   * - Hash form ("#showcase") matches when on `/` and the section is in view
   * - Path form ("/shop") matches when pathname starts with it
   */
  match?: string;
  children?: FujisanNavChild[];
};

export const FUJISAN_NAV_LINKS: FujisanNavLinkItem[] = [
  { href: "/", label: "HOME", jp: "ホーム", match: "#top" },
  { href: "/products", label: "COLLECTION", jp: "商品一覧", match: "/products" },
  {
    href: "/shop",
    label: "PURCHASE",
    jp: "ご購入",
    match: "/shop",
    children: [
      {
        label: "FOR YOUR TABLE",
        jp: "個人のお客様",
        href: "/shop/personal",
        desc: "Single bottles to your door, with care.",
        descJp: "一本からご購入いただけます。",
      },
      {
        label: "FOR YOUR PROGRAMME",
        jp: "法人・卸 / 取扱店",
        href: "/shop/business",
        desc: "Restaurants, bars, retailers, hospitality.",
        descJp: "飲食店・小売店・宿泊施設の方向けです。",
      },
    ],
  },
  { href: "/contact", label: "CONTACT", jp: "お問い合わせ", match: "/contact" },
];
