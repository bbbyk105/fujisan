export type CraftSlug = "water" | "rice" | "brewing";

export type CraftStat = {
  label: string;
  /** 日本語のラベル */
  labelJp: string;
  value: string;
  /** 日本語の値（単位や語を日本語化） */
  valueJp: string;
  caption?: string;
  /** 日本語のキャプション */
  captionJp?: string;
};

export type CraftStep = {
  num: string;
  en: string;
  jp: string;
  desc: string;
  /** 日本語の説明 */
  descJp: string;
};

export type CraftPillar = {
  slug: CraftSlug;
  num: string;
  chapter: string;
  eyebrow: string;
  title: string;
  jp: string;
  catchJp: string;
  lead: string;
  storyTitle: string;
  /** 日本語のストーリー見出し */
  storyTitleJp: string;
  storyEn: string[];
  storyJp: string[];
  heroImage: string;
  heroPosition: string;
  detailImage: string;
  stats: CraftStat[];
  steps: CraftStep[];
  pullQuote: string;
  /** 日本語のプルクオート */
  pullQuoteJp: string;
};

export const fujisanCraftPillars: CraftPillar[] = [
  {
    slug: "water",
    num: "01",
    chapter: "Ⅰ",
    eyebrow: "PURE WATER",
    title: "FROM MT. FUJI",
    jp: "富士の水",
    catchJp: "山が静かに、水を磨く。",
    lead: "Snowmelt that has slept inside Mt. Fuji for half a century reaches our brewhouse soft, pure, and almost weightless on the tongue.",
    storyTitle: "A river that began in the snow",
    storyTitleJp: "雪から始まる、一筋の水",
    storyEn: [
      "Every drop of Fujisan sake begins with snow that fell on Mt. Fuji long before our brewers were born. Slowly, year after year, it filters down through layers of porous volcanic rock — basalt, scoria, and andesite — losing impurities and gaining minerals at a measured, patient rhythm.",
      "By the time the water surfaces in the springs surrounding our brewhouse, it has spent forty to sixty years inside the mountain. The result is what brewers call ‘soft water’ — low in iron, low in manganese, gentle in calcium — the ideal canvas for koji and yeast to bloom slowly and cleanly.",
      "We never treat it. We never alter its mineral balance. We simply receive it, and let the mountain decide the temper of every batch.",
    ],
    storyJp: [
      "富士山に降り積もった雪が、長い時間をかけて山の岩盤に染み込み、玄武岩や安山岩の層を四十年から六十年かけて静かに下りてきます。不純物は濾され、ミネラルは穏やかに整えられ、酒造りに理想的な軟水として湧き出します。",
      "鉄分やマンガンが少なく、口当たりは絹のよう。麹と酵母が穏やかに息をするための、最良の余白です。",
      "私たちは水に手を加えません。山が決めた水の表情を、そのまま酒に映します。",
    ],
    heroImage: "/images/fujisan/features/water.png",
    heroPosition: "object-[50%_42%]",
    detailImage: "/images/fujisan/art-of-sake/sake.png",
    stats: [
      {
        label: "MINERAL TYPE",
        labelJp: "水質",
        value: "Soft",
        valueJp: "軟水",
        caption: "Low Fe / Mn",
        captionJp: "鉄・マンガンが少ない",
      },
      {
        label: "AGE OF SPRING",
        labelJp: "湧水の年齢",
        value: "40–60 yr",
        valueJp: "40〜60年",
        caption: "Filtered by basalt",
        captionJp: "玄武岩が濾過",
      },
      {
        label: "pH",
        labelJp: "pH",
        value: "7.2",
        valueJp: "7.2",
        caption: "Neutral, brewer-friendly",
        captionJp: "中性・醸造に最適",
      },
      {
        label: "USE PER BOTTLE",
        labelJp: "一本あたりの使用量",
        value: "≈ 7L",
        valueJp: "約 7L",
        caption: "Wash · steam · ferment",
        captionJp: "洗米・蒸し・発酵",
      },
    ],
    steps: [
      {
        num: "Ⅰ",
        en: "Snowfall",
        jp: "降雪",
        desc: "Fresh snow settles on the slopes between 1,500m and 3,776m through long Fuji winters.",
        descJp: "長い富士の冬を通じて、標高1,500m〜3,776mの斜面に新雪が降り積もります。",
      },
      {
        num: "Ⅱ",
        en: "Filtration",
        jp: "濾過",
        desc: "Decades of slow descent through volcanic strata strip impurities from the meltwater.",
        descJp: "火山岩の層を数十年かけてゆっくり下る間に、雪解け水から不純物が取り除かれます。",
      },
      {
        num: "Ⅲ",
        en: "Spring",
        jp: "湧出",
        desc: "Cool, soft, mineral-balanced water rises in the foothills around the brewhouse.",
        descJp: "冷たく、やわらかく、ミネラルの整った水が、蔵の周りの麓に湧き出します。",
      },
      {
        num: "Ⅳ",
        en: "Brewing",
        jp: "醸造",
        desc: "Used unaltered to wash, steam, and brew — every Fujisan bottle carries the mountain.",
        descJp: "手を加えずに洗米・蒸し・仕込みへ。富士山の一本一本が、山を宿します。",
      },
    ],
    pullQuote: "“The water is the silence that lets the rice speak.”",
    pullQuoteJp: "「水は、米に語らせるための静けさである。」",
  },
  {
    slug: "rice",
    num: "02",
    chapter: "Ⅱ",
    eyebrow: "PREMIUM RICE",
    title: "THE GRAINS OF JAPAN",
    jp: "厳選米",
    catchJp: "粒の中心に、酒の真ん中がある。",
    lead: "Yamadanishiki and Homarefuji — heirloom sakamai grown by partner farms whose families have polished their craft alongside ours for generations.",
    storyTitle: "Rice grown for sake, not for the table",
    storyTitleJp: "食べるためでなく、醸すための米",
    storyEn: [
      "Sake-rice is not the rice you eat at dinner. The grains are larger, the starch core (shinpaku) sits clearly at the heart of each kernel, and the outer layers — fats and proteins that would muddy the brew — are gently polished away.",
      "We work directly with terraced farms in Hyogo and Shizuoka. Their soil, their water, and their hands shape the ingredient long before it ever reaches our tanks. Some plots have been brewing for us across three generations.",
      "Polishing rates of 40–60% strip the kernels back to their starchy heart. What remains is essence: clean sugars that the koji will translate into the soul of the sake.",
    ],
    storyJp: [
      "酒米は食用米とは別物です。粒は大きく、中心には心白という白い澱粉の塊があり、外側に多い脂質や蛋白質は、丁寧に磨いて削ぎ落とします。",
      "兵庫・静岡の契約農家とともに、土と水と人の仕事から米を選びます。三代にわたり弊蔵に米を届けてくださる田もあります。",
      "精米歩合四十%から六十%。残るのは粒の真ん中、澱粉の核だけ。麹はこの清らかな糖を、酒の魂へと翻訳していきます。",
    ],
    heroImage: "/images/fujisan/features/ricebox.png",
    heroPosition: "object-[50%_46%]",
    detailImage: "/images/fujisan/art-of-sake/rice.png",
    stats: [
      {
        label: "VARIETIES",
        labelJp: "品種",
        value: "2",
        valueJp: "2 種",
        caption: "Yamadanishiki · Homarefuji",
        captionJp: "山田錦・誉富士",
      },
      {
        label: "POLISH RATE",
        labelJp: "精米歩合",
        value: "40–60%",
        valueJp: "40〜60%",
        caption: "By weight remaining",
        captionJp: "残る重量比",
      },
      {
        label: "PARTNER FARMS",
        labelJp: "契約農家",
        value: "12",
        valueJp: "12 軒",
        caption: "Across 2 prefectures",
        captionJp: "2 県にわたる",
      },
      {
        label: "HARVEST",
        labelJp: "収穫期",
        value: "Late Sep",
        valueJp: "9月下旬",
        caption: "Hand-checked rows",
        captionJp: "一畝ずつ手で確認",
      },
    ],
    steps: [
      {
        num: "Ⅰ",
        en: "Harvest",
        jp: "収穫",
        desc: "Sakamai is gathered late September after the grain has fully matured on the panicle.",
        descJp: "穂の上で十分に実った酒米を、9月下旬に収穫します。",
      },
      {
        num: "Ⅱ",
        en: "Polish",
        jp: "精米",
        desc: "Outer bran is gradually removed; only the starchy heart remains for the brewer.",
        descJp: "外側の糠を少しずつ削り、澱粉質の芯だけを蔵人のために残します。",
      },
      {
        num: "Ⅲ",
        en: "Wash & Steep",
        jp: "洗米",
        desc: "Each batch is washed and timed to the second to absorb just enough water.",
        descJp: "一仕込みごとに洗い、秒単位で時間を計って、必要なだけの水を吸わせます。",
      },
      {
        num: "Ⅳ",
        en: "Steam",
        jp: "蒸米",
        desc: "Slow steaming firms the outside while keeping the core soft for the koji.",
        descJp: "じっくり蒸すことで外側を締め、麹のために芯はやわらかく保ちます。",
      },
    ],
    pullQuote:
      "“We grow rice the way you would grow a vintage — slowly, with the same hands.”",
    pullQuoteJp:
      "「ワインのヴィンテージのように、同じ手で、ゆっくりと米を育てる。」",
  },
  {
    slug: "brewing",
    num: "03",
    chapter: "Ⅲ",
    eyebrow: "TRADITIONAL BREWING",
    title: "THE HAND OF THE TOJI",
    jp: "伝統醸造",
    catchJp: "蔵人の手、季節の声。",
    lead: "Across a hundred winter days the toji and his kurabito coax water, rice, and koji into a sake that carries Mt. Fuji’s stillness.",
    storyTitle: "A hundred days of winter",
    storyTitleJp: "冬の、百日",
    storyEn: [
      "Brewing season opens in late autumn, when the first frost descends from the upper slopes. From that morning the toji — our master brewer — leads the kurabito in an unbroken hundred-day rhythm of washing, steaming, and tending.",
      "Koji is grown on cedar trays in a warm, humid muro for forty hours, checked by eye and palm. The shubo, the seed mash, is built slowly so that yeast multiplies without strain. The main mash, moromi, ferments for three to four weeks at low temperature, every change noted by hand.",
      "Pressing is done gently, often by airbag, sometimes by the slow drip of fukurozuri for our most delicate cuvées. Then the sake rests in the darkness of the brewery — listening, settling, becoming itself.",
    ],
    storyJp: [
      "仕込みは初霜の頃に始まります。杜氏のもと、蔵人たちは百日の冬を、洗い・蒸し・育てるという連続したリズムで通り抜けます。",
      "麹は四十時間、麹室で育てられ、手と目で温度と湿度を確かめます。酒母は無理をせず、酵母が静かに増えるよう導きます。本仕込みは三〜四週間、低温で進めながら、毎日の変化を一手に記録します。",
      "搾りはやさしく。最も繊細な銘柄には、袋に詰めて雫を集める袋吊りも。酒は蔵の闇でしばらく休み、自分自身になっていきます。",
    ],
    heroImage: "/images/fujisan/toji.png",
    heroPosition: "object-[50%_28%]",
    detailImage: "/images/fujisan/toji.png",
    stats: [
      {
        label: "BREW SEASON",
        labelJp: "仕込み期",
        value: "Late Oct → Mar",
        valueJp: "10月下旬〜3月",
        caption: "100 winter days",
        captionJp: "冬の百日",
      },
      {
        label: "MASH TIME",
        labelJp: "もろみ日数",
        value: "21–28 d",
        valueJp: "21〜28日",
        caption: "Low-temp fermentation",
        captionJp: "低温発酵",
      },
      {
        label: "KOJI MURO",
        labelJp: "麹室",
        value: "32°C / 60%",
        valueJp: "32℃ / 60%",
        caption: "Cedar-tray cultivation",
        captionJp: "杉箱で製麹",
      },
      {
        label: "TOJI",
        labelJp: "杜氏",
        value: "1 master",
        valueJp: "一人",
        caption: "Lifelong apprenticeship",
        captionJp: "生涯をかけた修練",
      },
    ],
    steps: [
      {
        num: "Ⅰ",
        en: "Koji",
        jp: "麹造り",
        desc: "Steamed rice is cultured with koji-kin for forty hours in a warm cedar muro.",
        descJp: "蒸した米に麹菌をつけ、温かい杉の麹室で四十時間かけて育てます。",
      },
      {
        num: "Ⅱ",
        en: "Shubo",
        jp: "酒母",
        desc: "A small, concentrated yeast mash is grown patiently before it scales up.",
        descJp: "小さく濃い酒母を、量を増やす前にじっくりと育てます。",
      },
      {
        num: "Ⅲ",
        en: "Moromi",
        jp: "本仕込み",
        desc: "Three additions of rice, water, and koji over four days build the main mash.",
        descJp: "四日間に三度、米・水・麹を加える三段仕込みで、もろみを仕立てます。",
      },
      {
        num: "Ⅳ",
        en: "Press & Rest",
        jp: "搾り・熟成",
        desc: "The mash is gently pressed and the young sake rests in the cold of the brewery.",
        descJp: "もろみをやさしく搾り、若い酒は蔵の寒さの中で静かに休みます。",
      },
    ],
    pullQuote: "“We do not make sake. We listen, and the season makes it for us.”",
    pullQuoteJp:
      "「私たちは酒を造らない。耳を澄ませば、季節が醸してくれる。」",
  },
];

export function getCraftPillarBySlug(slug: string) {
  return fujisanCraftPillars.find((p) => p.slug === (slug as CraftSlug));
}
