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
  /**
   * 完売フラグ。true の SKU は購入不可（カート追加・決済を拒否）にする。
   * 在庫数の本格管理は将来 D1 テーブルに移すが、当面はこの手動フラグで運用する。
   * 品切れ時は該当 SKU に `soldOut: true` を足すだけ。
   */
  soldOut?: boolean;
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
    titleJp: "上品な香り、やや甘口",
    desc: "Banana and melon aromas\nwith a gentle, balanced sweetness.",
    descJp: "バナナやメロンのような香り。\nやさしく、バランスのよい甘み。",
    img: "/images/bushido/shogun.webp",
    storyEn: [
      "The most polished bottle in the Bushido series: a Junmai Daiginjo with the rice milled to 40%, made from Hyogo Yamadanishiki and brewed by Makino Shuzo at the foot of Mt. Fuji.",
      "A ginjo aroma of banana and melon comes first, then a smooth, lightly sweet body with a little acidity that keeps it fresh.",
      "Serve well chilled, with sushi or sashimi.",
    ],
    storyJp: [
      "武士道シリーズでいちばん磨いた、精米歩合40%の純米大吟醸です。\n兵庫県産の山田錦を使い、富士山麓の牧野酒造が造っています。",
      "バナナやメロンのような吟醸香。\n口当たりはなめらかでほのかに甘く、\nほどよい酸で後味は軽やかです。",
      "よく冷やして、寿司や刺身と合わせるのがおすすめです。",
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
    title: "Smooth & Slightly Sweet",
    titleJp: "なめらか、やや甘口",
    desc: "Banana and melon aromas\nover a smooth, gently sweet body.",
    descJp: "バナナやメロンのような香り。\nなめらかで、ほのかに甘い味わい。",
    img: "/images/bushido/tenka.webp",
    storyEn: [
      "A Junmai Daiginjo made from Hyogo Yamadanishiki polished to 50%.",
      "A ginjo aroma of banana and melon, and a smooth, lightly sweet taste that stays clean to the finish.",
      "Serve chilled, with sashimi or fresh seafood.",
    ],
    storyJp: [
      "兵庫県産の山田錦を精米歩合50%まで磨いた、純米大吟醸です。",
      "バナナやメロンのような吟醸香に、\nなめらかでほのかに甘い味わい。\n後味まですっきりとしています。",
      "冷やして、刺身や新鮮な魚介と合わせるのがおすすめです。",
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
    titleJp: "明るい果実の香り、すっきり",
    desc: "A bright ginjo bouquet of banana and melon;\nclean, smooth, and refreshing.",
    descJp: "バナナやメロンのような明るい吟醸香。\nなめらかで、爽やかな味わい。",
    img: "/images/bushido/samurai01.webp",
    storyEn: [
      "A Junmai Ginjo polished to 60%, made from Hyogo Yamadanishiki blended with Homarefuji, a sake rice bred in Shizuoka.",
      "A bright ginjo aroma of banana and melon, with a clean, smooth, refreshing body and a balanced sweetness.",
      "Serve well chilled, with seafood, grilled fish, or tempura.",
    ],
    storyJp: [
      "兵庫県産の山田錦に、静岡県で生まれた酒米・誉富士を合わせ、\n精米歩合60%まで磨いた純米吟醸です。",
      "バナナやメロンのような明るい吟醸香。\nなめらかで爽やか、甘みとのバランスもとれた味わいです。",
      "よく冷やして、魚介や焼き魚、天ぷらと合わせて。",
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
    titleJp: "軽やかな辛口",
    desc: "Light fruit with subtle banana notes;\ncrisp, dry, and clean to the finish.",
    descJp: "ほのかにバナナを感じる軽い香り。\nきりっとした辛口で、後味はすっきり。",
    img: "/images/bushido/ninja.webp",
    storyEn: [
      "A Tokubetsu Junmai polished to 60%, made from Yamadanishiki grown in Hyogo and Shizuoka and kept light at 14% alcohol.",
      "A light, fruity aroma with a hint of banana, then a crisp, dry, refreshing taste with a short, clean finish.",
      "Serve chilled or at room temperature with yakitori, grilled fish, or savory Japanese dishes.",
    ],
    storyJp: [
      "兵庫県産と静岡県産の山田錦を精米歩合60%まで磨き、\nアルコール度数を14%に抑えた特別純米です。",
      "ほのかにバナナを感じる軽い果実香。\nきりっとした辛口で、後味はすっきりしています。",
      "焼き鳥や焼き魚、味のしっかりした料理と合わせて。\n冷やしても、常温でもおいしく飲めます。",
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
    title: "Clean & Dry",
    titleJp: "キレのある辛口",
    desc: "Delicate floral notes; clean and crisp\nwith a smooth, dry finish.",
    descJp: "ほのかに花のような香り。\nキレのよい辛口で、後味はなめらか。",
    img: "/images/bushido/kokoro.webp",
    storyEn: [
      "A Tokubetsu Honjozo polished to 60%, made from Hyogo Yamadanishiki and Shizuoka Homarefuji — easy to drink with everyday meals.",
      "Light, with a faint floral aroma, clean and crisp, and the driest of the series at SMV +8.",
      "Serve chilled or at room temperature, with yakitori, grilled seafood, or an ordinary dinner.",
    ],
    storyJp: [
      "兵庫県産の山田錦と静岡県産の誉富士を合わせ、\n精米歩合60%まで磨いた特別本醸造です。\n毎日の食事に合わせやすい一本です。",
      "軽やかで、ほのかに花のような香り。\nキレがあり、日本酒度+8とシリーズでいちばんの辛口です。",
      "焼き鳥や焼いた魚介、ふだんの食事と合わせて。\n冷やしても、常温でもおいしく飲めます。",
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
    pairingJp: ["焼き鳥", "焼いた魚介", "ふだんの食事"],
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

/** その SKU（容量）が完売か。 */
export function isVolumeSoldOut(volume: FujisanVolume): boolean {
  return volume.soldOut === true;
}

/** 商品の全 SKU が完売か（購入導線を丸ごと閉じる判定に使う）。 */
export function isProductSoldOut(product: FujisanProduct): boolean {
  return product.volumes.every((v) => v.soldOut === true);
}

/**
 * SKU の一意キー（`${slug}__${ml}`）。
 *
 * 在庫・価格・実勢カタログ・クライアントのキャッシュで同じ規則を使う。
 * 各所で文字列連結を書くと、片方だけ `-` 区切りにした瞬間に
 * 「引けるはずの行が引けない」種類のバグになる。
 * この関数はサーバー専用の依存を持たないので、クライアントからも読める。
 */
export function skuKey(slug: string, ml: number): string {
  return `${slug}__${ml}`;
}
