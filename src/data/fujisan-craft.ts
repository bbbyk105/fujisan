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
  /** 日本語のリード */
  leadJp: string;
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
};

export const fujisanCraftPillars: CraftPillar[] = [
  {
    slug: "water",
    num: "01",
    chapter: "Ⅰ",
    eyebrow: "Water",
    title: "Water from Mt. Fuji",
    jp: "水",
    catchJp: "富士山の湧水",
    lead: "Snow that falls on Mt. Fuji filters down through the mountain for forty to sixty years and rises near the brewery as soft water.",
    leadJp:
      "富士山に降った雪が、40〜60年かけて山の中を下り、やわらかな軟水として蔵の近くに湧き出します。",
    storyTitle: "How the water reaches the brewery",
    storyTitleJp: "水が蔵に届くまで",
    storyEn: [
      "The water starts as snow on Mt. Fuji. Over the years it filters down through porous volcanic rock — basalt, scoria, and andesite — and loses its impurities on the way.",
      "It surfaces in springs near the brewery after forty to sixty years inside the mountain, as soft water: low in iron, manganese, and calcium. Water like this does not get in the way of koji and yeast, which is why it suits sake brewing.",
      "The brewery uses it as it comes, without treatment.",
    ],
    storyJp: [
      "富士山に積もった雪は、玄武岩や安山岩の層に染み込み、40〜60年かけて山の中を下ります。そのあいだに不純物がこされ、軟水として湧き出します。",
      "鉄分やマンガンが少ない軟水は、麹や酵母の働きを妨げにくいため、酒造りに向いています。",
      "蔵ではこの水を処理せず、そのまま仕込みに使っています。",
    ],
    heroImage: "/images/fujisan/features/water.webp",
    heroPosition: "object-[50%_42%]",
    detailImage: "/images/fujisan/art-of-sake/sake.webp",
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
        labelJp: "湧き出るまで",
        value: "40–60 yr",
        valueJp: "40〜60年",
        caption: "Filtered by basalt",
        captionJp: "玄武岩の層でこされる",
      },
      {
        label: "pH",
        labelJp: "pH",
        value: "7.2",
        valueJp: "7.2",
        caption: "Neutral",
        captionJp: "中性",
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
        descJp:
          "冬のあいだ、標高1,500〜3,776mの斜面に新雪が降り積もります。",
      },
      {
        num: "Ⅱ",
        en: "Filtration",
        jp: "濾過",
        desc: "Decades of slow descent through volcanic strata strip impurities from the meltwater.",
        descJp:
          "雪解け水は数十年かけて火山岩の層をゆっくり下り、そのあいだに不純物がこされます。",
      },
      {
        num: "Ⅲ",
        en: "Spring",
        jp: "湧出",
        desc: "Cool, soft water rises in the foothills near the brewery.",
        descJp: "冷たい軟水が、蔵の近くの麓に湧き出します。",
      },
      {
        num: "Ⅳ",
        en: "Brewing",
        jp: "醸造",
        desc: "Used as it comes to wash and steam the rice and to brew.",
        descJp: "この水をそのまま、洗米・蒸米・仕込みに使います。",
      },
    ],
  },
  {
    slug: "rice",
    num: "02",
    chapter: "Ⅱ",
    eyebrow: "Rice",
    title: "Sake rice",
    jp: "米",
    catchJp: "山田錦と誉富士",
    lead: "Two sake-rice varieties, Yamadanishiki and Homarefuji, grown by contract farms in Hyogo and Shizuoka.",
    leadJp:
      "使う酒米は山田錦と誉富士の2種類。兵庫県と静岡県の契約農家が育てています。",
    storyTitle: "How sake rice differs from table rice",
    storyTitleJp: "酒米と、ふだん食べる米のちがい",
    storyEn: [
      "Sake-rice is not the rice you eat at dinner. The grains are larger, the starch core (shinpaku) sits clearly at the heart of each kernel, and the outer layers — fats and proteins that would muddy the brew — are gently polished away.",
      "The brewery buys its rice from contract farms in Hyogo and Shizuoka. Some of them have supplied it for three generations.",
      "Polishing to 40–60% leaves only the starchy centre of each grain. Koji turns that starch into sugar, and yeast turns the sugar into alcohol.",
    ],
    storyJp: [
      "酒米は食用米とは別物です。粒は大きく、中心には心白という白い澱粉の塊があり、外側に多い脂質や蛋白質は、丁寧に磨いて削ぎ落とします。",
      "米は兵庫県と静岡県の契約農家から仕入れています。三代にわたって米を納めている農家もあります。",
      "精米歩合は40〜60%。外側を削り、澱粉の多い中心部だけを使います。麹がこの澱粉を糖に変え、酵母が糖をアルコールに変えます。",
    ],
    heroImage: "/images/fujisan/features/ricebox.webp",
    heroPosition: "object-[50%_46%]",
    detailImage: "/images/fujisan/art-of-sake/rice.webp",
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
        captionJp: "削ったあとに残る割合",
      },
      {
        label: "PARTNER FARMS",
        labelJp: "契約農家",
        value: "12",
        valueJp: "12 軒",
        caption: "Across 2 prefectures",
        captionJp: "兵庫・静岡",
      },
      {
        label: "HARVEST",
        labelJp: "収穫期",
        value: "Late Sep",
        valueJp: "9月下旬",
        caption: "Once the grain is fully ripe",
        captionJp: "穂が実りきってから",
      },
    ],
    steps: [
      {
        num: "Ⅰ",
        en: "Harvest",
        jp: "収穫",
        desc: "Sakamai is gathered late September after the grain has fully matured on the panicle.",
        descJp: "よく実った酒米を、9月下旬に刈り取ります。",
      },
      {
        num: "Ⅱ",
        en: "Polish",
        jp: "精米",
        desc: "The outer layers are milled away, leaving the starchy centre.",
        descJp: "外側を少しずつ削り、澱粉の多い中心部を残します。",
      },
      {
        num: "Ⅲ",
        en: "Wash & Steep",
        jp: "洗米",
        desc: "Each batch is washed and timed to the second to absorb just enough water.",
        descJp:
          "一仕込みごとに洗い、秒単位で時間を計って、必要なだけの水を吸わせます。",
      },
      {
        num: "Ⅳ",
        en: "Steam",
        jp: "蒸米",
        desc: "Slow steaming firms the outside while keeping the core soft for the koji.",
        descJp:
          "じっくり蒸して、外は硬く、中はやわらかく仕上げます。麹を育てやすい蒸米にするためです。",
      },
    ],
  },
  {
    slug: "brewing",
    num: "03",
    chapter: "Ⅲ",
    eyebrow: "Brewing",
    title: "Winter brewing",
    jp: "造り",
    catchJp: "冬の仕込み",
    lead: "From late October to March, the toji and kurabito of Makino Shuzo take the sake from koji-making to pressing.",
    leadJp:
      "10月下旬から3月までの冬のあいだに、牧野酒造の杜氏と蔵人が麹造りから搾りまでを行います。",
    storyTitle: "How the brewing season runs",
    storyTitleJp: "仕込みの流れ",
    storyEn: [
      "The Bushido series is brewed at Makino Shuzo Goshi Kaisha, at the foot of Mt. Fuji. The season starts in late October. Under the toji (master brewer), the kurabito wash and steam the rice, make koji, and build the mash through the winter.",
      "Koji is grown on cedar trays in a warm, humid room (muro) for about forty hours, with the temperature and humidity checked throughout. Yeast is first multiplied in a small starter (shubo); the main mash (moromi) then ferments at low temperature for three to four weeks.",
      "Most batches are pressed with an airbag press; some are drip-pressed in cloth bags (fukurozuri). The sake then rests at the brewery before bottling.",
    ],
    storyJp: [
      "武士道シリーズは、富士山麓の牧野酒造合資会社で造られています。仕込みは10月下旬に始まり、杜氏のもとで蔵人が洗米・蒸米・麹造り・仕込みを冬のあいだ続けます。",
      "麹は麹室で約40時間かけて育て、温度と湿度を確かめながら管理します。酒母で酵母を増やしたあと、本仕込みのもろみを低温で3〜4週間発酵させます。",
      "搾りは主にエアバッグ式の圧搾機で行い、一部の銘柄は、もろみを袋に入れて吊るし自然に落ちる雫を集める「袋吊り」で搾ります。搾った酒は、しばらく蔵で寝かせてから瓶に詰めます。",
    ],
    heroImage: "/images/fujisan/tohji.webp",
    heroPosition: "object-[50%_28%]",
    detailImage: "/images/fujisan/tohji.webp",
    stats: [
      {
        label: "BREW SEASON",
        labelJp: "仕込み期",
        value: "Late Oct → Mar",
        valueJp: "10月下旬〜3月",
        caption: "Through the winter",
        captionJp: "冬のあいだ",
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
        caption: "Head brewer",
        captionJp: "醸造の責任者",
      },
    ],
    steps: [
      {
        num: "Ⅰ",
        en: "Koji",
        jp: "麹造り",
        desc: "Steamed rice is cultured with koji-kin for forty hours in a warm cedar muro.",
        descJp:
          "蒸した米に麹菌をつけ、温かい杉の麹室で40時間かけて育てます。",
      },
      {
        num: "Ⅱ",
        en: "Shubo",
        jp: "酒母",
        desc: "Yeast is multiplied in a small starter before the main mash.",
        descJp: "本仕込みの前に、少量の酒母で酵母を増やします。",
      },
      {
        num: "Ⅲ",
        en: "Moromi",
        jp: "本仕込み",
        desc: "Three additions of rice, water, and koji over four days build the main mash.",
        descJp:
          "四日間に三度、米・水・麹を加える三段仕込みで、もろみを仕立てます。",
      },
      {
        num: "Ⅳ",
        en: "Press & Rest",
        jp: "搾り・熟成",
        desc: "The mash is pressed and the new sake rests at the brewery.",
        descJp: "もろみを搾り、できた酒を蔵で寝かせます。",
      },
    ],
  },
];

export function getCraftPillarBySlug(slug: string) {
  return fujisanCraftPillars.find((p) => p.slug === (slug as CraftSlug));
}
