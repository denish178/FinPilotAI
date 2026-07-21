import { SlidersHorizontal, X } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import SearchBar from "../ui/SearchBar";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  SORT_OPTIONS,
} from "../../constants/transactions";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

export default function TransactionFilters({
  filters,
  onChange,
  onReset,
  showAdvanced,
  onToggleAdvanced,
}) {
  const categories =
    filters.type === "income"
      ? INCOME_CATEGORIES
      : filters.type === "expense"
        ? EXPENSE_CATEGORIES
        : [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

  const update = (key, value) => onChange({ ...filters, [key]: value });

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.category ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.paymentMethod ||
    filters.sortBy !== "date" ||
    filters.sortOrder !== "desc";

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchBar
          value={filters.search}
          onChange={(value) => update("search", value)}
          placeholder="Search by description..."
          className="flex-1"
        />
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.type}
            onChange={(e) => update("type", e.target.value)}
            className={selectClass}
          >
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) => update("sortBy", e.target.value)}
            className={selectClass}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.sortOrder}
            onChange={(e) => update("sortOrder", e.target.value)}
            className={selectClass}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
          <Button variant="outline" size="sm" onClick={onToggleAdvanced}>
            <SlidersHorizontal size={16} />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <X size={16} />
              Clear
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Payment method</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => update("paymentMethod", e.target.value)}
              className={selectClass}
            >
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Min amount"
            type="number"
            min="0"
            value={filters.minAmount}
            onChange={(e) => update("minAmount", e.target.value)}
          />
          <Input
            label="Max amount"
            type="number"
            min="0"
            value={filters.maxAmount}
            onChange={(e) => update("maxAmount", e.target.value)}
          />
          <Input
            label="From date"
            type="date"
            value={filters.startDate}
            onChange={(e) => update("startDate", e.target.value)}
          />
          <Input
            label="To date"
            type="date"
            value={filters.endDate}
            onChange={(e) => update("endDate", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
