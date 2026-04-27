import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import PageHero from "@/components/PageHero";
import Products from "@/components/Products";

export default function CollectionPage() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow="Collection"
          title={
            <>
              Signature Bottles
              <br />
              of <em className="italic text-gold-lt">Mount Fuji</em>
            </>
          }
          description="Explore the core collection, from the Hoshisora editions to limited reserve releases shaped by the spirit and stillness of Fuji."
        />
        <Products />
      </main>
      <Footer />
    </>
  );
}
