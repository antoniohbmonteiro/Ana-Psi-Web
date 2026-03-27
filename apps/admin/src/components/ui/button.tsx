import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "text-white shadow-[0_10px_24px_rgba(182,166,202,0.32)] hover:opacity-95",
  secondary: "hover:opacity-95",
  ghost: "hover:bg-white/60",
  danger: "text-white hover:opacity-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const styleMap: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: "var(--primary)" },
  secondary: {
    backgroundColor: "var(--secondary)",
    color: "var(--foreground)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--foreground)",
  },
  danger: {
    backgroundColor: "var(--destructive)",
  },
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      style={{ ...styleMap[variant], ...style }}
      {...props}
    />
  );
}