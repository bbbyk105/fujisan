export type FujisanProduct = {
  slug: string;
  name: string;
  variant: string;
  variantLine: string;
  /** 日本語の銘柄ライン（例: 「特別本醸造」） */
  variantLineJp: string;
  smv: string;
  title: string;
  /** 日本語の品名タグ */
  titleJp: string;
  desc: string;
  /** 日本語の短い説明 */
  descJp: string;
  img: string;
  hero: string;
  /** 日本語のヒーロー詩文 */
  heroJp: string;
  catchJp: string;
  storyEn: string[];
  storyJp: string[];
  specs: Array<{ label: string; value: string }>;
  pairing: string[];
  /** 日本語のペアリング */
  pairingJp: string[];
  serveTemp: string;
  /** 日本語の提供温度 */
  serveTempJp: string;
  grade: string;
  /** 日本語の風味グレード */
  gradeJp: string;
  /** 税込み小売価格（円） */
  priceJpy: number;
  /** 卸価格（税抜・1本あたり、円）。ログイン済みの取扱店のみに表示する。 */
  wholesalePriceJpy: number;
  /** 卸の最小ケース本数 */
  caseSize: number;
};

export const fujisanProducts: FujisanProduct[] = [
  {
    slug: "honjozo",
    name: "FUJISAN",
    variant: "TENKA",
    variantLine: "Junmai Daiginjo",
    variantLineJp: "純米大吟醸",
    smv: "SMV +3",
    title: "Crisp & Refined",
    titleJp: "凛とした、洗練の味わい",
    desc: "Balanced and easy-drinking\nwith a clean finish.",
    descJp: "均整のとれた飲み口と、\n澄み切った後味。",
    img: "/images/bushido/honjozo_01.png",
    hero: "A quiet precision\nthat rises with the morning light.",
    heroJp: "朝の光と共に立ち昇る、\n静謐な確かさ。",
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
      { label: "ABV", value: "15%" },
      { label: "Ingredients", value: "Rice / Rice Koji" },
      { label: "Rice", value: "Yamadanishiki (Hyogo)" },
      { label: "Polish", value: "50%" },
      { label: "SMV", value: "+3" },
      { label: "Acidity", value: "1.0" },
      { label: "Amino Acid", value: "1.1" },
      { label: "Yeast", value: "HD101" },
    ],
    pairing: ["Grilled white fish", "Dashi-simmered vegetables", "Aged cheese"],
    pairingJp: ["白身魚の塩焼き", "出汁の煮物", "熟成チーズ"],
    serveTemp: "Chilled 8–12°C · Warm 45°C",
    serveTempJp: "冷酒 8〜12℃ ／ 燗 45℃",
    grade: "Crisp, Dry",
    gradeJp: "辛口・キレ",
    priceJpy: 3300,
    wholesalePriceJpy: 1980,
    caseSize: 6,
  },
  {
    slug: "junmai",
    name: "FUJISAN",
    variant: "SHOGUN",
    variantLine: "Junmai Daiginjo",
    variantLineJp: "純米大吟醸",
    smv: "SMV +4",
    title: "Smooth & Elegant",
    titleJp: "やわらかく、優美な口当たり",
    desc: "Soft aroma with a mellow,\nsmooth flavor.",
    descJp: "穏やかな香りと、\nまろやかで滑らかな味わい。",
    img: "/images/bushido/honjozo_02.png",
    hero: "A gentle arc of umami,\nlike mist drifting over a quiet lake.",
    heroJp: "静かな湖面に立つ霧のように、\nやわらかに広がる旨味。",
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
      { label: "ABV", value: "15%" },
      { label: "Ingredients", value: "Rice / Rice Koji" },
      { label: "Rice", value: "Yamadanishiki (Hyogo)" },
      { label: "Polish", value: "40%" },
      { label: "SMV", value: "+4" },
      { label: "Acidity", value: "1.5" },
      { label: "Amino Acid", value: "1.1" },
      { label: "Yeast", value: "1801" },
    ],
    pairing: ["Yakitori", "Simmered pork belly", "Smoked trout"],
    pairingJp: ["焼き鳥", "豚の角煮", "鱒の燻製"],
    serveTemp: "Chilled 10°C · Warm 40°C",
    serveTempJp: "冷酒 10℃ ／ 燗 40℃",
    grade: "Smooth, Round",
    gradeJp: "まろやか・円熟",
    priceJpy: 3850,
    wholesalePriceJpy: 2310,
    caseSize: 6,
  },
  {
    slug: "daiginjo-aroma",
    name: "FUJISAN",
    variant: "SAMURAI",
    variantLine: "Junmai Ginjo",
    variantLineJp: "純米吟醸",
    smv: "SMV +5",
    title: "Fruity & Aromatic",
    titleJp: "果実味と芳醇な香り",
    desc: "Fruity notes with a delicate\nand graceful taste.",
    descJp: "果実味豊かに、\n繊細で優美な味わい。",
    img: "/images/bushido/junmai_daiginjo_01.png",
    hero: "A bouquet of orchard fruit\nunfolding across the tongue.",
    heroJp: "果樹園の花束のような香りが、\n口の中でほどけてゆく。",
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
      { label: "ABV", value: "15%" },
      { label: "Ingredients", value: "Rice / Rice Koji" },
      { label: "Rice", value: "Yamadanishiki (Hyogo) / Homarefuji (Shizuoka)" },
      { label: "Polish", value: "60%" },
      { label: "SMV", value: "+5" },
      { label: "Acidity", value: "1.0" },
      { label: "Amino Acid", value: "1.1" },
      { label: "Yeast", value: "HD101" },
    ],
    pairing: ["Sashimi", "Fresh goat cheese", "Stone fruit desserts"],
    pairingJp: ["刺身", "フレッシュなゴートチーズ", "桃や杏のデザート"],
    serveTemp: "Chilled 8°C",
    serveTempJp: "冷酒 8℃",
    grade: "Aromatic, Silky",
    gradeJp: "芳醇・絹のごとく",
    priceJpy: 7700,
    wholesalePriceJpy: 4620,
    caseSize: 6,
  },
  {
    slug: "daiginjo-rich",
    name: "FUJISAN",
    variant: "KOKORO",
    variantLine: "Junmai Ginjo",
    variantLineJp: "純米吟醸",
    smv: "SMV +8",
    title: "Rich & Full-Bodied",
    titleJp: "深く、豊潤な味わい",
    desc: "Deep umami with a\nluxurious, lingering finish.",
    descJp: "深い旨味と、\n贅沢に長い余韻。",
    img: "/images/bushido/junmai_daiginjo_02.png",
    hero: "A measured richness,\ndeep as the forest at dusk.",
    heroJp: "夕暮れの森のごとく、\n深く整った豊かさ。",
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
      { label: "ABV", value: "15%" },
      { label: "Ingredients", value: "Rice / Rice Koji" },
      { label: "Rice", value: "Yamadanishiki (Hyogo) / Homarefuji (Shizuoka)" },
      { label: "Polish", value: "60%" },
      { label: "SMV", value: "+8" },
      { label: "Acidity", value: "1.0" },
      { label: "Amino Acid", value: "1.2" },
      { label: "Yeast", value: "NEW5" },
    ],
    pairing: ["Wagyu tataki", "Smoked duck", "Matured hard cheese"],
    pairingJp: ["和牛のたたき", "鴨の燻製", "熟成したハードチーズ"],
    serveTemp: "Chilled 10°C · Lightly warm 35°C",
    serveTempJp: "冷酒 10℃ ／ ぬる燗 35℃",
    grade: "Rich, Full-bodied",
    gradeJp: "豊潤・コク",
    priceJpy: 8800,
    wholesalePriceJpy: 5280,
    caseSize: 6,
  },
  {
    slug: "junmai-bold",
    name: "FUJISAN",
    variant: "NINJA",
    variantLine: "Junmai Ginjo",
    variantLineJp: "純米吟醸",
    smv: "SMV +4",
    title: "Bold & Fresh",
    titleJp: "溌剌とした、瑞々しい一献",
    desc: "Vibrant and lively with\na crisp, refreshing taste.",
    descJp: "瑞々しく溌剌とした、\nキレのある爽やかな味わい。",
    img: "/images/bushido/junmai_ginjo_01.png",
    hero: "A bright, upward energy,\nas clear as spring water on stone.",
    heroJp: "石を打つ清水のように、\n澄んで上向きの活力。",
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
      { label: "ABV", value: "14%" },
      { label: "Ingredients", value: "Rice / Rice Koji" },
      { label: "Rice", value: "Yamadanishiki (Hyogo, Shizuoka)" },
      { label: "Polish", value: "60%" },
      { label: "SMV", value: "+4" },
      { label: "Acidity", value: "1.1" },
      { label: "Amino Acid", value: "1.1" },
      { label: "Yeast", value: "1401" },
    ],
    pairing: ["Oysters", "Ceviche", "Herb salad"],
    pairingJp: ["生牡蠣", "セビーチェ", "ハーブサラダ"],
    serveTemp: "Ice-cold 5–8°C",
    serveTempJp: "よく冷やして 5〜8℃",
    grade: "Dry, Vibrant",
    gradeJp: "辛口・溌剌",
    priceJpy: 4180,
    wholesalePriceJpy: 2500,
    caseSize: 6,
  },
  {
    slug: "junmai-ginjo",
    name: "FUJISAN",
    variant: "JUNMAI\nGINJO SAKE",
    variantLine: "Junmai Ginjo",
    variantLineJp: "純米吟醸",
    smv: "SMV +2",
    title: "Aromatic & Light",
    titleJp: "花のような、軽やかな香り",
    desc: "Floral aroma with a\nlight and smooth texture.",
    descJp: "花のような香りと、\n軽やかで滑らかな口当たり。",
    img: "/images/bushido/junmai_ginjo_02.png",
    hero: "A light, luminous ginjo,\nscented with early blossoms.",
    heroJp: "早春の花の香りを宿した、\n軽やかで澄んだ吟醸。",
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
    pairingJp: ["寿司", "冷たい蕎麦", "野菜の天ぷら"],
    serveTemp: "Chilled 10°C",
    serveTempJp: "冷酒 10℃",
    grade: "Light, Floral",
    gradeJp: "軽やか・花香",
    priceJpy: 4620,
    wholesalePriceJpy: 2770,
    caseSize: 6,
  },
];

export function getFujisanProductBySlug(slug: string) {
  return fujisanProducts.find((p) => p.slug === slug);
}
