import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

type Entry = {
  href: string;
  title: { en: string; ja: string };
  desc: { en: string; ja: string };
};

/**
 * 買う・取り扱う、の入口。トップから辿れるのが商品一覧と「造り」の章だけで、
 * 購入の窓口（個人／法人）やお問い合わせへはヘッダーのメニューを開かないと
 * 行けなかった。
 */
const PURCHASE: Entry[] = [
  {
    href: "/shop/personal",
    title: { en: "For your table", ja: "個人のお客様" },
    desc: {
      en: "Buy a bottle for your home or as a gift",
      ja: "一本から、ご自宅用・贈り物に",
    },
  },
  {
    href: "/shop/business",
    title: { en: "For the trade", ja: "法人・取扱店のお客様" },
    desc: {
      en: "Wholesale pricing and trade accounts",
      ja: "卸価格とお取引のご相談",
    },
  },
];

/** 知りたいことの入口。規約類はフッターに任せ、ここには置かない */
const INFO: Entry[] = [
  {
    href: "/shipping",
    title: { en: "Shipping & returns", ja: "お届けと返品" },
    desc: {
      en: "Postage, dispatch times, damage",
      ja: "送料・発送の目安・破損のとき",
    },
  },
  {
    href: "/faq",
    title: { en: "FAQ", ja: "よくあるご質問" },
    desc: {
      en: "Storing, serving, and ordering",
      ja: "保管・飲み頃・ご注文について",
    },
  },
  {
    href: "/contact",
    title: { en: "Contact", ja: "お問い合わせ" },
    desc: {
      en: "Questions and trade enquiries",
      ja: "ご質問・ご相談の窓口",
    },
  },
];

/**
 * トップページ末尾の案内。
 *
 * トップは他ページのデザインの参照元なので、ここも「こだわり」（FujisanDiscover）と
 * 同じ組み方にする — 左に見出し・右下に導入、その下に番号付きの書誌的な一覧。
 */
export default function FujisanGuide() {
  return (
    <section className="relative border-t border-indigo/10 bg-paper" id="guide">
      <div className="mx-auto max-w-[1360px] px-7 py-20 md:px-12 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-16">
          <div>
            <Reveal className="flex items-center gap-4">
              <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-gold">
                Ⅱ
              </span>
              <span className="h-px w-10 bg-gold/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-indigo/60">
                <L en="Guide" ja="ご案内" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(26px,2.9vw,42px)] font-semibold leading-[1.18] tracking-[0.1em] text-indigo"
              delay={revealDelays.d1}
            >
              <L en="SHOP AND SUPPORT" ja="ご購入・お問い合わせ" />
            </Reveal>
          </div>

          <Reveal
            as="p"
            className="max-w-[420px] text-[13.5px] font-light leading-[1.9] text-indigo/72 md:text-[14px] lg:justify-self-end"
            delay={revealDelays.d2}
          >
            <L
              en="Buying a bottle, opening a trade account, delivery, and how to reach us."
              ja="一本からのご購入、お店でのお取り扱い、お届けやお問い合わせの窓口です。"
            />
          </Reveal>
        </div>

        <div className="mt-14 grid gap-x-16 gap-y-14 md:mt-20 lg:grid-cols-2">
          <Group label={{ en: "Purchase", ja: "ご購入" }} entries={PURCHASE} start={1} />
          <Group
            label={{ en: "Delivery & help", ja: "お届け・ご質問" }}
            entries={INFO}
            start={PURCHASE.length + 1}
          />
        </div>
      </div>
    </section>
  );
}

function Group({
  label,
  entries,
  start,
}: {
  label: { en: string; ja: string };
  entries: Entry[];
  start: number;
}) {
  return (
    <div>
      <p className="border-b border-indigo/12 pb-4 text-[12px] font-semibold tracking-[0.12em] text-indigo/55">
        <L en={label.en} ja={label.ja} />
      </p>
      <ul>
        {entries.map((e, i) => (
          <Reveal as="li" key={e.href} delay={0.08 + i * 0.08}>
            <Link
              href={e.href}
              className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b border-indigo/12 py-6 no-underline outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:gap-8 md:py-7"
            >
              <span
                aria-hidden
                className="w-9 shrink-0 font-serif text-[22px] font-medium leading-none tracking-[0.06em] text-indigo/22 transition-colors duration-500 group-hover:text-gold md:w-11 md:text-[28px]"
              >
                {String(start + i).padStart(2, "0")}
              </span>

              <span className="min-w-0">
                <span className="block font-serif text-[16px] font-semibold tracking-[0.08em] text-indigo transition-colors duration-500 group-hover:text-gold md:text-[18px]">
                  <L en={e.title.en} ja={e.title.ja} />
                </span>
                <span className="mt-1.5 block text-[12.5px] font-light leading-[1.7] text-indigo/65 md:text-[13px]">
                  <L en={e.desc.en} ja={e.desc.ja} />
                </span>
              </span>

              {/* 行の終わりの印は「こだわり」の一覧と揃える */}
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo/25 text-[13px] text-indigo/70 transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-paper"
              >
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}
