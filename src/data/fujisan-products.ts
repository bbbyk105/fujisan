/** 容量ごとの SKU。価格は容量ごとに異なる。 */
export type FujisanVolume = {
  /** 内容量（ml） */
  ml: number;
  /** 税込小売価格（円） */
  priceJpy: number;
  /** 卸価格（税抜・1本あたり、円）= 価格表の CIF JPY。ログイン済みの取扱店のみに表示する。 */
  wholesalePriceJpy: number;
  /** 卸の1ケース入数（300ml×12／180ml×24） */
  caseSize: number;
};

export type FujisanProduct = {
  slug: string;
  name: string;
  variant: string;
  /** 銘柄名の漢字表記（例: 「将軍」） */
  variantJp: string;
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
  /** 容量ごとの価格。先頭が既定 SKU（300ml）。 */
  volumes: FujisanVolume[];
};

export const fujisanProducts: FujisanProduct[] = [
  {
    slug: "shogun",
    name: "FUJISAN",
    variant: "SHOGUN",
    variantJp: "将軍",
    variantLine: "Junmai Daiginjo",
    variantLineJp: "純米大吟醸",
    smv: "SMV +4",
    title: "Refined & Slightly Sweet",
    titleJp: "気高く、やわらかな甘み",
    desc: "Elegant banana and melon aromatics\nwith a gentle, balanced sweetness.",
    descJp: "バナナやメロンを思わせる気品ある香り。\nやさしく均整のとれた甘み。",
    img: "/images/bushido/shogun.png",
    hero: "The aroma of a leader —\ncomposed, generous, and sure.",
    heroJp: "将たる者の香り。\n泰然として、ゆたかに、確かに。",
    catchJp: "頂に立つ、一献。",
    storyEn: [
      "Polished to 40%, Shogun is the flagship of the Bushido series — a Junmai Daiginjo of quiet authority, brewed from Hyogo Yamadanishiki at the foot of Mt. Fuji.",
      "An elegant ginjo aroma of banana and melon rises first, then a smooth, gently sweet body settles with a soft acidity that keeps every sip fresh.",
      "Serve it chilled with sushi or the finest seafood — a bottle made to lead the table.",
    ],
    storyJp: [
      "精米歩合四十%。武士道シリーズの旗艦であり、\n静かな威厳を宿す純米大吟醸。\n兵庫産山田錦を、富士の麓で醸します。",
      "まずバナナとメロンを思わせる気品ある吟醸香が立ち、\nなめらかでほのかに甘い酒質を、\nやわらかな酸が支えて最後まで瑞々しく。",
      "寿司や上質な魚介とともに、よく冷やして。\n食卓を率いる一本です。",
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
    pairing: ["Sushi", "Sashimi", "Fresh seafood"],
    pairingJp: ["寿司", "刺身", "新鮮な魚介"],
    serveTemp: "Chilled 8–12°C",
    serveTempJp: "冷酒 8〜12℃",
    grade: "Light, Slightly Sweet",
    gradeJp: "淡麗・やや甘口",
    volumes: [
      { ml: 300, priceJpy: 2750, wholesalePriceJpy: 1651, caseSize: 12 },
      { ml: 180, priceJpy: 1950, wholesalePriceJpy: 1155, caseSize: 24 },
    ],
  },
  {
    slug: "tenka",
    name: "FUJISAN",
    variant: "TENKA",
    variantJp: "天下",
    variantLine: "Junmai Daiginjo",
    variantLineJp: "純米大吟醸",
    smv: "SMV +3",
    title: "Serene & Elegant",
    titleJp: "天下を映す、澄んだ甘み",
    desc: "Elegant banana-and-melon aromatics\nover a smooth, gently sweet body.",
    descJp: "バナナとメロンの優雅な香り。\nなめらかで、ほのかに甘い酒質。",
    img: "/images/bushido/tenka.png",
    hero: "Wide as the sky over the plain,\nclear and unhurried.",
    heroJp: "平野を覆う空のように、\n澄んで、ゆるやかに。",
    catchJp: "天の下、あまねく。",
    storyEn: [
      "Tenka — 'all under heaven' — is a Junmai Daiginjo polished to 50%, brewed from Hyogo Yamadanishiki for a composed, expansive character.",
      "The same elegant ginjo perfume of banana and melon leads into a smooth, lightly sweet flavor, clean and balanced from first sip to last.",
      "A sake for unhurried evenings — serve chilled with sashimi and fresh seafood.",
    ],
    storyJp: [
      "「天下」― あまねく天の下へ。\n兵庫産山田錦を五十%まで磨いた純米大吟醸は、\n泰然として、ひろやかな佇まいをまといます。",
      "バナナとメロンの優雅な吟醸香から、\nなめらかでほのかに甘い味わいへ。\n一口目から最後まで、澄んで均整のとれた酒。",
      "ゆるやかな夜のために。\n刺身や新鮮な魚介とともに、冷やしてどうぞ。",
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
    pairing: ["Sushi", "Sashimi", "Fresh seafood"],
    pairingJp: ["寿司", "刺身", "新鮮な魚介"],
    serveTemp: "Chilled 8–12°C",
    serveTempJp: "冷酒 8〜12℃",
    grade: "Light, Slightly Sweet",
    gradeJp: "淡麗・やや甘口",
    volumes: [
      { ml: 300, priceJpy: 2750, wholesalePriceJpy: 1651, caseSize: 12 },
      { ml: 180, priceJpy: 1950, wholesalePriceJpy: 1155, caseSize: 24 },
    ],
  },
  {
    slug: "samurai",
    name: "FUJISAN",
    variant: "SAMURAI",
    variantJp: "侍",
    variantLine: "Junmai Ginjo",
    variantLineJp: "純米吟醸",
    smv: "SMV +5",
    title: "Bright & Balanced",
    titleJp: "凛とした、果実の香り",
    desc: "A bright ginjo bouquet of banana and melon;\nclean, smooth, and refreshing.",
    descJp: "バナナとメロンの明るい吟醸香。\n澄んで滑らか、爽やかな味わい。",
    img: "/images/bushido/samurai01.png",
    hero: "Upright and unwavering,\nbright as a drawn blade.",
    heroJp: "抜き身のように明るく、\nまっすぐに澄んで。",
    catchJp: "凛として、まっすぐに。",
    storyEn: [
      "Samurai is a Junmai Ginjo polished to 60%, blending Hyogo Yamadanishiki with Homarefuji bred here in Shizuoka.",
      "A bright ginjo aroma of banana and melon meets a clean, smooth, refreshing body with a balanced sweetness — direct and honest.",
      "Pair it with seafood, grilled fish, or tempura, well chilled.",
    ],
    storyJp: [
      "侍 ― 兵庫産山田錦に、\n静岡で生まれた誉富士を合わせ、\n六十%まで磨いた純米吟醸。",
      "バナナとメロンの明るい吟醸香に、\n澄んでなめらか、爽やかな酒質。\nまっすぐで、まじりけのない一杯です。",
      "魚介や焼き魚、天ぷらとともに、\nよく冷やして。",
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
    pairing: ["Seafood", "Grilled fish", "Tempura"],
    pairingJp: ["魚介", "焼き魚", "天ぷら"],
    serveTemp: "Chilled 8–12°C",
    serveTempJp: "冷酒 8〜12℃",
    grade: "Light, Slightly Sweet",
    gradeJp: "淡麗・やや甘口",
    volumes: [
      { ml: 300, priceJpy: 2100, wholesalePriceJpy: 1254, caseSize: 12 },
    ],
  },
  {
    slug: "ninja",
    name: "FUJISAN",
    variant: "NINJA",
    variantJp: "忍",
    variantLine: "Tokubetsu Junmai",
    variantLineJp: "特別純米",
    smv: "SMV +4",
    title: "Crisp & Dry",
    titleJp: "影のように、軽やかな辛口",
    desc: "Light fruit with subtle banana notes;\ncrisp, dry, and clean to the finish.",
    descJp: "ほのかなバナナを含む軽い果実香。\nきりっと辛口、澄んだ後味。",
    img: "/images/bushido/ninja.png",
    hero: "Silent, swift, and clean —\ngone before you notice.",
    heroJp: "音もなく、すばやく、澄んで。\n気づけば、消えている。",
    catchJp: "音もなく、軽やかに。",
    storyEn: [
      "Ninja is a Tokubetsu Junmai polished to 60%, brewed from Yamadanishiki grown in Hyogo and Shizuoka at a light 14% alcohol.",
      "A light fruity aroma with a whisper of banana opens to a crisp, dry, refreshing palate that finishes clean and quick.",
      "Serve chilled or at room temperature with yakitori, grilled fish, or savory Japanese dishes.",
    ],
    storyJp: [
      "忍 ― 兵庫と静岡の山田錦を六十%まで磨き、\nアルコール十四%に抑えて軽やかに仕上げた特別純米。",
      "ほのかにバナナを含む軽い果実香から、\nきりっと辛口で爽やかな味わいへ。\n後味は澄んで、すっと消えていきます。",
      "焼き鳥や焼き魚、味のしっかりした料理とともに、\n冷やしても、常温でも。",
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
    pairing: ["Yakitori", "Grilled fish", "Tempura"],
    pairingJp: ["焼き鳥", "焼き魚", "天ぷら"],
    serveTemp: "Chilled or room temperature 10–15°C",
    serveTempJp: "冷酒〜常温 10〜15℃",
    grade: "Light, Dry",
    gradeJp: "淡麗・辛口",
    volumes: [
      { ml: 300, priceJpy: 1850, wholesalePriceJpy: 1105, caseSize: 12 },
    ],
  },
  {
    slug: "kokoro",
    name: "FUJISAN",
    variant: "KOKORO",
    variantJp: "心",
    variantLine: "Tokubetsu Honjozo",
    variantLineJp: "特別本醸造",
    smv: "SMV +8",
    title: "Quiet & Dry",
    titleJp: "こころを澄ます、辛口",
    desc: "Delicate floral notes; clean and crisp\nwith a smooth, dry finish.",
    descJp: "繊細な花の香り。澄んでキレがあり、\nなめらかな辛口の後味。",
    img: "/images/bushido/kokoro.png",
    hero: "Plain and unadorned,\nthe quiet center of things.",
    heroJp: "飾らず、ありのままに。\nものごとの静かな芯。",
    catchJp: "こころを、ひとつに。",
    storyEn: [
      "Kokoro — 'heart' — is a Tokubetsu Honjozo polished to 60%, blending Hyogo Yamadanishiki with Shizuoka Homarefuji for an everyday companion.",
      "Light and delicate with subtle floral notes, it is clean and crisp with a distinctly dry finish — the driest of the series at +8.",
      "An honest table sake: serve chilled or at room temperature with yakitori, grilled seafood, or simply with dinner.",
    ],
    storyJp: [
      "心 ― 兵庫産山田錦と静岡の誉富士を合わせ、\n六十%まで磨いた特別本醸造。\n日々の食卓に寄り添う一本です。",
      "軽やかで繊細、ほのかに花を思わせる香り。\n澄んでキレがあり、日本酒度+8の\nシリーズ随一のすっきりとした辛口。",
      "気取らない食中酒として、焼き鳥や焼いた魚介、\nふだんの夕餉とともに。冷やしても、常温でも。",
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
    pairing: ["Yakitori", "Grilled seafood", "Everyday dining"],
    pairingJp: ["焼き鳥", "焼いた魚介", "日々の食卓"],
    serveTemp: "Chilled or room temperature 10–15°C",
    serveTempJp: "冷酒〜常温 10〜15℃",
    grade: "Dry",
    gradeJp: "辛口",
    volumes: [
      { ml: 300, priceJpy: 1600, wholesalePriceJpy: 956, caseSize: 12 },
    ],
  },
];

export function getFujisanProductBySlug(slug: string) {
  return fujisanProducts.find((p) => p.slug === slug);
}

/** 既定 SKU（先頭の容量＝300ml）。 */
export function primaryVolume(product: FujisanProduct): FujisanVolume {
  return product.volumes[0];
}

/** 指定容量の SKU を返す。存在しなければ undefined。 */
export function findVolume(
  product: FujisanProduct,
  ml: number,
): FujisanVolume | undefined {
  return product.volumes.find((v) => v.ml === ml);
}
