import { LandingContent } from "@/features/landing/types/content";
import { LandingShell } from "./landing-shell";
import { getInfoIcon } from "./icon-map";

export function LandingInfoCards({ content }: { content: LandingContent }) {
  return (
    <section className="bg-[#F5F3FF] py-24 md:py-28">
      <LandingShell>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-4">
          {content.info.map((item) => {
            const Icon = getInfoIcon(item.icon);

            return (
              <article key={item.title} className="rounded-[22px] bg-white px-6 py-8 text-center shadow-[0_16px_36px_rgba(15,23,42,0.04)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDE9FE]">
                  <Icon className="h-6 w-6 text-[#9333EA]" />
                </div>
                <div className="mt-5 text-sm text-[#667085]">{item.title}</div>
                <div className="mt-2 text-[18px] font-medium text-[#111827] md:text-[20px]">{item.value}</div>
                <div className="mt-2 text-sm leading-7 text-[#667085]">{item.detail}</div>
              </article>
            );
          })}
        </div>
      </LandingShell>
    </section>
  );
}
