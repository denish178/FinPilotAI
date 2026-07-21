import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

export default function SearchBar({ value, onChange, placeholder = "Search...", className }) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  );
}
