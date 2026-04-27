import dynamic from "next/dynamic";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanHero from "@/components/fujisan/FujisanHero";

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
        className="min-h-[min(100vh,720px)] bg-[#FAF5E8]"
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
        className="min-h-[480px] bg-[#FAF5E8]"
        aria-busy
        aria-label="読み込み中"
      />
    ),
  },
);

export default function Home() {
  return (
    <main className="bg-[#FAF5E8] text-ink min-h-screen">
      <FujisanNav />
      <FujisanHero />
      <FujisanArtOfSake />
      <FujisanDiscover />
      <FujisanExperience />
    </main>
  );
}
