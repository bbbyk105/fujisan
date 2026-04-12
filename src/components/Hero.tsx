import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <Image
        src="/images/fuji_tanuki_lake.jpg"
        alt="Mt. Fuji at Tanuki Lake"
        fill
        priority
        className="object-cover brightness-50"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-transparent to-ink/80" />

      {/* Content */}
      <div className="relative z-10 text-center">
        <p className="text-[13px] tracking-[6px] uppercase text-gold font-normal mb-6">
          Mt. Fuji Sake Project
        </p>
        <h1 className="font-serif font-light leading-[0.95] tracking-tight text-off-white text-[clamp(52px,12vw,130px)] mb-2">
          Amachi<br />
          <em className="italic text-gold-lt">Hoshisora</em>
        </h1>
        <p className="font-jp text-[clamp(18px,3.5vw,38px)] font-extralight tracking-[10px] text-off-white/65 my-3 mb-9">
          天地星空
        </p>
        <div className="w-px h-16 bg-gradient-to-b from-gold to-transparent mx-auto mb-7" />
        <p className="text-[clamp(15px,2vw,18px)] italic text-off-white/70 tracking-wide">
          Born of Stars. Brewed in Silence.
        </p>
      </div>

      {/* Scroll Hint */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-fade-in-delayed">
        <span className="text-[11px] tracking-[4px] uppercase text-gold">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gold to-transparent animate-scroll-pulse" />
      </div>
    </section>
  );
}
