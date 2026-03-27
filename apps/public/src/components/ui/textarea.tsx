import * as React from "react";
import { cn } from "@/lib/cn";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition",
        className
      )}
      style={{
        borderColor: "var(--border)",
        background: "var(--input-background)",
        color: "var(--foreground)",
      }}
      {...props}
    />
  );
}