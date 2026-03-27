import { cn } from "@/lib/cn";

type PortraitCardProps = {
  src: string;
  alt: string;
  variant?: "hero" | "about";
};

const variantClasses = {
  hero: {
    wrapper: "min-h-[360px] md:min-h-[560px]",
    frame: "h-[360px] md:h-[560px]",
    image: "object-contain object-bottom",
  },
  about: {
    wrapper: "min-h-[360px] md:min-h-[560px]",
    frame: "h-[360px] md:h-[560px]",
    image: "object-cover object-center",
  },
};

export function PortraitCard({ src, alt, variant = "hero" }: PortraitCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,#f2ebff_0%,#efe8fb_68%,#ede4fb_100%)] shadow-[0_24px_80px_rgba(17,24,39,0.12)]",
        variantClasses[variant].wrapper
      )}
    >
      <div className="absolute inset-x-10 top-10 h-24 rounded-full bg-white/26 blur-3xl" />
      <div className="absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(139,61,255,0)_0%,rgba(139,61,255,0.04)_42%,rgba(139,61,255,0.16)_78%,rgba(139,61,255,0.28)_100%)]" />

      <div className={cn("relative w-full", variantClasses[variant].frame)}>
        <img
          src={src}
          alt={alt}
          className={cn("relative z-[1] h-full w-full select-none", variantClasses[variant].image)}
          draggable={false}
        />
      </div>
    </div>
  );
}
