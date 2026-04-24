"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#top", label: "HOME" },
  { href: "#showcase", label: "OUR SAKE" },
  { href: "#art", label: "THE CRAFT" },
  { href: "#about", label: "ABOUT FUJISAN" },
  { href: "#stories", label: "STORIES" },
  { href: "#contact", label: "CONTACT" },
];

export default function FujisanNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("#top");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = navLinks.map((l) => l.href.replace("#", "")).filter(Boolean);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
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
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#F8F3E7]/92 backdrop-blur-md border-b border-ink/8"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between px-6 md:px-10 py-4">
        <Link href="#top" className="flex items-center gap-3 no-underline">
          <span className="font-jp text-[#0F1F36] font-semibold text-[22px] md:text-[28px] leading-none tracking-[0.02em]">
            富士山
          </span>
          <span className="font-serif text-[#0F1F36] text-[13px] md:text-[15px] tracking-[0.32em] font-medium">
            FUJISAN SAKE
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative text-[11px] tracking-[0.24em] font-semibold no-underline transition-colors duration-300 ${
                  isActive
                    ? "text-[#0F1F36]"
                    : "text-[#0F1F36]/75 hover:text-[#0F1F36]"
                }`}
              >
                {link.label}
                {isActive ? (
                  <span className="absolute -bottom-2 left-0 right-0 h-px bg-[#0F1F36]" />
                ) : null}
              </Link>
            );
          })}
          <span className="text-[11px] tracking-[0.24em] text-[#0F1F36]/80 font-medium select-none">
            JP <span className="text-[#0F1F36]/40">|</span> EN
          </span>
        </nav>

        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1"
        >
          <span
            className={`block w-6 h-px bg-[#0F1F36] transition-transform duration-300 ${
              open ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-6 h-px bg-[#0F1F36] transition-opacity duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-px bg-[#0F1F36] transition-transform duration-300 ${
              open ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      <div
        className={`lg:hidden absolute inset-x-0 top-full bg-[#F8F3E7] border-b border-ink/8 transition-all duration-400 overflow-hidden ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col px-8 py-6 gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-[12px] tracking-[0.3em] text-[#0F1F36] no-underline font-semibold"
            >
              {link.label}
            </Link>
          ))}
          <span className="text-[11px] tracking-[0.28em] text-ink/60 pt-2 border-t border-ink/10">
            JP | EN
          </span>
        </nav>
      </div>
    </header>
  );
}
