import Card from "../ui/Card";
import { cn } from "../../utils/cn";

export default function ChartCard({ title, subtitle, children, className, action }) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function ChartEmpty({ message = "No data for this period" }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
