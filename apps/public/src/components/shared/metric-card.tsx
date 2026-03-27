import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  title,
  value,
  helper,
  icon,
  iconBg,
  iconColor,
}: {
  title: string;
  value: string;
  helper?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-card-label">{title}</p>
            <p className="mt-2 text-metric-value">{value}</p>
            {helper ? <p className="mt-1 text-metric-helper">{helper}</p> : null}
          </div>

          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: iconBg, color: iconColor }}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}