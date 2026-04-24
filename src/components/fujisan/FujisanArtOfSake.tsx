import Image from "next/image";

const pillars = [
  { label: "PURE WATER", sub: "FROM MT. FUJI", Icon: IconFuji },
  { label: "PREMIUM", sub: "JAPANESE RICE", Icon: IconRice },
  { label: "TRADITIONAL", sub: "BREWING METHODS", Icon: IconBottle },
  { label: "PASSION &", sub: "DEDICATION", Icon: IconDrop },
];

export default function FujisanArtOfSake() {
  return (
    <section id="art" className="relative bg-[#142236] text-[#EAD9B5]">
      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_1fr]">
        <div className="px-8 md:px-16 py-14 md:py-20 flex flex-col justify-between gap-10">
          <div>
            <h2 className="font-serif text-[#D7B46A] text-[clamp(24px,3vw,34px)] tracking-[0.18em]">
              THE ART OF SAKE
            </h2>
            <p className="mt-5 text-[14px] md:text-[15px] text-[#EAD9B5]/85 leading-[1.8] max-w-[440px]">
              Brewed with pristine water from Mt. Fuji and
              <br className="hidden md:block" /> traditional techniques passed down for generations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 pt-2">
            {pillars.map(({ label, sub, Icon }) => (
              <div key={label} className="flex flex-col items-start gap-3">
                <Icon className="w-9 h-9 text-[#D7B46A]" />
                <div>
                  <p className="text-[10px] tracking-[0.22em] font-medium text-[#EAD9B5]">
                    {label}
                  </p>
                  <p className="text-[10px] tracking-[0.22em] font-medium text-[#EAD9B5]">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[320px] md:min-h-full aspect-2/1 md:aspect-auto">
          <Image
            src="/images/site/sake.png"
            alt="The art of sake — water, rice, and pouring"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
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
