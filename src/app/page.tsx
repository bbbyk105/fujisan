import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanHero from "@/components/fujisan/FujisanHero";
import FujisanArtOfSake from "@/components/fujisan/FujisanArtOfSake";
import FujisanExperience from "@/components/fujisan/FujisanExperience";

export default function Home() {
  return (
    <main className="bg-[#FAF5E8] text-ink min-h-screen">
      <FujisanNav />
      <FujisanHero />
      <FujisanArtOfSake />
      <FujisanExperience />
    </main>
  );
}
