"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
    </svg>
  );
}

export default function BtoBLoginPage() {
  useEffect(() => {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }, []);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    companyId: "",
    remember: false,
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  const handleGoogle = () => {
    setGoogleLoading(true);
    setTimeout(() => setGoogleLoading(false), 1500);
  };

  const inputClass =
    "w-full bg-transparent border-b border-off-white/15 focus:border-gold/50 outline-none py-3 px-0 text-[15px] text-off-white/80 font-serif font-light placeholder:text-off-white/20 transition-colors duration-500";
  const labelClass =
    "text-[10px] tracking-[4px] uppercase text-off-white/40 mb-2 block";

  return (
    <main className="min-h-screen bg-ink flex flex-col lg:flex-row">
      {/* Left Panel — Brand */}
      <div className="relative lg:w-[45%] flex flex-col justify-between px-[clamp(32px,6vw,80px)] py-[clamp(40px,6vw,72px)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #C9A84C 1px, transparent 1px), linear-gradient(to bottom, #C9A84C 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <Link
          href="/"
          className="relative font-serif text-[13px] tracking-[5px] uppercase text-gold no-underline hover:text-gold-lt transition-colors duration-300"
        >
          Amachi Hoshisora
        </Link>

        <div className="relative py-16">
          <p className="text-[10px] tracking-[6px] uppercase text-gold/50 mb-8">
            Business Portal
          </p>
          <h1 className="font-serif text-[clamp(32px,4.5vw,52px)] font-light leading-[1.1] text-off-white mb-6">
            Partner<br />
            <span className="text-gold">Access</span>
          </h1>
          <div className="w-[36px] h-px bg-gold/30 mb-8" />
          <p className="text-[14px] text-off-white/45 font-light leading-[1.9] max-w-[360px]">
            Exclusive portal for authorised distributors, retailers,
            and hospitality partners of Mt. Fuji Sake Project.
          </p>
          <p className="font-jp text-[clamp(60px,8vw,100px)] font-light text-gold/6 leading-none select-none mt-10">
            商
          </p>
        </div>

        <div className="relative">
          <p className="text-[11px] text-off-white/30 leading-[1.7]">
            Not a partner yet?{" "}
            <Link
              href="/contact"
              className="text-gold/55 hover:text-gold no-underline transition-colors duration-300"
            >
              Request access →
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block w-px bg-gold/10 my-16" />

      {/* Right Panel — Form */}
      <div className="flex-1 flex flex-col justify-center px-[clamp(32px,6vw,100px)] py-[clamp(60px,8vw,100px)]">
        <div className="flex items-center justify-end mb-12">
          <Link
            href="/"
            className="text-[11px] tracking-[3px] uppercase text-off-white/35 no-underline hover:text-gold transition-colors duration-300"
          >
            ← Back to site
          </Link>
        </div>

        <div className="max-w-[420px] w-full mx-auto lg:mx-0">
          <h2 className="font-serif text-[clamp(24px,3vw,32px)] font-light text-off-white mb-2">
            Sign In
          </h2>
          <p className="text-[12px] tracking-[2px] uppercase text-off-white/35 mb-10">
            Business Partner Portal
          </p>

          {/* Google Sign-In */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-off-white/12 hover:border-off-white/25 bg-transparent hover:bg-off-white/4 py-3.5 transition-all duration-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer group"
          >
            {googleLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
            ) : (
              <GoogleIcon />
            )}
            <span className="text-[12px] tracking-[3px] uppercase text-off-white/60 group-hover:text-off-white/85 transition-colors duration-300">
              {googleLoading ? "Redirecting..." : "Continue with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-off-white/8" />
            <span className="text-[10px] tracking-[2px] uppercase text-off-white/25">
              Or continue with email
            </span>
            <div className="flex-1 h-px bg-off-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-9">
            <div>
              <label className={labelClass}>
                Company ID <span className="text-crimson/60">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AMH-JP-0001"
                value={formData.companyId}
                onChange={(e) =>
                  setFormData({ ...formData, companyId: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Email <span className="text-crimson/60">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="partner@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelClass.replace("mb-2", "")}>
                  Password <span className="text-crimson/60">*</span>
                </label>
                <button
                  type="button"
                  className="text-[10px] tracking-[2px] uppercase text-gold/45 hover:text-gold bg-transparent border-none cursor-pointer transition-colors duration-300"
                >
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={formData.remember}
                onClick={() =>
                  setFormData({ ...formData, remember: !formData.remember })
                }
                className={`w-4 h-4 border flex items-center justify-center transition-all duration-300 bg-transparent cursor-pointer shrink-0 ${
                  formData.remember
                    ? "border-gold/60 bg-gold/15"
                    : "border-off-white/20"
                }`}
              >
                {formData.remember && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 3.5L3.5 6L8 1" />
                  </svg>
                )}
              </button>
              <span className="text-[11px] text-off-white/35">Keep me signed in</span>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full text-[12px] tracking-[4px] uppercase text-gold border border-gold/30 py-4 bg-transparent hover:bg-gold/8 hover:border-gold/55 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-off-white/6">
            <p className="text-[12px] text-off-white/30 text-center">
              Member account?{" "}
              <Link
                href="/login/member"
                className="text-gold/55 hover:text-gold no-underline transition-colors duration-300"
              >
                Member Login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
