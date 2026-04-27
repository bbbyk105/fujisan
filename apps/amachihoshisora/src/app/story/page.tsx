import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Story from "@/components/Story";

export default function StoryPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Story"
          title={
            <>
              The Origin of
              <br />
              <em className="italic text-gold-lt">Fuji Sake</em>
            </>
          }
          description="The landscape around Mount Fuji shapes the mood, water, and discipline behind every bottle. This page gathers the story behind the project into one place."
        />
        <Story />
      </main>
      <Footer />
    </>
  );
}
