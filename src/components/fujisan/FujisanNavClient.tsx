"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type {
  FujisanNavChild,
  FujisanNavLinkItem,
} from "./fujisan-nav-links";
import { LocaleSwitch } from "@/i18n/LocaleSwitch";
import { AccountNavLink } from "./auth/AccountNavLink";

type Props = {
  links: FujisanNavLinkItem[];
};

export function FujisanNavClient({ links }: Props) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hashSection, setHashSection] = useState<string>("#top");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);

  // Close mobile menu and any desktop dropdown when the route changes.
  // Storing the previous pathname in state (React's documented pattern) lets us
  // reset during render instead of in an effect, avoiding a cascading re-render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setOpenMenu(null);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Track which homepage section is in view (anchor active state)
  useEffect(() => {
    if (!isHome) return;
    const ids = links
      .map((l) =>
        l.href.startsWith("/#") ? l.href.split("#")[1] ?? "" : "",
      )
      .filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHashSection(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [isHome, links]);

  const isActive = (link: FujisanNavLinkItem) => {
    const match = link.match ?? link.href;
    // Path-style match (e.g. "/stories" or "/craft")
    if (match.startsWith("/") && !match.startsWith("/#")) {
      return pathname === match || pathname.startsWith(`${match}/`);
    }
    // Hash-style match — only meaningful on home
    if (match.startsWith("#")) {
      return isHome && hashSection === match;
    }
    return false;
  };

  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = (label: string) => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpenMenu((current) => (current === label ? null : current));
    }, 120);
  };

  return (
    <header
      style={{ viewTransitionName: "site-header" }}
      className={`fixed top-0 inset-x-0 z-50 border-b border-[#0F1F36]/14 transition-shadow duration-500 ${
        scrolled
          ? "bg-[#F6F0E5]/95 shadow-[0_6px_28px_rgba(15,31,54,0.08)] backdrop-blur-md"
          : "bg-[#F6F0E5]/96"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1760px] items-center justify-between px-5 sm:px-7 md:h-[86px] md:px-9 lg:px-[4.5vw] 2xl:px-16">
        <Link
          href="/#top"
          aria-label="FUJISAN SAKE home"
          className="relative block h-[44px] w-[178px] overflow-hidden no-underline sm:w-[210px] md:h-[52px] md:w-[250px]"
        >
          <Image
            src="/images/logo/header-logo.png"
            alt="FUJISAN SAKE"
            fill
            priority
            sizes="(min-width: 768px) 250px, 178px"
            className="fujisan-header-logo object-cover"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-[clamp(20px,2.6vw,38px)] lg:flex">
          {links.map((link) => {
            const active = isActive(link);
            const hasChildren = !!link.children?.length;
            const menuOpen = openMenu === link.label;

            if (!hasChildren) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[12px] font-semibold tracking-[0.06em] no-underline transition-colors duration-300 ${
                    active
                      ? "text-[#0F1F36]"
                      : "text-[#0F1F36]/75 hover:text-[#0F1F36]"
                  }`}
                >
                  {link.label}
                  {active ? (
                    <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#0F1F36]/80" />
                  ) : null}
                </Link>
              );
            }

            return (
              <div
                key={link.href}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  setOpenMenu(link.label);
                }}
                onMouseLeave={() => scheduleClose(link.label)}
                onFocus={() => {
                  cancelClose();
                  setOpenMenu(link.label);
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    scheduleClose(link.label);
                  }
                }}
              >
                <Link
                  href={link.href}
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  className={`relative inline-flex items-center gap-1.5 text-[12px] font-semibold tracking-[0.06em] no-underline transition-colors duration-300 ${
                    active
                      ? "text-[#0F1F36]"
                      : "text-[#0F1F36]/75 hover:text-[#0F1F36]"
                  }`}
                >
                  {link.label}
                  <svg
                    aria-hidden
                    viewBox="0 0 10 6"
                    width="10"
                    height="6"
                    fill="none"
                    className={`transition-transform duration-300 ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {active ? (
                    <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#0F1F36]/80" />
                  ) : null}
                </Link>

                <div
                  className={`absolute left-1/2 top-full -translate-x-1/2 pt-4 transition-all duration-300 ${
                    menuOpen
                      ? "pointer-events-auto translate-y-0 opacity-100"
                      : "pointer-events-none -translate-y-1 opacity-0"
                  }`}
                >
                  <div className="w-[340px] border border-[#0F1F36]/12 bg-[#F8F3E7]/98 shadow-[0_28px_60px_rgba(15,31,54,0.18)] backdrop-blur-md">
                    <div
                      aria-hidden
                      className="h-px w-full bg-linear-to-r from-transparent via-[#C9A84C]/55 to-transparent"
                    />
                    <ul className="flex flex-col py-3">
                      {link.children!.map((child, i) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            className="group/sub flex items-start gap-4 px-6 py-3.5 no-underline transition-colors hover:bg-[#F1E6CB]/64"
                          >
                            <span className="mt-1 font-serif text-[10px] font-medium tracking-[0.32em] text-[#C9A84C]">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <span className="flex flex-col gap-0.5">
                              <span className="font-serif text-[12px] font-semibold tracking-[0.18em] text-[#0F1F36] transition-colors group-hover/sub:text-[#C9A84C]">
                                {child.label}
                              </span>
                              {child.jp && (
                                <span className="font-jp text-[10.5px] tracking-[0.24em] text-[#C9A84C]/85">
                                  {child.jp}
                                </span>
                              )}
                              {child.desc && (
                                <span className="mt-1 text-[11px] leading-[1.55] text-[#0F1F36]/65">
                                  {child.desc}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
          <AccountNavLink />
          <LocaleSwitch />
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="fujisan-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="relative z-[60] flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[6px] border border-[#0F1F36]/20 bg-[#F8F3E7]/80 p-0 lg:hidden"
        >
          <span
            className={`block h-px w-5 bg-[#0F1F36] transition-transform duration-300 ${
              open ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-[#0F1F36] transition-opacity duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-px w-5 bg-[#0F1F36] transition-transform duration-300 ${
              open ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0B1A2E]/35 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Mobile menu panel */}
      <aside
        id="fujisan-mobile-menu"
        className={`fixed right-0 top-0 z-50 h-dvh w-[min(86vw,380px)] overflow-y-auto border-l border-[#0F1F36]/12 bg-[#F6F0E5] shadow-[-24px_0_55px_rgba(15,31,54,0.18)] transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex min-h-full flex-col px-7 pb-10 pt-24">
          <ul className="flex flex-col">
            {links.map((link) => {
              const active = isActive(link);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between border-b py-4 text-[13px] font-semibold tracking-[0.14em] no-underline transition-colors ${
                      active
                        ? "border-[#0F1F36]/30 text-[#0F1F36]"
                        : "border-[#0F1F36]/10 text-[#0F1F36]/82 hover:text-[#0F1F36]"
                    }`}
                  >
                    <span>{link.label}</span>
                    {active && (
                      <span
                        aria-hidden
                        className="text-[10px] tracking-[0.3em] text-[#C9A84C]"
                      >
                        ●
                      </span>
                    )}
                  </Link>
                  {link.children?.length ? (
                    <ul className="border-b border-[#0F1F36]/10 bg-[#F1E6CB]/40">
                      {link.children.map((child: FujisanNavChild) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 no-underline"
                          >
                            <span className="mt-0.5 font-serif text-[10px] font-medium tracking-[0.3em] text-[#C9A84C]">
                              ／
                            </span>
                            <span className="flex flex-col">
                              <span className="font-serif text-[11.5px] font-semibold tracking-[0.18em] text-[#0F1F36]">
                                {child.label}
                              </span>
                              {child.jp && (
                                <span className="font-jp text-[10px] tracking-[0.24em] text-[#C9A84C]/80">
                                  {child.jp}
                                </span>
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <AccountNavLink mobile />

          <div className="mt-8">
            <LocaleSwitch />
          </div>
          <div className="relative mt-auto h-28 w-28 opacity-20">
            <Image
              src="/images/logo/logo-fuji.png"
              alt=""
              fill
              sizes="112px"
              className="fujisan-fuji-logo-image object-contain"
            />
          </div>
        </nav>
      </aside>
    </header>
  );
}
