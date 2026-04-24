export type FujisanProduct = {
  slug: string;
  name: string;
  variant: string;
  variantLine: string;
  smv: string;
  title: string;
  desc: string;
  img: string;
  hero: string;
  catchJp: string;
  storyEn: string[];
  storyJp: string[];
  specs: Array<{ label: string; value: string }>;
  pairing: string[];
  serveTemp: string;
  grade: string;
};

export const fujisanProducts: FujisanProduct[] = [
  {
    slug: "honjozo",
    name: "FUJISAN",
    variant: "TOKUBETSU\nHONJOZO",
    variantLine: "Tokubetsu Honjozo",
    smv: "SMV +2",
    title: "Crisp & Refined",
    desc: "Balanced and easy-drinking\nwith a clean finish.",
    img: "/images/bushido/honjozo_01.png",
    hero: "A quiet precision\nthat rises with the morning light.",
    catchJp: "清けく、静かに、確かに。",
    storyEn: [
      "Brewed in the stillness of early spring, Tokubetsu Honjozo is guided by the pure snowmelt that descends from Mount Fuji's northern slopes.",
      "A whisper of distilled alcohol draws out the rice's natural sweetness, leaving a dry finish as clean as mountain air.",
      "Drink it chilled in summer, warm in winter — it reveals a different calm in every season.",
    ],
    storyJp: [
      "早春の静けさの中で仕込まれる特別本醸造。\n富士北麓の雪解け水が、\nゆっくりと酒母に染み渡ります。",
      "醸造アルコールがほのかに寄り添い、\n米の甘みを引き立てながら、\n山の空気のように澄んだ後味を残す。",
      "夏は冷やし、冬は燗で。\n季節ごとに違う静けさを\nこの一本から感じてください。",
    ],
    specs: [
      { label: "Class", value: "Tokubetsu Honjozo" },
      { label: "Rice", value: "Yamadanishiki" },
      { label: "Polish", value: "60%" },
      { label: "ABV", value: "15.5%" },
      { label: "SMV", value: "+2" },
      { label: "Acidity", value: "1.4" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Grilled white fish", "Dashi-simmered vegetables", "Aged cheese"],
    serveTemp: "Chilled 8–12°C · Warm 45°C",
    grade: "Crisp, Dry",
  },
  {
    slug: "junmai",
    name: "FUJISAN",
    variant: "TOKUBETSU\nJUNMAI",
    variantLine: "Tokubetsu Junmai",
    smv: "SMV +1",
    title: "Smooth & Elegant",
    desc: "Soft aroma with a mellow,\nsmooth flavor.",
    img: "/images/bushido/honjozo_02.png",
    hero: "A gentle arc of umami,\nlike mist drifting over a quiet lake.",
    catchJp: "柔らかく、深く、やさしく。",
    storyEn: [
      "Pure rice, water, and yeast — nothing else. Tokubetsu Junmai holds a restrained elegance that deepens with every sip.",
      "Slow fermentation at low temperatures coaxes out a round, mellow aroma, while the long finish echoes the patience of the brew house.",
      "A sake for shared evenings, when conversation lingers longer than the sunset.",
    ],
    storyJp: [
      "米と水と酵母だけ。\n余計なものを削ぎ落とした特別純米は、\n一口ごとに奥行きが増してゆきます。",
      "低温でゆっくりと進む発酵が、\n丸くやわらかな香りを引き出し、\n長い余韻に蔵の時間を映します。",
      "語らいが夕暮れより長く続くような、\n静かな夜のための一本。",
    ],
    specs: [
      { label: "Class", value: "Tokubetsu Junmai" },
      { label: "Rice", value: "Miyama Nishiki" },
      { label: "Polish", value: "58%" },
      { label: "ABV", value: "15.0%" },
      { label: "SMV", value: "+1" },
      { label: "Acidity", value: "1.5" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Yakitori", "Simmered pork belly", "Smoked trout"],
    serveTemp: "Chilled 10°C · Warm 40°C",
    grade: "Smooth, Round",
  },
  {
    slug: "daiginjo-aroma",
    name: "FUJISAN",
    variant: "JUNMAI\nDAIGINJO SAKE",
    variantLine: "Junmai Daiginjo — Aroma",
    smv: "SMV −1",
    title: "Fruity & Aromatic",
    desc: "Fruity notes with a delicate\nand graceful taste.",
    img: "/images/bushido/junmai_daiginjo_01.png",
    hero: "A bouquet of orchard fruit\nunfolding across the tongue.",
    catchJp: "華やか、軽やか、艶やか。",
    storyEn: [
      "The Aroma edition is polished to 40%, coaxing out the gentle perfumes hidden at the heart of Yamadanishiki rice.",
      "Notes of white peach, melon, and acacia bloom on the nose, carried by a silken texture and a faintly sweet finish.",
      "Serve in a tulip glass to let the aroma rise — the bottle becomes a small garden at the table.",
    ],
    storyJp: [
      "芳醇な香りを引き出すため、\n山田錦を四十%まで磨き上げた大吟醸。",
      "白桃・メロン・アカシアの花を思わせる香りが\n絹のような口当たりと\n淡い甘みの余韻に溶けていきます。",
      "チューリップ型のグラスに注げば、\n食卓に小さな庭園がひらく。",
    ],
    specs: [
      { label: "Class", value: "Junmai Daiginjo" },
      { label: "Rice", value: "Yamadanishiki" },
      { label: "Polish", value: "40%" },
      { label: "ABV", value: "16.0%" },
      { label: "SMV", value: "−1" },
      { label: "Acidity", value: "1.3" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Sashimi", "Fresh goat cheese", "Stone fruit desserts"],
    serveTemp: "Chilled 8°C",
    grade: "Aromatic, Silky",
  },
  {
    slug: "daiginjo-rich",
    name: "FUJISAN",
    variant: "JUNMAI\nDAIGINJO",
    variantLine: "Junmai Daiginjo — Reserve",
    smv: "SMV ±0",
    title: "Rich & Full-Bodied",
    desc: "Deep umami with a\nluxurious, lingering finish.",
    img: "/images/bushido/junmai_daiginjo_02.png",
    hero: "A measured richness,\ndeep as the forest at dusk.",
    catchJp: "深く、豊かに、たおやかに。",
    storyEn: [
      "Our Reserve Daiginjo is matured quietly through the winter, layering soft umami with the precision of hand-polished rice.",
      "Flavors of ripe pear, baked rice, and a whisper of oak-like warmth settle into a long, savory finish.",
      "A sake for considered evenings — drunk slowly, with gratitude for the silence it carries.",
    ],
    storyJp: [
      "冬を静かに越すリザーブ大吟醸。\n手磨きの米が生む緻密な旨味が、\n層を成して口の中に広がります。",
      "熟した梨、焼きたての米、\nそしてほのかに樽のような温かみ。\n長い余韻が食後の時間を静かに満たす。",
      "ひとり、またはふたりで。\nゆっくりと傾けたい一本。",
    ],
    specs: [
      { label: "Class", value: "Junmai Daiginjo" },
      { label: "Rice", value: "Omachi" },
      { label: "Polish", value: "45%" },
      { label: "ABV", value: "16.5%" },
      { label: "SMV", value: "±0" },
      { label: "Acidity", value: "1.4" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Wagyu tataki", "Smoked duck", "Matured hard cheese"],
    serveTemp: "Chilled 10°C · Lightly warm 35°C",
    grade: "Rich, Full-bodied",
  },
  {
    slug: "junmai-bold",
    name: "FUJISAN",
    variant: "TOKUBETSU\nJUNMAI",
    variantLine: "Tokubetsu Junmai — Bold",
    smv: "SMV +3",
    title: "Bold & Fresh",
    desc: "Vibrant and lively with\na crisp, refreshing taste.",
    img: "/images/bushido/junmai_ginjo_01.png",
    hero: "A bright, upward energy,\nas clear as spring water on stone.",
    catchJp: "瑞々しく、張りのある一杯。",
    storyEn: [
      "Brewed with a slightly higher acidity for a lively, crystalline profile — the Bold edition is Fujisan at its most spirited.",
      "Crisp apple, citrus zest, and a clean mineral line meet a brisk, refreshing finish.",
      "Best served ice-cold, it wakes the palate before a feast or closes a warm evening with clarity.",
    ],
    storyJp: [
      "酸度を少し高めに設計した、\n溌剌とした特別純米。",
      "青りんご、柑橘、そして澄んだミネラル。\nきりっとした後味が、\n食前・食後の時間を軽やかに整えます。",
      "よく冷やして、\n食卓の始まりと終わりに。",
    ],
    specs: [
      { label: "Class", value: "Tokubetsu Junmai" },
      { label: "Rice", value: "Gohyakumangoku" },
      { label: "Polish", value: "55%" },
      { label: "ABV", value: "15.0%" },
      { label: "SMV", value: "+3" },
      { label: "Acidity", value: "1.7" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Oysters", "Ceviche", "Herb salad"],
    serveTemp: "Ice-cold 5–8°C",
    grade: "Dry, Vibrant",
  },
  {
    slug: "junmai-ginjo",
    name: "FUJISAN",
    variant: "JUNMAI\nGINJO SAKE",
    variantLine: "Junmai Ginjo",
    smv: "SMV +2",
    title: "Aromatic & Light",
    desc: "Floral aroma with a\nlight and smooth texture.",
    img: "/images/bushido/junmai_ginjo_02.png",
    hero: "A light, luminous ginjo,\nscented with early blossoms.",
    catchJp: "花のように、軽やかに。",
    storyEn: [
      "Junmai Ginjo is our brewers' daily companion — polished to 55%, fermented cold, and finished with an easy, bright character.",
      "Flowers, pear skin, and a trace of steamed rice rise softly; the body is light, the finish dry and kind.",
      "An everyday sake of quiet confidence — equally at home with sushi or a simple bowl of soba.",
    ],
    storyJp: [
      "蔵人たちの日常に寄り添う純米吟醸。\n精米五十五%、低温でじっくりと醸し、\n軽やかな仕上がりに。",
      "花、梨の皮、蒸した米のほのかな香り。\n軽い酒質と\nやさしく乾いた後味。",
      "寿司にも、一杯の蕎麦にも。\n静かで確かな、毎日の酒。",
    ],
    specs: [
      { label: "Class", value: "Junmai Ginjo" },
      { label: "Rice", value: "Yamadanishiki" },
      { label: "Polish", value: "55%" },
      { label: "ABV", value: "15.5%" },
      { label: "SMV", value: "+2" },
      { label: "Acidity", value: "1.4" },
      { label: "Volume", value: "720ml" },
    ],
    pairing: ["Sushi", "Cold soba", "Tempura vegetables"],
    serveTemp: "Chilled 10°C",
    grade: "Light, Floral",
  },
];

export function getFujisanProductBySlug(slug: string) {
  return fujisanProducts.find((p) => p.slug === slug);
}
