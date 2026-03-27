import { Card, CardContent } from "@/components/ui/card";

export function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h3>{title}</h3>
          {description ? <p className="mt-1 text-sm app-muted">{description}</p> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}