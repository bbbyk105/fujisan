import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";

export const metadata = {
  title: "Shipping & Returns — FUJISAN SAKE",
  description:
    "How we ship the Fujisan collection — temperature-controlled, hand-packed — and how to handle returns or damage.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: "Where we ship",
    jp: "配送地域",
    body: [
      "We ship the Fujisan collection across Japan and to selected international destinations. Availability depends on local import regulations for alcoholic beverages.",
      "If your country is not listed at checkout, please write to us — we will check whether a route is possible.",
    ],
    bullets: [
      "Japan — nationwide, including remote islands (with surcharge)",
      "Asia — Hong Kong, Singapore, Taiwan",
      "EU & UK — selected countries via licenced importers",
      "United States — California, New York, Illinois",
    ],
  },
  {
    num: "02",
    heading: "Packing & temperature",
    jp: "梱包と温度管理",
    body: [
      "Each bottle is hand-wrapped in washi paper, cushioned in moulded fibre, and packed in a chilled outer box. For overseas shipments we add a temperature buffer to keep the sake below 18°C in transit.",
      "Daiginjo and aroma-driven bottles are dispatched on Mondays and Tuesdays only, so they avoid weekend warehouse holds.",
    ],
  },
  {
    num: "03",
    heading: "Lead times & tracking",
    jp: "発送と追跡",
    body: [
      "Orders are typically dispatched within two business days. You will receive a tracking link by email when your parcel leaves the brewhouse.",
    ],
    bullets: [
      "Domestic Japan · 1–3 business days",
      "Asia · 3–5 business days",
      "EU / UK · 5–8 business days",
      "United States · 5–9 business days",
    ],
  },
  {
    num: "04",
    heading: "Receiving your order",
    jp: "お受け取り",
    body: [
      "An adult of legal drinking age must sign for delivery. If no one is available, the carrier will leave a card; please re-deliver as soon as possible to keep the sake out of warm storage.",
    ],
  },
  {
    num: "05",
    heading: "Damage & defects",
    jp: "破損・不良品",
    body: [
      "Photograph the outer box and the bottle as soon as you notice damage, and contact us within seven days at care@fujisan-sake.com. We will replace damaged bottles or refund the order.",
    ],
  },
  {
    num: "06",
    heading: "Returns",
    jp: "返品について",
    body: [
      "Because sake is a perishable, temperature-sensitive product, we do not accept returns of opened bottles or of unopened bottles for change of mind. Where the law guarantees a right of return, we will of course honour it.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <FujisanInfoPage
      eyebrow="ORDERING · SHIPPING"
      chapter="Ⅵ"
      title="SHIPPING & RETURNS"
      jp="― お届けと返品 ―"
      lead="Sake is a living product. The way it travels matters as much as the way it is brewed. Here is how we send each bottle to your door."
      crumb={{ label: "SHIPPING", href: "/shipping" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
