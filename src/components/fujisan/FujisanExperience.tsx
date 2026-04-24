import Image from "next/image";

const footerLinks = [
  "PRIVACY POLICY",
  "TERMS OF USE",
  "SHIPPING & RETURNS",
  "FAQ",
];

export default function FujisanExperience() {
  return (
    <section className="relative scroll-mt-[86px] overflow-hidden bg-[#FAF5E8]" id="about">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 top-0 bottom-[64px] w-[620px] opacity-[0.1]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #C9A84C 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, #C9A84C 0 1px, transparent 1px 14px)",
        }}
      />

      <div
        id="experience"
        className="relative mx-auto grid max-w-[1360px] scroll-mt-[86px] grid-cols-1 items-center gap-9 px-7 py-12 md:grid-cols-[1fr_1.35fr_1fr] md:gap-7 md:px-12 md:py-7"
      >
        <div className="flex justify-center md:justify-start">
          <div className="relative h-[112px] w-[260px] overflow-hidden md:h-[126px] md:w-[300px]">
            <Image
              src="/images/logo/logo-nihonshu.png"
              alt="日本酒 SAKE"
              fill
              sizes="(min-width: 768px) 300px, 260px"
              className="fujisan-nihonshu-logo object-cover"
            />
          </div>
        </div>

        <div className="text-center md:text-left">
          <h3 className="font-serif text-[clamp(17px,2vw,23px)] font-semibold tracking-[0.16em] text-[#0B1A2E]">
            EXPERIENCE JAPAN IN EVERY SIP
          </h3>
          <p className="mx-auto mt-3 max-w-[490px] text-[14px] leading-[1.65] text-[#2B2419]/74 md:mx-0 md:text-[15px]">
            Each bottle tells a story of the land, the people,
            <br />
            and the timeless art of sake brewing.
            <br />
            Enjoy it chilled, and savor the true essence of Japan.
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <svg
            viewBox="0 0 64 44"
            fill="none"
            className="h-auto w-[72px] text-[#0B1A2E]"
          >
            <path
              d="M3 38L22 12L30 22L40 8L61 38H3Z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <path
              d="M18 24L22 12L27 20L24 24H18Z"
              fill="currentColor"
              fillOpacity="0.12"
            />
            <path
              d="M35 16L40 8L46 18L42.5 21H38L35 16Z"
              fill="currentColor"
              fillOpacity="0.12"
            />
          </svg>
          <p className="text-center text-[13px] font-semibold tracking-[0.2em] text-[#0B1A2E]">
            JAPAN PREMIUM EDITION
          </p>
          <p className="text-center text-[13px] tracking-[0.18em] text-[#0B1A2E]/72">
            FUJISAN SAKE COLLECTION
          </p>
        </div>
      </div>

      <div id="contact" className="relative bg-[#132337]">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-4 px-7 py-5 text-[11px] text-[#F4EBD5]/88 md:flex-row md:px-12">
          <p className="tracking-[0.08em]">
            © 2024 FUJISAN SAKE. All Rights Reserved.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 tracking-[0.12em] font-medium md:gap-x-7">
            {footerLinks.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="text-[#F4EBD5]/84 no-underline transition-colors hover:text-[#F4EBD5]"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-5 text-[#F4EBD5]/88">
            <a href="#" aria-label="Instagram" className="transition-colors hover:text-white">
              <IconInstagram />
            </a>
            <a href="#" aria-label="Facebook" className="transition-colors hover:text-white">
              <IconFacebook />
            </a>
            <a href="#" aria-label="Threads" className="transition-colors hover:text-white">
              <IconInstagram />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
    >
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5a20.1 20.1 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5V21h3z" />
    </svg>
  );
}
