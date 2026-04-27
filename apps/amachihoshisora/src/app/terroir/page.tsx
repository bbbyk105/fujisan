import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Specs from "@/components/Specs";
import Story from "@/components/Story";

export default function TerroirPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Terroir"
          title={
            <>
              Water, Air, and
              <br />
              the <em className="italic text-gold-lt">Shadow of Fuji</em>
            </>
          }
          description="From Tanuki Lake to alpine water and temperature, the place itself defines the tone of the sake. This page brings together origin and technical detail."
        />
        <Story />
        <Specs />
      </main>
      <Footer />
    </>
  );
}
