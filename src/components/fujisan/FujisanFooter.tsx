import Link from "next/link";

const FOOTER_LINKS = [
  { label: "PRIVACY POLICY", href: "/privacy" },
  { label: "TERMS OF USE", href: "/terms" },
  { label: "SHIPPING & RETURNS", href: "/shipping" },
  { label: "FAQ", href: "/faq" },
];

export default function FujisanFooter() {
  return (
    <footer className="relative bg-[#0F1D30]" id="contact">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
      />
      <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-5 px-7 py-7 text-[11px] text-[#F4EBD5]/88 md:flex-row md:px-12">
        <p className="tracking-[0.12em] text-[#F4EBD5]/70">
          © {new Date().getFullYear()} FUJISAN SAKE · ALL RIGHTS RESERVED
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 tracking-[0.22em] font-medium md:gap-x-8">
          {FOOTER_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-[10.5px] text-[#F4EBD5]/72 no-underline transition-colors hover:text-[#D7B46A]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-5 text-[#F4EBD5]/72">
          <a
            href="#"
            aria-label="Instagram"
            className="transition-colors hover:text-[#D7B46A]"
          >
            <IconInstagram />
          </a>
          <a
            href="#"
            aria-label="Facebook"
            className="transition-colors hover:text-[#D7B46A]"
          >
            <IconFacebook />
          </a>
        </div>
      </div>
    </footer>
  );
}

function IconInstagram() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="17"
      height="17"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
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
    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
      <path d="M13.5 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.4 1.4-1.4h1.5V5.5a20.1 20.1 0 0 0-2.2-.1c-2.2 0-3.7 1.3-3.7 3.8v2H8v2.8h2.5V21h3z" />
    </svg>
  );
}
