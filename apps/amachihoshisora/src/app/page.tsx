import AmachiNavbar from "@/components/amachihoshisora/AmachiNavbar";
import AmachiHero from "@/components/amachihoshisora/AmachiHero";
import AmachiStory from "@/components/amachihoshisora/AmachiStory";
import AmachiProducts from "@/components/amachihoshisora/AmachiProducts";
import AmachiPhilosophy from "@/components/amachihoshisora/AmachiPhilosophy";
import AmachiBushido from "@/components/amachihoshisora/AmachiBushido";
import AmachiSpecs from "@/components/amachihoshisora/AmachiSpecs";
import AmachiFooter from "@/components/amachihoshisora/AmachiFooter";

export default function AmachiHoshisoraPage() {
  return (
    <>
      <AmachiNavbar />
      <AmachiHero />
      <AmachiStory />
      <AmachiProducts />
      <AmachiPhilosophy />
      <AmachiBushido />
      <AmachiSpecs />
      <AmachiFooter />
    </>
  );
}
