import Image from "next/image";

const pillars = [
  { label: "PURE WATER", sub: "FROM MT. FUJI", Icon: IconFuji },
  { label: "PREMIUM", sub: "JAPANESE RICE", Icon: IconRice },
  { label: "TRADITIONAL", sub: "BREWING METHODS", Icon: IconBottle },
  { label: "PASSION &", sub: "DEDICATION", Icon: IconDrop },
];

const craftPhotos = [
  {
    src: "/images/site/sake.png",
    alt: "Clear brewing water pouring into a wooden vessel",
    position: "object-[42%_50%]",
  },
  {
    src: "/images/site/rice.png",
    alt: "Steaming Japanese rice for sake brewing",
    position: "object-[50%_50%]",
  },
  {
    src: "/images/site/ochoko.png",
    alt: "Sake poured into an ochoko cup",
    position: "object-[63%_50%]",
  },
];

export default function FujisanArtOfSake() {
  return (
    <section id="art" className="relative scroll-mt-[86px] bg-[#122337] text-[#EAD9B5]">
      <div className="grid grid-cols-1 lg:grid-cols-[49%_51%]">
        <div className="fujisan-dark-panel flex min-h-[300px] flex-col justify-between gap-6 px-8 py-8 sm:px-10 md:px-14 lg:min-h-[210px] lg:px-[4vw] lg:py-5">
          <div>
            <h2 className="font-serif text-[clamp(22px,2.1vw,27px)] font-semibold tracking-[0.14em] text-[#D7B46A]">
              THE ART OF SAKE
            </h2>
            <p className="mt-2 max-w-[520px] text-[14px] leading-[1.5] text-[#F2E4C7]/90 md:text-[14.5px]">
              Brewed with pristine water from Mt. Fuji and
              <br className="hidden sm:block" /> traditional techniques passed down for generations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4 md:gap-x-6 lg:gap-x-3">
            {pillars.map(({ label, sub, Icon }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                <Icon className="h-8 w-8 text-[#D7B46A]" />
                <div>
                  <p className="whitespace-nowrap text-[9px] font-semibold tracking-[0.06em] text-[#F2E4C7] md:text-[9.5px]">
                    {label}
                  </p>
                  <p className="whitespace-nowrap text-[9px] font-semibold tracking-[0.06em] text-[#F2E4C7] md:text-[9.5px]">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-[720px] grid-cols-1 sm:min-h-[520px] sm:grid-cols-3 lg:min-h-[210px]">
          {craftPhotos.map((photo) => (
            <div key={photo.src} className="relative min-h-[240px] overflow-hidden border-t border-[#F2E4C7]/20 sm:border-l sm:border-t-0">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 17vw, (min-width: 640px) 34vw, 100vw"
                className={`object-cover ${photo.position}`}
              />
            </div>
          ))}
        </div>
      </div>
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
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M14 22L18 11L21.5 17L19 22H14Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
      <path
        d="M26 14L30 8L34 15L31.5 17.5H28L26 14Z"
        fill="currentColor"
        fillOpacity="0.85"
      />
    </svg>
  );
}

function IconRice({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 4V36"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 12C16 10 12 10 10 12C12 16 16 18 20 17"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 12C24 10 28 10 30 12C28 16 24 18 20 17"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 20C16 18 12 18 10 20C12 24 16 26 20 25"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 20C24 18 28 18 30 20C28 24 24 26 20 25"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 28C17 27 14 27 12 28C13.5 31 17 33 20 32.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M20 28C23 27 26 27 28 28C26.5 31 23 33 20 32.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBottle({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M16 4H24V10L27 14V34C27 35.1 26.1 36 25 36H15C13.9 36 13 35.1 13 34V14L16 10V4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M13 22H27" stroke="currentColor" strokeWidth="1.2" />
      <path d="M16 7H24" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="20" cy="28" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconDrop({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className}>
      <path
        d="M20 5C14 14 10 20 10 26C10 31.5 14.5 36 20 36C25.5 36 30 31.5 30 26C30 20 26 14 20 5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M16 24C16 28 18 30 21 30"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
