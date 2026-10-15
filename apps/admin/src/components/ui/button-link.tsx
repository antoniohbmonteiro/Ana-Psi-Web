import Link from "next/link";
import type * as React from "react";
import { buttonAppearance, type ButtonStyleOptions } from "@/components/ui/button";

type ButtonLinkProps = Omit<React.ComponentProps<typeof Link>, "className" | "style"> & ButtonStyleOptions;

export function ButtonLink({ variant, size, className, style, ...props }: ButtonLinkProps) {
  return <Link {...buttonAppearance({ variant, size, className, style })} {...props} />;
}
