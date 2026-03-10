import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  title,
  value,
  helper,
  iconSlot,
}: {
  title: string;
  value: string;
  helper?: string;
  iconSlot?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium app-muted">{title}</p>
            <p className="mt-3 text-[44px] font-medium leading-none tracking-tight">{value}</p>
            {helper ? <p className="mt-3 text-sm app-muted">{helper}</p> : null}
          </div>
          {iconSlot ? <div>{iconSlot}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}