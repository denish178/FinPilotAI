import { formatCurrency } from "../../utils/format";

export function CurrencyTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900">
      {label && <p className="mb-1 font-medium text-slate-700 dark:text-slate-200">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="text-xs">
          {entry.name}: {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  );
}
