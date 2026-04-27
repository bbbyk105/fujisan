"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/#top", label: "HOME" },
  { href: "/#showcase", label: "OUR SAKE" },
  { href: "/#art", label: "THE CRAFT" },
  { href: "/#about", label: "ABOUT FUJISAN" },
  { href: "/#experience", label: "STORIES" },
  { href: "/#contact", label: "CONTACT" },
];

export default function FujisanNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("/#top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const activeFromHash = () => {
      if (typeof window === "undefined") return;
      const { pathname, hash } = window.location;
      if (pathname === "/" && hash) setActive(`/${hash}`);
    };
    activeFromHash();
    window.addEventListener("hashchange", activeFromHash);
    return () => window.removeEventListener("hashchange", activeFromHash);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    const ids = navLinks
      .map((l) => l.href.split("#")[1] ?? "")
      .filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`/#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

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

        <nav className="hidden lg:flex items-center gap-[clamp(22px,2.8vw,42px)]">
          {navLinks.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[12px] font-semibold tracking-[0.06em] no-underline transition-colors duration-300 ${
                  isActive
                    ? "text-[#0F1F36]"
                    : "text-[#0F1F36]/75 hover:text-[#0F1F36]"
                }`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#0F1F36]/80" />
                ) : null}
              </Link>
            );
          })}
          <span className="text-[12px] font-medium tracking-[0.08em] text-[#0F1F36]/80 select-none">
            JP <span className="text-[#0F1F36]/40">|</span> EN
          </span>
        </nav>

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

      <button
        type="button"
        aria-label="Close menu overlay"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-[#0B1A2E]/35 transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        id="fujisan-mobile-menu"
        className={`fixed right-0 top-0 z-50 h-dvh w-[min(84vw,360px)] border-l border-[#0F1F36]/12 bg-[#F6F0E5] shadow-[-24px_0_55px_rgba(15,31,54,0.18)] transition-transform duration-500 ease-[cubic-bezier(.22,.61,.36,1)] lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav className="flex h-full flex-col px-8 pb-8 pt-28">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-[#0F1F36]/10 py-4 text-[13px] font-semibold tracking-[0.12em] text-[#0F1F36] no-underline"
            >
              {link.label}
            </Link>
          ))}
          <span className="mt-8 text-[12px] tracking-[0.18em] text-[#0F1F36]/62">
            JP | EN
          </span>
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
