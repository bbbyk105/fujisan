"use client";

import { useState, useEffect, useRef } from "react";

const navLinks = [
  { href: "#story", label: "Story" },
  { href: "#collection", label: "Collection" },
  { href: "#bushido", label: "Bushido" },
  { href: "#terroir", label: "Terroir" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const loginRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (loginRef.current && !loginRef.current.contains(e.target as Node)) {
        setLoginOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const closeDrawer = () => {
    setDrawerOpen(false);
    document.body.style.overflow = "";
  };

  const toggleDrawer = () => {
    setDrawerOpen((prev) => {
      document.body.style.overflow = !prev ? "hidden" : "";
      return !prev;
    });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-100 flex items-center justify-between transition-all duration-500
          ${scrolled
            ? "bg-ink/95 backdrop-blur-[12px] border-b border-gold/18 px-12 py-4"
            : "px-12 py-6"
          }`}
      >
        <a
          href="#"
          className="font-serif text-[13px] tracking-[5px] uppercase text-gold no-underline shrink-0"
        >
          Amachi Hoshisora
        </a>

        <ul className="hidden md:flex gap-10 list-none items-center">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[12px] tracking-[3px] uppercase text-off-white/75 no-underline hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            </li>
          ))}

          {/* Login dropdown */}
          <li className="relative" ref={loginRef}>
            <button
              onClick={() => setLoginOpen((v) => !v)}
              className="flex items-center gap-2 text-[11px] tracking-[3px] uppercase text-off-white/70 hover:text-gold transition-colors duration-300 bg-transparent border-none cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Login
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
                className={`transition-transform duration-300 ${loginOpen ? "rotate-180" : ""}`}
              >
                <path d="M2 4L5 7L8 4" />
              </svg>
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 top-full mt-3 w-[220px] border border-gold/15 bg-ink/98 backdrop-blur-[20px] transition-all duration-300 ${
              loginOpen
                ? "opacity-100 visible translate-y-0"
                : "opacity-0 invisible -translate-y-2"
            }`}>
              <div className="p-1">
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3.5 no-underline text-off-white/70 hover:text-gold hover:bg-gold/5 transition-all duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 7l10 6 10-6" />
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                  </svg>
                  <div>
                    <p className="text-[11px] tracking-[2px] uppercase font-normal">BtoB Login</p>
                    <p className="text-[9px] text-off-white/35 mt-0.5">For business partners</p>
                  </div>
                </a>
                <div className="h-px bg-gold/8 mx-4" />
                <a
                  href="#"
                  className="flex items-center gap-3 px-5 py-3.5 no-underline text-off-white/70 hover:text-gold hover:bg-gold/5 transition-all duration-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div>
                    <p className="text-[11px] tracking-[2px] uppercase font-normal">Member Login</p>
                    <p className="text-[9px] text-off-white/35 mt-0.5">General membership</p>
                  </div>
                </a>
              </div>
            </div>
          </li>
        </ul>

        <button
          className="flex md:hidden flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1"
          aria-label="Menu"
          onClick={toggleDrawer}
        >
          <span
            className={`block w-6 h-px bg-gold transition-transform duration-300 ${
              drawerOpen ? "translate-y-[6px] rotate-45" : ""
            }`}
          />
          <span
            className={`block w-6 h-px bg-gold transition-opacity duration-300 ${
              drawerOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block w-6 h-px bg-gold transition-transform duration-300 ${
              drawerOpen ? "-translate-y-[6px] -rotate-45" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-0 z-90 bg-ink/98 flex flex-col items-center justify-center gap-8 transition-all duration-500
          ${drawerOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      >
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={closeDrawer}
            className="font-serif text-2xl tracking-[6px] uppercase text-off-white/70 no-underline hover:text-gold transition-colors"
          >
            {link.label}
          </a>
        ))}

        <div className="w-[40px] h-px bg-gold/20 my-2" />

        <a
          href="#"
          onClick={closeDrawer}
          className="text-[13px] tracking-[4px] uppercase text-gold/60 no-underline hover:text-gold transition-colors"
        >
          BtoB Login
        </a>
        <a
          href="#"
          onClick={closeDrawer}
          className="text-[13px] tracking-[4px] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
        >
          Member Login
        </a>
      </div>
    </>
  );
}
