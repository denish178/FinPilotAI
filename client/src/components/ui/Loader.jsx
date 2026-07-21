import { cn } from "../../utils/cn";

export default function Loader({ className, size = "md" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-primary-200 border-t-primary-600",
          sizes[size],
        )}
      />
    </div>
  );
}

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800",
        className,
      )}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader size="lg" />
    </div>
  );
}
