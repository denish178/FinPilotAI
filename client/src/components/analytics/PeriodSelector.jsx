import { MONTHS, getYearOptions } from "../../constants/charts";

const selectClass =
  "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

export default function PeriodSelector({ month, year, onChange }) {
  const years = getYearOptions(6);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={month}
        onChange={(e) => onChange({ month: Number(e.target.value), year })}
        className={selectClass}
        aria-label="Select month"
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => onChange({ month, year: Number(e.target.value) })}
        className={selectClass}
        aria-label="Select year"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
