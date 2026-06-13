import dynamic from "next/dynamic";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanHero from "@/components/fujisan/FujisanHero";
import { FujisanRidge } from "@/components/fujisan/FujisanRidge";

const FujisanArtOfSake = dynamic(
  () => import("@/components/fujisan/FujisanArtOfSake"),
  {
    loading: () => (
      <section
        className="min-h-[min(100vh,880px)] bg-[#0F1D30]"
        aria-busy
        aria-label="読み込み中"
      />
    ),
  },
);

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
      <FujisanNav />
      <FujisanHero />
      <FujisanArtOfSake />
      {/* シグネチャー: 稜線のセクション区切り */}
      <div aria-hidden className="relative bg-paper py-8 md:py-12">
        <FujisanRidge className="mx-auto h-[92px] w-full max-w-[680px] px-6 text-[#0B1A2E]/30 md:h-[120px]" />
      </div>
      <FujisanDiscover />
      <FujisanExperience />
    </main>
  );
}
