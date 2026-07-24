"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { FujisanNavLinkItem } from "./fujisan-nav-links";
import { ensureGsap, gsap, useGSAP } from "./stories/gsap-setup";
import { LocaleSwitch } from "@/i18n/LocaleSwitch";
import { L } from "@/i18n/Localized";
import { AccountNavLink } from "./auth/AccountNavLink";
import { CartNavLink } from "./CartNavLink";

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

  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const lineTopRef = useRef<HTMLSpanElement>(null);
  const lineMidRef = useRef<HTMLSpanElement>(null);
  const lineBotRef = useRef<HTMLSpanElement>(null);
  const menuTlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);

  ensureGsap();

  // モバイルメニューの開閉タイムライン（パネル・スライド + 項目スタッガー）
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      const items = panel.querySelectorAll("[data-menu-item]");
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(
        panel,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.55, ease: "power4.out" },
        0,
      ).fromTo(
        items,
        { y: 26, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power3.out",
          stagger: 0.055,
          immediateRender: false,
        },
        0.16,
      );
      tl.eventCallback("onReverseComplete", () => {
        gsap.set(panel, { visibility: "hidden", pointerEvents: "none" });
      });
      menuTlRef.current = tl;
      return () => {
        tl.kill();
        menuTlRef.current = null;
      };
    },
    { scope: headerRef },
  );

  // open 状態 → タイムライン再生/逆再生 + ハンバーガーアイコンのモーフ
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduced ? 0 : 0.35;
    gsap.to(lineTopRef.current, {
      y: open ? 7 : 0,
      rotate: open ? 45 : 0,
      duration: dur,
      ease: "power2.inOut",
    });
    gsap.to(lineMidRef.current, {
      opacity: open ? 0 : 1,
      scaleX: open ? 0.3 : 1,
      duration: dur,
      ease: "power2.inOut",
    });
    gsap.to(lineBotRef.current, {
      y: open ? -7 : 0,
      rotate: open ? -45 : 0,
      duration: dur,
      ease: "power2.inOut",
    });

    const tl = menuTlRef.current;
    const panel = panelRef.current;
    if (!tl || !panel) return;
    if (open) {
      gsap.set(panel, { visibility: "visible", pointerEvents: "auto" });
      if (reduced) tl.progress(1);
      else tl.timeScale(1).play();
    } else if (reduced) {
      tl.progress(0);
      gsap.set(panel, { visibility: "hidden", pointerEvents: "none" });
    } else {
      tl.timeScale(1.4).reverse();
    }
  }, [open]);

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
    // Path-style match (e.g. "/stories" or "/shop")
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

  // 遷移ローディング中（view transition で header が保持される間）に
  // 開いたままのドロップダウンが残らないよう、クリック即時で閉じる
  const closeMenuNow = () => {
    cancelClose();
    setOpenMenu(null);
  };

  return (
    <header
      ref={headerRef}
      style={{ viewTransitionName: "site-header" }}
      className={`fixed top-0 inset-x-0 z-50 border-b border-[#0F1F36]/14 transition-shadow duration-500 ${
        scrolled ? "shadow-[0_6px_28px_rgba(15,31,54,0.08)]" : ""
      }`}
    >
      {/* 背景 + ブラーはヘッダー本体ではなく内側レイヤーに置く。
          ヘッダー自身に backdrop-filter を付けると fixed 子孫（モバイルメニュー）の
          包含ブロックになり、パネルの inset-0 がヘッダー枠に閉じ込められるため。 */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 ${
          scrolled ? "bg-[#F6F0E5]/95 backdrop-blur-md" : "bg-[#F6F0E5]/96"
        }`}
      />
      <div className="mx-auto flex h-[72px] max-w-[1760px] items-center justify-between px-5 sm:px-7 md:h-[86px] md:px-9 lg:px-[4.5vw] 2xl:px-16">
        <Link
          href="/#top"
          aria-label="FUJISAN SAKE home"
          className="relative block h-[44px] w-[178px] overflow-hidden no-underline sm:w-[210px] md:h-[52px] md:w-[250px]"
        >
          <Image
            src="/images/logo/header-logo.webp"
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
                  onClick={closeMenuNow}
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
                  <div className="w-[340px] border border-[#0F1F36]/12 bg-paper-card/98 shadow-[0_28px_60px_rgba(15,31,54,0.18)] backdrop-blur-md">
                    <div
                      aria-hidden
                      className="h-px w-full bg-linear-to-r from-transparent via-[#C9A84C]/55 to-transparent"
                    />
                    <ul className="flex flex-col py-3">
                      {link.children!.map((child, i) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={closeMenuNow}
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
          <CartNavLink />
          <LocaleSwitch />
        </nav>

        {/* Mobile: カート常時露出 + toggle（カートをハンバーガー内に隠さない） */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <CartNavLink compact />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="fujisan-mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="relative z-[60] flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-[6px] border border-[#0F1F36]/20 bg-paper-card/80 p-0"
          >
            <span
              ref={lineTopRef}
              className="block h-px w-5 bg-[#0F1F36]"
            />
            <span
              ref={lineMidRef}
              className="block h-px w-5 bg-[#0F1F36]"
            />
            <span
              ref={lineBotRef}
              className="block h-px w-5 bg-[#0F1F36]"
            />
          </button>
        </div>
      </div>

      {/* Mobile menu panel — 全画面エディトリアルメニュー（GSAP 駆動） */}
      <aside
        ref={panelRef}
        id="fujisan-mobile-menu"
        aria-hidden={!open}
        className="fujisan-paper fixed inset-0 z-50 flex flex-col bg-[#F6F0E5] lg:hidden"
        style={{ visibility: "hidden", pointerEvents: "none" }}
      >
        <div
          aria-hidden
          className="mt-[72px] h-px w-full shrink-0 bg-linear-to-r from-transparent via-[#C9A84C]/55 to-transparent md:mt-[86px]"
        />
        <nav
          aria-label="Mobile"
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-7 pb-8 pt-9 sm:px-9"
        >
          <p data-menu-item className="flex items-center gap-4">
            <span className="font-serif text-[10px] font-medium tracking-[0.36em] text-[#C9A84C]">
              MENU
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="font-jp text-[10.5px] tracking-[0.3em] text-[#0F1F36]/55">
              <L en="NAVIGATION" ja="メニュー" />
            </span>
          </p>

          <ul className="mt-5 flex flex-col">
            {links.map((link, i) => {
              const active = isActive(link);
              return (
                <li
                  key={link.href}
                  data-menu-item
                  className="border-b border-[#0F1F36]/10"
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="group flex items-baseline gap-4 py-[18px] no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
                  >
                    <span className="font-serif text-[10.5px] font-medium tracking-[0.3em] text-[#C9A84C]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-serif text-[22px] font-semibold tracking-[0.1em] transition-colors duration-300 sm:text-[24px] ${
                        active
                          ? "text-[#0F1F36]"
                          : "text-[#0F1F36]/85 group-hover:text-[#0F1F36]"
                      }`}
                    >
                      {link.label}
                    </span>
                    {active ? (
                      <span
                        aria-hidden
                        className="ml-auto h-px w-10 self-center bg-[#C9A84C]"
                      />
                    ) : null}
                  </Link>

                  {link.children?.length ? (
                    <ul className="flex flex-col pb-4 pl-10">
                      {link.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className="group/sub flex items-baseline gap-3 py-2 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60"
                          >
                            <span
                              aria-hidden
                              className="h-px w-4 self-center bg-[#C9A84C]/50 transition-all duration-300 group-hover/sub:w-6 group-hover/sub:bg-[#C9A84C]"
                            />
                            <span className="font-serif text-[12.5px] font-semibold tracking-[0.18em] text-[#0F1F36]/80 transition-colors duration-300 group-hover/sub:text-[#0F1F36]">
                              {child.label}
                            </span>
                            {child.jp ? (
                              <span className="font-jp text-[10px] tracking-[0.22em] text-[#C9A84C]/85">
                                {child.jp}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div data-menu-item className="mt-auto pt-8">
            <div className="border-t border-[#0F1F36]/12">
              <AccountNavLink mobile />
              <CartNavLink mobile />
            </div>
            <div className="mt-6 flex items-center justify-between gap-4">
              <LocaleSwitch />
              <p className="font-jp text-[10px] tracking-[0.24em] text-[#0F1F36]/45">
                <L en="SAKE FROM THE FOOT OF MT. FUJI" ja="富士山麓の日本酒" />
              </p>
            </div>
          </div>
        </nav>
      </aside>
    </header>
  );
}
