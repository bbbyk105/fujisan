export type FujisanNavChild = {
  label: string;
  jp?: string;
  href: string;
  desc?: string;
};

export type FujisanNavLinkItem = {
  href: string;
  label: string;
  /**
   * Pattern used to derive active state.
   * - Hash form ("#showcase") matches when on `/` and the section is in view
   * - Path form ("/stories", "/shop") matches when pathname starts with it
   */
  match?: string;
  children?: FujisanNavChild[];
};

export const FUJISAN_NAV_LINKS: FujisanNavLinkItem[] = [
  { href: "/#top", label: "HOME", match: "#top" },
  { href: "/stories", label: "STORIES", match: "/stories" },
  {
    href: "/shop",
    label: "PURCHASE",
    match: "/shop",
    children: [
      {
        label: "FOR YOUR TABLE",
        jp: "個人のお客様",
        href: "/shop/personal",
        desc: "Single bottles to your door, with care.",
      },
      {
        label: "FOR YOUR PROGRAMME",
        jp: "法人・卸 / 取扱店",
        href: "/shop/business",
        desc: "Restaurants, bars, retailers, hospitality.",
      },
    ],
  },
  { href: "/contact", label: "CONTACT", match: "/contact" },
];
