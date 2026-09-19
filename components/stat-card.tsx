import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: "default" | "warning" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <p
          className={cn(
            "text-2xl font-semibold",
            accent === "danger" && "text-red-600",
            accent === "warning" && "text-amber-600",
            (!accent || accent === "default") && "text-neutral-900"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
