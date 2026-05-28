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
   * - Path form ("/stories", "/craft") matches when pathname starts with it
   */
  match?: string;
  children?: FujisanNavChild[];
};

export const FUJISAN_NAV_LINKS: FujisanNavLinkItem[] = [
  { href: "/#top", label: "HOME", match: "#top" },
  {
    href: "/craft",
    label: "THE CRAFT",
    match: "/craft",
    children: [
      {
        label: "PURE WATER",
        jp: "富士の水",
        href: "/craft/water",
        desc: "Snowmelt, fifty years in the mountain.",
      },
      {
        label: "PREMIUM RICE",
        jp: "厳選米",
        href: "/craft/rice",
        desc: "Sakamai grown for the brewer.",
      },
      {
        label: "TRADITIONAL BREWING",
        jp: "伝統醸造",
        href: "/craft/brewing",
        desc: "A hundred winter days at the kura.",
      },
    ],
  },
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
