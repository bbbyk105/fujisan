const footerLinks = [
  "PRIVACY POLICY",
  "TERMS OF USE",
  "SHIPPING & RETURNS",
  "FAQ",
];

export default function FujisanExperience() {
  return (
    <section className="relative bg-[#FAF5E8] overflow-hidden" id="contact">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-0 bottom-0 w-[560px] opacity-[0.09]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #C9A84C 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, #C9A84C 0 1px, transparent 1px 14px)",
        }}
      />

      <div className="relative max-w-[1360px] mx-auto px-6 md:px-12 py-16 md:py-20 grid grid-cols-1 md:grid-cols-[1fr_1.4fr_1fr] items-center gap-10 md:gap-8">
        <div className="flex items-end gap-4 md:justify-start justify-center">
          <span className="font-jp text-[#0B1A2E] font-semibold whitespace-nowrap leading-none tracking-[0.02em] text-[clamp(52px,7vw,92px)]">
            日本酒
          </span>
          <div className="flex flex-col items-start pb-2">
            <span className="text-[11px] tracking-[0.5em] text-[#0B1A2E]/80">
              SAKE
            </span>
            <span className="mt-3 inline-flex items-center justify-center w-6 h-6 border border-crimson text-crimson text-[8px]">
              酒
            </span>
          </div>
        </div>

        <div className="text-center">
          <h3 className="font-serif text-[#0B1A2E] text-[clamp(18px,1.9vw,24px)] tracking-[0.28em]">
            EXPERIENCE JAPAN IN EVERY SIP
          </h3>
          <p className="mt-5 text-[13px] md:text-[14px] text-ink/70 leading-[1.9] max-w-[460px] mx-auto">
            Each bottle tells a story of the land, the people,
            <br />
            and the timeless art of sake brewing.
            <br />
            Enjoy it chilled, and savor the true essence of Japan.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <svg
            viewBox="0 0 64 44"
            fill="none"
            className="w-16 h-auto text-[#0B1A2E]"
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
          <p className="text-[11px] tracking-[0.32em] text-[#0B1A2E] font-semibold">
            JAPAN PREMIUM EDITION
          </p>
          <p className="text-[11px] tracking-[0.32em] text-[#0B1A2E]/70">
            FUJISAN SAKE COLLECTION
          </p>
        </div>
      </div>

      <div className="relative border-t border-ink/10 bg-[#F4EBD5]">
        <div className="max-w-[1360px] mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#0B1A2E]/75">
          <p className="tracking-[0.08em]">
            © 2024 FUJISAN SAKE. All Rights Reserved.
          </p>

          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 tracking-[0.18em] font-medium">
            {footerLinks.map((label) => (
              <li key={label}>
                <a
                  href="#"
                  className="no-underline text-[#0B1A2E]/75 hover:text-[#0B1A2E] transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 text-[#0B1A2E]/80">
            <a href="#" aria-label="Instagram" className="hover:text-[#0B1A2E]">
              <IconInstagram />
            </a>
            <a href="#" aria-label="Facebook" className="hover:text-[#0B1A2E]">
              <IconFacebook />
            </a>
            <a href="#" aria-label="Threads" className="hover:text-[#0B1A2E]">
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
