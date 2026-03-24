import { MessageCircle } from "lucide-react";
import { LandingShell } from "@/features/landing/components/landing-shell";
import { PortraitCard } from "@/features/landing/components/portrait-card";
import type { LandingContent } from "@/features/landing/types/content";
import { buildWhatsappLink } from "@/features/landing/utils/build-whatsapp-link";

type LandingHeroProps = {
  content: LandingContent;
};

const titleLines = [
  { prefix: "Cuide da sua ", highlight: "saúde" },
  { highlight: "mental", suffix: " com" },
  { prefix: "acolhimento" },
  { prefix: "profissional" },
];

export function LandingHero({ content }: LandingHeroProps) {
  const { professional, contact, hero } = content;
  const whatsappLink = buildWhatsappLink(contact.whatsapp, contact.whatsappMessage);

  return (
    <section className="overflow-hidden border-b border-black/5 bg-[linear-gradient(180deg,#f7f5fb_0%,#f2eef9_100%)] py-16 md:py-20">
      <LandingShell className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(420px,600px)]">
        <div className="space-y-0">
          <h1 className="text-[58px] font-semibold tracking-[-0.06em] text-[#0f172a] md:text-[68px] lg:text-[72px]">
            {titleLines.map((line, index) => (
              <span key={index} className="block leading-[1.14]">
                {line.prefix ?? null}
                {line.highlight ? <span className="text-[#8b3dff]">{line.highlight}</span> : null}
                {line.suffix ?? null}
              </span>
            ))}
          </h1>

          <div className="mt-8 md:mt-9">
            <span className="inline-flex rounded-full bg-[#efe6ff] px-5 py-2 text-sm font-semibold text-[#8b3dff]">
              {hero.badge}
            </span>
          </div>

          <p className="mt-8 max-w-[620px] text-[18px] leading-[1.7] text-[#526072] md:text-[20px]">
            {hero.description}
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-10 inline-flex h-16 items-center justify-center gap-3 rounded-3xl bg-[#22c55e] px-7 text-lg font-semibold text-white shadow-[0_18px_48px_rgba(34,197,94,0.28)] transition hover:translate-y-[-1px]"
          >
            <MessageCircle className="h-6 w-6" />
            {hero.ctaLabel}
          </a>
        </div>

        <div className="relative pl-0 lg:pl-6">
          <PortraitCard src={hero.imageSrc} alt={`Retrato de ${professional.displayName}`} variant="hero" />

          <div className="absolute bottom-[-24px] left-6 rounded-[28px] bg-white px-6 py-5 shadow-[0_24px_60px_rgba(17,24,39,0.16)] md:left-10">
            <p className="text-5xl font-semibold tracking-[-0.04em] text-[#8b3dff]">{hero.statValue}</p>
            <p className="mt-2 max-w-[140px] text-base leading-6 text-[#526072]">{hero.statText}</p>
          </div>
        </div>
      </LandingShell>
    </section>
  );
}
