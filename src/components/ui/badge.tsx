type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    backgroundColor: "var(--secondary)",
    color: "var(--muted-foreground)",
  },
  primary: {
    backgroundColor: "rgba(182,166,202,0.22)",
    color: "var(--primary-dark)",
  },
  success: {
    backgroundColor: "rgba(34,197,94,0.12)",
    color: "var(--success)",
  },
  warning: {
    backgroundColor: "rgba(245,158,11,0.14)",
    color: "var(--warning)",
  },
  danger: {
    backgroundColor: "rgba(232,93,117,0.14)",
    color: "var(--destructive)",
  },
  info: {
    backgroundColor: "rgba(96,165,250,0.14)",
    color: "var(--info)",
  },
};

export function Badge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={variantStyles[variant]}
    >
      {children}
    </span>
  );
}