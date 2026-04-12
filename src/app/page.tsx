import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Products from "@/components/Products";
import Philosophy from "@/components/Philosophy";
import Bushido from "@/components/Bushido";
import Specs from "@/components/Specs";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Story />
      <Products />
      <Philosophy />
      <Bushido />
      <Specs />
      <Footer />
    </>
  );
}
