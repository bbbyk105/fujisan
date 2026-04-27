"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal, revealDelays } from "@/components/Reveal";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    const mailtoSubject = encodeURIComponent(
      formData.subject || "Inquiry from Mt. Fuji Sake Project Website"
    );
    const mailtoBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\n\n${formData.message}`
    );

    window.location.href = `mailto:mtfujipharmacy@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;

    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
    }, 1000);
  };

  const inputClass =
    "w-full bg-transparent border-b border-off-white/15 focus:border-gold/50 outline-none py-3 px-0 text-[15px] text-off-white/82 font-normal placeholder:text-off-white/24 transition-colors duration-500";
  const labelClass =
    "text-[10px] tracking-[0.26em] uppercase text-off-white/44 mb-2 block";

  return (
    <main className="bg-ink min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-10 py-5 bg-ink/90 backdrop-blur-[16px] border-b border-gold/8">
        <Link
          href="/"
          className="font-serif text-[13px] tracking-[0.28em] uppercase text-gold no-underline hover:text-gold-lt transition-colors"
        >
          Amachi Hoshisora
        </Link>
        <Link
          href="/#bushido"
          className="text-[11px] tracking-[0.22em] uppercase text-off-white/50 no-underline hover:text-gold transition-colors"
        >
          ← Back
        </Link>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-8 text-center">
        <Reveal as="p" className="text-[11px] tracking-[0.3em] uppercase text-gold/60 mb-6">
          Contact
        </Reveal>
        <Reveal as="h1" className="font-serif text-[clamp(36px,6vw,64px)] font-normal leading-[1.12] mb-4" delay={revealDelays.d1}>
          Get in Touch
        </Reveal>
        <Reveal className="w-[40px] h-px bg-gold/30 mx-auto mb-6" delay={revealDelays.d1} />
        <Reveal as="p" className="text-[clamp(14px,1.6vw,17px)] text-off-white/62 font-normal max-w-[520px] mx-auto leading-[1.9]" delay={revealDelays.d2}>
          For inquiries about our Bushido Edition, wholesale, or collaborations,
          please reach out to us below.
        </Reveal>
      </section>

      {/* Form */}
      <section className="max-w-[640px] mx-auto px-[clamp(24px,5vw,60px)] pb-[clamp(80px,10vw,140px)]">
        {submitted ? (
          <Reveal className="text-center py-20">
            <p className="font-jp text-4xl text-gold/60 mb-6">感謝</p>
            <h2 className="font-serif text-[clamp(24px,3vw,36px)] font-normal mb-4">
              Thank You
            </h2>
            <p className="text-[15px] text-off-white/62 font-normal leading-[1.9] mb-8">
              Your email client should have opened with a pre-filled message.<br />
              We will respond within 2 business days.
            </p>
            <Link
              href="/"
              className="inline-block text-[11px] tracking-[0.26em] uppercase text-gold/60 border border-gold/25 px-8 py-3 no-underline hover:bg-gold/10 hover:border-gold/50 transition-all duration-500"
            >
              Return Home
            </Link>
          </Reveal>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10">
            <Reveal className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className={labelClass}>
                  Name <span className="text-crimson/60">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </Reveal>

            <Reveal className="grid grid-cols-1 sm:grid-cols-2 gap-8" delay={revealDelays.d1}>
              <div>
                <label className={labelClass}>Company</label>
                <input
                  type="text"
                  placeholder="Company name"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Subject</label>
                <input
                  type="text"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
            </Reveal>

            <Reveal delay={revealDelays.d2}>
              <label className={labelClass}>
                Message <span className="text-crimson/60">*</span>
              </label>
              <textarea
                required
                rows={6}
                placeholder="Tell us about your inquiry..."
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className={`${inputClass} resize-none border border-off-white/10 focus:border-gold/30 px-4 pt-4`}
              />
            </Reveal>

            <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-4" delay={revealDelays.d3}>
              <button
                type="submit"
                disabled={sending}
                className="text-[12px] tracking-[0.26em] uppercase text-gold border border-gold/30 px-10 py-3.5 bg-transparent hover:bg-gold/10 hover:border-gold/60 transition-all duration-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
              <p className="text-[11px] text-off-white/30">
                Or email directly:{" "}
                <a
                  href="mailto:mtfujipharmacy@gmail.com"
                  className="text-gold/50 hover:text-gold no-underline transition-colors"
                >
                  mtfujipharmacy@gmail.com
                </a>
              </p>
            </Reveal>
          </form>
        )}
      </section>

      {/* Footer credit */}
      <footer className="border-t border-gold/8 py-12 text-center bg-ink">
        <p className="font-serif text-[14px] text-off-white/40 mb-1">
          Mt. Fuji Sake Project
        </p>
        <p className="text-[12px] text-off-white/30 tracking-[1px] mb-4">
          By KONDO PHARMACY Co., Ltd.
        </p>
        <p className="text-[10px] text-off-white/15 tracking-[2px]">
          mtfujipharmacy@gmail.com
        </p>
      </footer>
    </main>
  );
}
