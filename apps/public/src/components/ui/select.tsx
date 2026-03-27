import * as React from "react";
import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn("app-input appearance-none", className)}
      {...props}
    >
      {children}
    </select>
  );
}