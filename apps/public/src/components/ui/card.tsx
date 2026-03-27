import * as React from "react";
import { cn } from "@/lib/cn";

type DivProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({
  className,
  children,
  ...props
}: DivProps) {
  return (
    <div className={cn("app-card", className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: DivProps) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}