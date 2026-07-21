import { cn } from "../../utils/cn";

export default function Badge({ children, variant = "default", className }) {
  const variants = {
    default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
