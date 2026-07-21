import { cn } from "../../utils/cn";

export default function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, className }) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <p
              className={cn(
                "mt-2 text-xs font-medium",
                trend > 0 ? "text-red-500" : "text-primary-600",
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}% vs last month
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-primary-50 p-3 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            <Icon size={20} />
          </div>
        )}
      </div>
    </Card>
  );
}
