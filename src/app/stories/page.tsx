import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { StoriesHero } from "@/components/fujisan/stories/StoriesHero";
import {
  StoriesNarrative,
  type Story,
} from "@/components/fujisan/stories/StoriesNarrative";
import { StoriesProgress } from "@/components/fujisan/stories/StoriesProgress";
import { StoriesClosing } from "@/components/fujisan/stories/StoriesClosing";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Stories of Fujisan — FUJISAN SAKE",
  description:
    "A few honest notes on what's in the glass — the water and rice behind Fujisan, the cold months it is brewed in, and some easy ways to pour it.",
};

const stories: Story[] = [
  {
    eyebrow: "WINTER WORK",
    eyebrowJp: "杜氏",
    title: "Brewed in the cold",
    jp: "寒造り",
    excerpt:
      "Fujisan is a winter sake. Cold air keeps fermentation slow and clean, so brewing runs from late autumn into the coldest weeks of the year. The mornings start early, and a lot of the work is judged by smell and touch.",
    excerptJp:
      "富士山は冬の酒です。冷たい空気が発酵をゆっくり、澄んだものに保つので、仕込みは晩秋から一年で最も寒い時期にかけて行います。朝は早く、多くは香りと手ざわりで見極めます。",
    image: "/images/fujisan/toji.webp",
    position: "object-[50%_28%]",
    href: "/craft/brewing",
    ctaEn: "READ THE FULL CRAFT",
    ctaJp: "酒造りの全文を読む",
  },
  {
    eyebrow: "THE RICE",
    eyebrowJp: "米",
    title: "How far the rice is polished",
    jp: "米を磨く",
    excerpt:
      "The daiginjo leans on Yamadanishiki, blended with Homarefuji, a sake rice bred here in Shizuoka. Polish away the outer grain and mostly the starchy heart is left. That is where the clean, quiet sweetness comes from.",
    excerptJp:
      "大吟醸の軸は山田錦。静岡で生まれた酒米、誉富士を合わせます。米の外側を削ると、でんぷん質の中心が残る。澄んだ静かな甘みは、そこから生まれます。",
    image: "/images/fujisan/features/ricebox.webp",
    position: "object-[50%_46%]",
    href: "/craft/rice",
    ctaEn: "READ THE FULL STORY",
    ctaJp: "米の話を読む",
  },
  {
    eyebrow: "THE WATER",
    eyebrowJp: "水",
    title: "Soft water off the mountain",
    jp: "富士の水",
    excerpt:
      "The brewing water is Mt. Fuji snowmelt that has spent decades working down through volcanic rock. It comes out soft and low in iron — the kind of water that keeps a sake delicate rather than heavy.",
    excerptJp:
      "仕込み水は、何十年もかけて溶岩の層を下ってきた富士山の雪解け水。やわらかく鉄分が少ないので、酒は重くならず、繊細に仕上がります。",
    image: "/images/fujisan/features/water.webp",
    position: "object-[50%_42%]",
    href: "/craft/water",
    ctaEn: "READ THE FULL STORY",
    ctaJp: "水の話を読む",
  },
  {
    eyebrow: "AT THE TABLE",
    eyebrowJp: "食卓",
    title: "Warm it at the counter",
    jp: "燗の一杯",
    excerpt:
      "Not every sake likes heat, but the junmai styles do. Warmed gently in a tin chirori to around body temperature, they turn rounder and softer — good company for a slow meal and a longer conversation.",
    excerptJp:
      "どんな酒でも燗が合うわけではありませんが、純米系はよく映えます。ちろりで人肌ほどにそっと温めると、丸くやわらかに。ゆっくりした食事と、長い話の相手にどうぞ。",
    image: "/images/kappou.webp",
    position: "object-[55%_50%]",
  },
  {
    eyebrow: "TEMPERATURE",
    eyebrowJp: "温度",
    title: "Cold or warm, your call",
    jp: "温度で遊ぶ",
    excerpt:
      "One bottle, two drinks. Well chilled it is sharp and refreshing; with a little warmth the body and sweetness come forward. Pour a glass each way and taste the difference yourself.",
    excerptJp:
      "一本で、二通り。よく冷やせばシャープで爽やか、少し温めればふくらみと甘みが前に出ます。両方注いで、その違いを確かめてみてください。",
    image: "/images/fujisan/art-of-sake/sake.webp",
    position: "object-[42%_50%]",
  },
  {
    eyebrow: "THE CUP",
    eyebrowJp: "うつわ",
    title: "The cup counts too",
    jp: "器のはなし",
    excerpt:
      "The cup shapes the aroma as much as the sake does. A small ochoko keeps it tight and focused; a wine glass lifts the fruit and flowers. It is worth keeping a few shapes within reach.",
    excerptJp:
      "香りは、酒と同じくらい器で決まります。小さなおちょこは香りをまとめ、ワイングラスは果実や花の香りをひらく。形違いをいくつか手元に置いておくと楽しめます。",
    image: "/images/fujisan/shuki.webp",
    position: "object-[50%_50%]",
  },
];

export default function StoriesPage() {
  return (
    <main className="stories-page bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <StoriesProgress
        trackSelector=".stories-page"
        chapterCount={stories.length}
      />

      <StoriesHero
        eyebrow="HERITAGE · STORIES"
        chapter="Ⅱ"
        titleEn="STORIES OF FUJISAN"
        titleJp="富士山酒物語"
        jp="― 富士山酒物語 ―"
        lead={
          <L
            en="A few honest notes on what is actually in the glass — the water and rice behind Fujisan, the cold months it is brewed in, and some easy ways to pour it."
            ja="グラスの中身についての、正直な覚え書きを少しだけ。富士山の水と米のこと、仕込みの冬のこと、そして気軽な注ぎ方を。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "STORIES", href: "/stories" },
        ]}
        bgSrc="/images/afternoon-fuji.webp"
        bgPosition="object-[50%_50%]"
      />

      <StoriesNarrative stories={stories} />

      <StoriesClosing />

      <FujisanFooter />
    </main>
  );
}
