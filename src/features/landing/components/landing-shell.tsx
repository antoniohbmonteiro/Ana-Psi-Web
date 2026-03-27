import type { ComponentPropsWithoutRef } from "react";

type LandingShellProps = ComponentPropsWithoutRef<"div">;

export function LandingShell({ children, className, ...props }: LandingShellProps) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-[1200px] px-5 sm:px-6 lg:px-8",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}