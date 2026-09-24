import dynamic from "next/dynamic";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanHero from "@/components/fujisan/FujisanHero";
import FujisanGuide from "@/components/fujisan/FujisanGuide";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { jsonLdScript, organizationJsonLd } from "@/lib/seo";

const FujisanDiscover = dynamic(
  () => import("@/components/fujisan/FujisanDiscover"),
  {
    loading: () => (
      <section
        className="min-h-[min(100vh,720px)] bg-paper"
        aria-busy
        aria-label="読み込み中"
      />
    ),
  },
);

const FujisanExperience = dynamic(
  () => import("@/components/fujisan/FujisanExperience"),
  {
    loading: () => (
      <section
        className="min-h-[480px] bg-paper"
        aria-busy
        aria-label="読み込み中"
      />
    ),
  },
);

export default function Home() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      {/* 構造化データ: 事業者情報（サイト全体で 1 回、トップページにだけ出す） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(organizationJsonLd()),
        }}
      />
      <FujisanNav />
      <FujisanHero />
      <FujisanDiscover />
      <FujisanExperience />
      <FujisanGuide />
      <FujisanFooter />
    </main>
  );
}
