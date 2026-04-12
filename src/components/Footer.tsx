const collectionLinks = [
  "Hoshisora — Gold",
  "Hoshisora — Blue",
  "Bushido Edition A–G",
  "Limited Releases",
];

const aboutLinks = [
  "Our Story",
  "Mt. Fuji Terroir",
  "Bushido Philosophy",
  "Contact",
];

export default function Footer() {
  return (
    <footer className="bg-ink pt-[clamp(64px,8vw,100px)] pb-[clamp(32px,4vw,60px)] border-t border-gold/15">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-[clamp(32px,5vw,80px)] max-w-[1240px] mx-auto px-[clamp(24px,5vw,60px)] pb-[clamp(40px,5vw,60px)] border-b border-gold/10">
        {/* Brand */}
        <div>
          <p className="font-serif text-[clamp(20px,2.5vw,28px)] font-light text-gold-lt mb-2">
            Amachi Hoshisora
          </p>
          <p className="font-jp text-xs font-extralight tracking-[4px] text-silver mb-5">
            天地星空　·　Mt. Fuji Sake Project
          </p>
          <p className="text-sm italic text-off-white/42 leading-[1.7] max-w-[280px]">
            Born of stars, brewed in silence — a sake of self-mastery and the timeless spirit of Mt. Fuji.
          </p>
        </div>

        {/* Collection */}
        <div>
          <p className="text-[10px] tracking-[4px] uppercase text-gold font-normal mb-5">
            Collection
          </p>
          <ul className="list-none space-y-3">
            {collectionLinks.map((link) => (
              <li key={link}>
                <a href="#" className="text-sm font-light text-off-white/50 no-underline hover:text-gold transition-colors duration-300">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* About */}
        <div>
          <p className="text-[10px] tracking-[4px] uppercase text-gold font-normal mb-5">
            About
          </p>
          <ul className="list-none space-y-3">
            {aboutLinks.map((link) => (
              <li key={link}>
                <a href="#" className="text-sm font-light text-off-white/50 no-underline hover:text-gold transition-colors duration-300">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-[1240px] mx-auto px-[clamp(24px,5vw,60px)] pt-7 flex justify-between items-center flex-wrap gap-3 max-sm:flex-col max-sm:text-center">
        <p className="text-[11px] text-off-white/28">
          © 2025 Mt. Fuji Sake Project. All rights reserved.
        </p>
        <p className="font-jp text-xs font-extralight tracking-[3px] text-off-white/28">
          富士市　静岡県　日本
        </p>
      </div>
    </footer>
  );
}
