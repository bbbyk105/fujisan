import Image from "next/image";

export default function AmachiHero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <Image
        src="/images/fuji_tanuki_lake.jpg"
        alt="Mt. Fuji at Tanuki Lake"
        fill
        priority
        className="object-cover brightness-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/80" />

      <div className="relative z-10 text-center">
        <p className="text-[13px] tracking-[0.32em] uppercase text-gold font-medium mb-6">
          Mt. Fuji Sake Project
        </p>
        <h1 className="font-serif font-normal leading-[1.02] text-off-white text-[clamp(52px,12vw,130px)] mb-2">
          Mt. Fuji<br />
          <em className="italic text-gold-lt">Sake</em>
        </h1>
        <p className="font-jp text-[clamp(18px,3.5vw,38px)] font-light text-off-white/68 my-3 mb-9">
          富士山日本酒
        </p>
        <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent mx-auto mb-7" />
        <p className="text-[clamp(15px,2vw,18px)] italic text-off-white/72 leading-[1.8]">
          Brewed beneath Fuji. Refined with Japanese spirit.
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-fade-in-delayed">
        <span className="text-[11px] tracking-[0.28em] uppercase text-gold">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent animate-scroll-pulse" />
      </div>
    </section>
  );
}
