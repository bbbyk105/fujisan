import Link from "next/link";
import { UNDERAGE_NOTICE_JP, UNDERAGE_NOTICE_EN } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

const FOOTER_LINKS = [
  { label: "特定商取引法", href: "/tokushoho" },
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

      {/* 法令対応：未成年飲酒防止表示（全ページ常時掲示） */}
      <div
        role="note"
        aria-label="未成年飲酒防止のお知らせ"
        className="border-b border-[#F4EBD5]/12 bg-[#0B1A2E]"
      >
        <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-1 px-7 py-4 text-center text-[11px] leading-[1.7] tracking-[0.04em] text-[#F4EBD5]/82 md:px-12 md:text-[12px]">
          <L
            ja={
              <>
                {UNDERAGE_NOTICE_JP.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            }
            en={
              <>
                {UNDERAGE_NOTICE_EN.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            }
          />
          <p className="mt-1 text-[10.5px] tracking-[0.06em] text-[#F4EBD5]/55">
            <Link
              href="/tokushoho"
              className="text-[#F4EBD5]/70 underline decoration-[#D7B46A]/45 underline-offset-2 transition-colors hover:text-[#D7B46A]"
            >
              <L
                ja="酒類販売管理者標識・通信販売酒類小売業免許情報はこちら"
                en="Liquor sales manager notice & mail-order liquor retail licence"
              />
            </Link>
          </p>
        </div>
      </div>

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
