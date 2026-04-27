export interface BushidoDesign {
  letter: string;
  name: string;
  slug: string;
  subtitle: string;
  bottle: string;
  capSeal: string;
  image: string;
  imageBg: string;
  imageScene: string;
  imageDark: string;
  virtue: string;
  virtueJp: string;
  descriptionEn: string[];
  descriptionJp: string[];
  tastingNote: string;
}

export const bushidoDesigns: BushidoDesign[] = [
  {
    letter: "A",
    name: "White Peak",
    slug: "white-peak",
    subtitle: "FUJI SAMURAI — WHITE PEAK",
    bottle: "White Bottle",
    capSeal: "Black",
    image: "/images/bushido/junmai_daiginjo_01.png",
    imageBg: "/images/junmai_daiginjo_01.jpg",
    imageScene: "/images/bushido/scenes/a_white_peak.jpg",
    imageDark: "/images/bushido/dark/a_white_peak.jpg",
    virtue: "Rectitude",
    virtueJp: "義",
    descriptionEn: [
      "Mount Fuji stands in silver silence. In the frozen air, a warlord remains unwavering.",
      "Reflecting that spirit, this sake is crisp and disciplined — quiet in expression, yet powerful at its core. On the palate, refined clarity unfolds smoothly, followed by a structured depth that rises with calm strength.",
      "This is not a sake of battle, but of self-mastery and inner resolve.",
      "The austere beauty of winter beneath Mount Fuji — the spirit of Bushido, sealed within a single bottle.",
    ],
    descriptionJp: [
      "白銀の静寂に包まれた霊峰富士。\n凍てつく空気の中、\n揺るがず佇む武将の姿。",
      "その精神を映すように、\nこの一杯は凛として澄み、\n静かでありながら、芯に強い力を秘めています。\n\n口に含めば、\n透明感のある滑らかな広がりと、\n奥底に宿る確かな旨味が\nゆっくりと立ち上がる。",
      "それは戦いのための酒ではない。\n己を律し、\n志を静かに燃やすための酒。",
      "冬の富士が教える、\n日本の美と武士の精神。\nその凛とした世界観を、\nこの一本に封じ込めました。",
    ],
    tastingNote: "Crisp clarity · Disciplined structure · Calm strength",
  },
  {
    letter: "B",
    name: "Ninja Veil",
    slug: "ninja-veil",
    subtitle: "FUJI NINJA VEIL",
    bottle: "Light Aqua Transparent Bottle",
    capSeal: "Blue",
    image: "/images/bushido/junmai_ginjo_02.png",
    imageBg: "/images/junmai_ginjo_02.jpg",
    imageScene: "/images/bushido/scenes/b_ninja_veil.jpg",
    imageDark: "/images/bushido/dark/b_ninja_veil.jpg",
    virtue: "Courage",
    virtueJp: "勇",
    descriptionEn: [
      "Beneath Mount Fuji, where blue blizzards veil the world, a ninja moves without sound.",
      "Reflecting that presence, this sake is crisp, precise, and restrained. It opens with a cool clarity, smooth and refined, then reveals a quiet depth of umami that lingers with controlled strength. Never loud — yet undeniably present.",
      "This is not a drink of display, but one of discipline and silent resolve.",
      "The spirit of Fuji, hidden within a drifting veil — captured in a single bottle.",
    ],
    descriptionJp: [
      "蒼き吹雪がすべてを覆う、\n霊峰富士の麓。\n雪と霧の帳の中を、\n音もなく進む忍。",
      "その姿を映すように、\nこの酒は澄みきり、鋭く、そして静か。\n\nひと口目は透明な冷気のように\n滑らかに広がり、\nやがて芯のある旨味が\nゆっくりと姿を現す。\n\n派手さはない。\nだが、確かな存在感が長く続く。",
      "それは力を誇示するためではなく、\n己を律し、\n密やかに志を貫くための一杯。",
      "白き帳に包まれた富士の気配を、\nこの一本に封じ込めた。",
    ],
    tastingNote: "Cool clarity · Precise restraint · Lingering presence",
  },
  {
    letter: "C",
    name: "White Dominion",
    slug: "white-dominion",
    subtitle: "FUJI SHOGUN — WHITE DOMINION",
    bottle: "White Bottle",
    capSeal: "Red",
    image: "/images/bushido/junmai_ginjo_01.png",
    imageBg: "/images/junmai_ginjo_01.jpg",
    imageScene: "/images/bushido/scenes/c_white_dominion.jpg",
    imageDark: "/images/bushido/dark/c_white_dominion.jpg",
    virtue: "Benevolence",
    virtueJp: "仁",
    descriptionEn: [
      "Mount Fuji stands in a realm of white. A shogun rides through the storm, commanding the frozen expanse.",
      "Reflecting that authority, this sake is bold and unwavering. Sharp yet crystalline, it reveals a structured depth of umami that lingers with commanding presence.",
      "This is not a drink of mere power, but of mastery — over nature, over oneself.",
      "The spirit that rules the white dominion, sealed within a single bottle.",
    ],
    descriptionJp: [
      "白銀に染まる霊峰富士。\n荒れ狂う雪原を駆ける将軍の姿。",
      "その威厳と統率を映すように、\nこの一杯は力強く、揺るがない。\n\n鋭さの中に澄んだ透明感を宿し、\n重厚な旨味が静かに広がり、\n長い余韻へと続く。",
      "それは力を誇示するための酒ではない。\n自然を、そして己を統べるための一杯。",
      "白き領域を支配する精神を、\nこの一本に封じ込めた。",
    ],
    tastingNote: "Bold authority · Crystalline depth · Commanding finish",
  },
  {
    letter: "D",
    name: "Fuji Noir",
    slug: "fuji-noir",
    subtitle: "FUJI NOIR",
    bottle: "Clear Bottle",
    capSeal: "Black",
    image: "/images/bushido/honjozo_01.png",
    imageBg: "/images/honjozo_01.jpg",
    imageScene: "/images/bushido/scenes/d_fuji_noir.jpg",
    imageDark: "/images/bushido/dark/d_fuji_noir.jpg",
    virtue: "Respect",
    virtueJp: "礼",
    descriptionEn: [
      "White Fuji beneath a silent sky. A single crimson sun suspended in stillness.",
      "This sake embraces restraint — crystalline clarity balanced with a composed, lingering depth. Never loud, yet quietly commanding.",
      "It is not a drink of force, but of shadow and reflection.",
      "The noir side of Fuji — captured in a single bottle.",
    ],
    descriptionJp: [
      "白き富士と、静寂の空。\nその中に差す、\nただひとつの紅。",
      "余白を湛えたこの一杯は、\n澄みきった透明感と、\n抑制された深い旨味を併せ持つ。\n\n主張は強くない。\nだが、静かに心を支配する。",
      "それは力を誇る酒ではない。\n沈黙の美を味わう酒。",
      "雪の富士が映す、日本の陰影。\nその静かな存在感を、\nこの一本に。",
    ],
    tastingNote: "Restrained elegance · Shadow depth · Silent command",
  },
  {
    letter: "E",
    name: "Fuji Koku",
    slug: "fuji-koku",
    subtitle: "FUJI KOKU",
    bottle: "Clear Bottle",
    capSeal: "Black",
    image: "/images/bushido/junmai_daiginjo_01.png",
    imageBg: "/images/junmai_daiginjo_01.jpg",
    imageScene: "/images/bushido/scenes/e_fuji_koku.jpg",
    imageDark: "/images/bushido/dark/e_fuji_koku.jpg",
    virtue: "Sincerity",
    virtueJp: "誠",
    descriptionEn: [
      "A single powerful stroke set against the white of Fuji. Within the depth of ink lies quiet resolve and unwavering presence.",
      "Pure and disciplined, this sake carries clarity without excess. It unfolds smoothly, then leaves a structured depth that lingers like an indelible mark.",
      "It does not shout. It engraves its presence in silence.",
      "The spirit of Japan, written in ink — captured in a single bottle.",
    ],
    descriptionJp: [
      "白き富士を背に、\n力強く刻まれた一筆。\n墨の濃淡に宿るのは、\n揺るがぬ意志と静かな気迫。",
      "この一杯は澄みきり、潔く、無駄がない。\n\n口に含めば滑らかに広がり、\nやがて芯のある旨味が\n静かに刻まれていく。\n\n派手さではなく、\n余白と緊張感で魅せる味わい。",
      "それは声高に語る酒ではない。\n沈黙の中で、\n確かな存在感を刻む酒。",
      "筆が描く日本の精神を、\nこの一本に。",
    ],
    tastingNote: "Ink-like purity · Smooth precision · Indelible finish",
  },
  {
    letter: "F",
    name: "Silver Night",
    slug: "silver-night",
    subtitle: "FUJI SILVER NIGHT",
    bottle: "Light Aqua Transparent Bottle",
    capSeal: "Blue",
    image: "/images/bushido/honjozo_02.png",
    imageBg: "/images/honjozo_02.jpg",
    imageScene: "/images/bushido/scenes/f_silver_night.jpg",
    imageDark: "/images/bushido/dark/f_silver_night.jpg",
    virtue: "Honor",
    virtueJp: "名誉",
    descriptionEn: [
      "In a silver night beneath the stars, Mount Fuji stands in frozen stillness, a crimson glow rising against the dark.",
      "Reflecting that scene, this sake is clear, delicate, and composed. It opens with a cool, crystalline touch, then unfolds into a gentle depth that lingers like the hush of winter night.",
      "Not a drink of brilliance or display, but one of quiet reflection.",
      "The silver presence of Fuji at night — captured in a single bottle.",
    ],
    descriptionJp: [
      "白銀の夜、\n星をまとい静かに佇む霊峰富士。\n凍てつく空気の中、\n紅く浮かぶ月のような光。",
      "その情景を映すように、\nこの一杯は澄みきり、繊細で、静か。\n\n口に含めば\n透明な冷気のように広がり、\nやがて柔らかな旨味が\nゆっくりと現れ、\n夜の余韻のように\n長く静かに続いていく。",
      "それは華やかさを競う酒ではない。\n静寂の中で、\n心を澄ませるための酒。",
      "冬の夜の富士が宿す、\n白銀の気配をこの一本に。",
    ],
    tastingNote: "Delicate crystalline · Winter stillness · Gentle linger",
  },
  {
    letter: "G",
    name: "Black Snow",
    slug: "black-snow",
    subtitle: "FUJI BLACK SNOW",
    bottle: "Black Bottle",
    capSeal: "Black",
    image: "/images/bushido/junmai_daiginjo_02.png",
    imageBg: "/images/junmai_daiginjo_02.jpg",
    imageScene: "/images/bushido/scenes/g_black_snow.jpg",
    imageDark: "/images/bushido/dark/g_black_snow.jpg",
    virtue: "Loyalty",
    virtueJp: "忠義",
    descriptionEn: [
      "In the obsidian night, white snow falls in silence. Against the darkness of Fuji, a crimson resolve burns.",
      "Reflecting that contrast, this sake is bold yet crystalline — structured, disciplined, and quietly powerful. Strength defined not by noise, but by presence.",
      "This is not a drink of spectacle, but one that stands out in the dark.",
      "Like white snow against black night, it embodies the beauty of contrast.",
    ],
    descriptionJp: [
      "漆黒の夜、\n白き雪が静かに舞う。\n闇に包まれた霊峰富士に、\n赤き志が灯る。",
      "その情景を映すように、\nこの一杯は重厚で澄みきっている。\n\n凛とした輪郭と、芯のある旨味。\n力強さの中に、\n静かな透明感が宿る。",
      "それは華やかさを競う酒ではない。\n闇の中でこそ際立つ、\n揺るがぬ存在のための酒。",
      "黒に映える白雪のごとく、\n対比の美を、この一本に。",
    ],
    tastingNote: "Bold contrast · Dark elegance · Unwavering depth",
  },
];
