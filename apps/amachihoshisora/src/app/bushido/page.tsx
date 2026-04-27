import Bushido from "@/components/Bushido";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Philosophy from "@/components/Philosophy";

export default function BushidoPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Bushido"
          title={
            <>
              Seven Designs.
              <br />
              One <em className="italic text-gold-lt">Code of Honor</em>
            </>
          }
          description="The Bushido Edition expands the world of Mt. Fuji sake into seven distinct expressions, each tied to a warrior virtue and a cinematic visual identity."
        />
        <Philosophy />
        <Bushido />
      </main>
      <Footer />
    </>
  );
}
