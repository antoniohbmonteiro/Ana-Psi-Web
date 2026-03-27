import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  primaryActionLabel,
}: {
  title: string;
  description?: string;
  primaryActionLabel?: string;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[28px] border bg-white/70 px-6 py-6 backdrop-blur md:flex-row md:items-center md:justify-between"
      style={{ borderColor: "var(--border)" }}
    >
      <div>
        <h1>{title}</h1>
        {description ? <p className="mt-2 text-sm app-muted">{description}</p> : null}
      </div>

      {primaryActionLabel ? <Button>{primaryActionLabel}</Button> : null}
    </div>
  );
}