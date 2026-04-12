"use client";

import { useState, useEffect } from "react";

const navLinks = [
  { href: "#story", label: "Story" },
  { href: "#collection", label: "Collection" },
  { href: "#bushido", label: "Bushido" },
  { href: "#terroir", label: "Terroir" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
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
          className="font-serif text-xs tracking-[5px] uppercase text-gold no-underline shrink-0"
        >
          Amachi Hoshisora
        </a>

        <ul className="hidden md:flex gap-10 list-none">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="text-[11px] tracking-[3px] uppercase text-off-white/70 no-underline hover:text-gold transition-colors duration-300"
              >
                {link.label}
              </a>
            </li>
          ))}
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
        className={`fixed inset-0 z-90 bg-ink/98 flex flex-col items-center justify-center gap-10 transition-all duration-500
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
      </div>
    </>
  );
}
