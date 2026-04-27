import Image from "next/image";
import { Reveal, revealDelays } from "@/components/Reveal";

const pillars = [
  { num: "01", label: "PURE WATER", sub: "FROM MT. FUJI", Icon: IconFuji },
  { num: "02", label: "PREMIUM", sub: "JAPANESE RICE", Icon: IconRice },
  { num: "03", label: "TRADITIONAL", sub: "BREWING METHODS", Icon: IconBottle },
  { num: "04", label: "PASSION &", sub: "DEDICATION", Icon: IconDrop },
];

const craftPhotos = [
  {
    src: "/images/fujisan/art-of-sake/sake.png",
    alt: "Clear brewing water pouring into a wooden vessel",
    position: "object-[42%_50%]",
  },
  {
    src: "/images/fujisan/art-of-sake/rice.png",
    alt: "Steaming Japanese rice for sake brewing",
    position: "object-[50%_50%]",
  },
  {
    src: "/images/fujisan/art-of-sake/ochoko.png",
    alt: "Sake poured into an ochoko cup",
    position: "object-[63%_50%]",
  },
];

export default function FujisanArtOfSake() {
  return (
    <section
      id="art"
      className="relative scroll-mt-[86px] overflow-hidden bg-[#0F1D30] text-[#EAD9B5]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 30%, rgba(215,180,106,0.5), transparent 45%), radial-gradient(circle at 82% 70%, rgba(215,180,106,0.35), transparent 50%)",
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[48%_52%]">
        <div className="fujisan-dark-panel relative flex flex-col justify-between gap-10 px-8 py-14 sm:px-10 md:px-16 md:py-16 lg:gap-9 lg:px-[4.2vw] lg:py-12">
          <span
            aria-hidden
            className="fujisan-breathe pointer-events-none absolute right-6 top-4 origin-center select-none font-jp text-[160px] leading-none tracking-[0] text-[#D7B46A]/[0.055] md:text-[200px] lg:right-10 lg:top-6 lg:text-[230px]"
          >
            酒
          </span>

          <div className="relative">
            <Reveal className="flex items-center gap-4">
              <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#D7B46A]">
                Ⅰ
              </span>
              <span className="h-px w-10 bg-[#D7B46A]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#D7B46A]/85">
                The Craft
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(26px,2.6vw,38px)] font-medium leading-[1.12] tracking-[0.08em] text-[#F2E4C7]"
              delay={revealDelays.d1}
            >
              THE ART OF SAKE
            </Reveal>
            <Reveal
              as="p"
              className="mt-2 font-jp text-[13px] tracking-[0.26em] text-[#D7B46A]/80 md:text-[13.5px]"
              delay={revealDelays.d2}
            >
              ― 匠の技、一滴に宿る ―
            </Reveal>

            <Reveal
              as="p"
              className="mt-6 max-w-[520px] text-[13.5px] font-light leading-[1.75] text-[#F2E4C7]/78 md:text-[14.5px]"
              delay={revealDelays.d3}
            >
              Brewed with pristine snowmelt from Mt. Fuji and techniques
              safeguarded across generations — every bottle carries the
              stillness of the mountain and the hand of the master brewer.
            </Reveal>
          </div>

          <div className="relative">
            <div
              aria-hidden
              className="mb-9 h-px w-full bg-linear-to-r from-transparent via-[#D7B46A]/35 to-transparent"
            />
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4 md:gap-x-7 lg:gap-x-5">
              {pillars.map(({ num, label, sub, Icon }, i) => (
                <Reveal
                  key={label}
                  className="group flex flex-col items-start gap-3 text-left"
                  delay={0.12 + i * 0.1}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-[10.5px] font-medium tracking-[0.32em] text-[#D7B46A]">
                      {num}
                    </span>
                    <span className="h-px w-5 bg-[#D7B46A]/45 transition-all duration-500 group-hover:w-8 group-hover:bg-[#D7B46A]" />
                  </div>
                  <Icon className="h-8 w-8 text-[#D7B46A]/90 transition-colors duration-500 group-hover:text-[#D7B46A]" />
                  <div>
                    <p className="whitespace-nowrap font-serif text-[10.5px] font-semibold tracking-[0.22em] text-[#F2E4C7] md:text-[11px]">
                      {label}
                    </p>
                    <p className="mt-1 whitespace-nowrap text-[9.5px] font-light tracking-[0.22em] text-[#F2E4C7]/65 md:text-[10px]">
                      {sub}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        <div className="grid min-h-[720px] grid-cols-1 sm:min-h-[520px] sm:grid-cols-3 lg:min-h-[520px]">
          {craftPhotos.map((photo) => (
            <div
              key={photo.src}
              className="relative min-h-[240px] overflow-hidden border-t border-[#D7B46A]/15 sm:border-l sm:border-t-0"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 17vw, (min-width: 640px) 34vw, 100vw"
                className={`object-cover ${photo.position}`}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-b from-[#0F1D30]/10 via-transparent to-[#0F1D30]/35"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/30 to-transparent"
      />
    </section>
  );
}

type IconProps = { className?: string };

function IconFuji({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={className}>
      <path
        d="M3 33L18 11L23.5 18.5L30 8L45 33H3Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M14 22L18 11L21.5 17L19 22H14Z"
        fill="currentColor"
        fillOpacity="0.78"
      />
      <path
        d="M26 14L30 8L34 15L31.5 17.5H28L26 14Z"
        fill="currentColor"
        fillOpacity="0.78"
      />
    </svg>
  );
}

function IconRice({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 4V36" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 12C16 10 12 10 10 12C12 16 16 18 20 17" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 12C24 10 28 10 30 12C28 16 24 18 20 17" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 20C16 18 12 18 10 20C12 24 16 26 20 25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 20C24 18 28 18 30 20C28 24 24 26 20 25" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 28C17 27 14 27 12 28C13.5 31 17 33 20 32.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M20 28C23 27 26 27 28 28C26.5 31 23 33 20 32.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconBottle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M16 4H24V10L27 14V34C27 35.1 26.1 36 25 36H15C13.9 36 13 35.1 13 34V14L16 10V4Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M13 22H27" stroke="currentColor" strokeWidth="1" />
      <path d="M16 7H24" stroke="currentColor" strokeWidth="1" />
      <circle cx="20" cy="28" r="1.3" fill="currentColor" />
    </svg>
  );
}

function IconDrop({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 5C14 14 10 20 10 26C10 31.5 14.5 36 20 36C25.5 36 30 31.5 30 26C30 20 26 14 20 5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 24C16 28 18 30 21 30"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
