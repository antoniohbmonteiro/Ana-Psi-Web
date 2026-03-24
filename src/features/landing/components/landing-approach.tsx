import { LandingContent } from "@/features/landing/types/content";
import { LandingShell } from "./landing-shell";
import { getPrincipleIcon } from "./icon-map";

export function LandingApproach({ content }: { content: LandingContent }) {
  return (
    <section className="bg-white py-24 md:py-28">
      <LandingShell>
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div className="inline-flex rounded-full bg-[#EDE9FE] px-4 py-2 text-sm font-medium text-[#9333EA]">
              {content.approach.badge}
            </div>
            <h2 className="mt-6 text-4xl leading-tight font-medium text-[#111827] md:text-5xl">
              {content.approach.title} <span className="text-[#9333EA]">{content.approach.highlight}</span>
            </h2>
          </div>

          <div className="mt-12 rounded-[32px] border border-[#EDE9FE] bg-gradient-to-br from-[#F8F5FF] to-white p-8 md:p-12">
            <div className="space-y-6 text-[18px] leading-9 text-[#475569]">
              {content.approach.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {content.approach.principles.map((principle) => {
              const Icon = getPrincipleIcon(principle.icon);

              return (
                <article key={principle.title} className="rounded-[24px] border-2 border-[#F1EDF8] bg-white p-6 transition-all duration-200 hover:border-[#9333EA] hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#EDE9FE]">
                    <Icon className="h-7 w-7 text-[#9333EA]" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-[#111827]">{principle.title}</h3>
                  <p className="mt-3 text-[16px] leading-7 text-[#667085]">{principle.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </LandingShell>
    </section>
  );
}
