import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS, CHART_THEME } from "../../constants/charts";
import { formatCurrency } from "../../utils/format";
import { CurrencyTooltip } from "./ChartTooltip";
import { ChartEmpty } from "./ChartCard";

export function ExpensePieChart({ data, currency }) {
  if (!data?.length) return <ChartEmpty message="No expense data for this period" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={100}
          paddingAngle={2}
          label={({ category, percentage }) => `${category} (${percentage}%)`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomePieChart({ data, currency }) {
  if (!data?.length) return <ChartEmpty message="No income data for this period" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={100}
          paddingAngle={2}
          label={({ category, percentage }) => `${category} (${percentage}%)`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function IncomeExpenseBarChart({ comparison, currency }) {
  const barData = [
    {
      name: "Income",
      current: comparison?.current?.income || 0,
      previous: comparison?.previous?.income || 0,
    },
    {
      name: "Expense",
      current: comparison?.current?.expense || 0,
      previous: comparison?.previous?.expense || 0,
    },
    {
      name: "Net",
      current: comparison?.current?.net || 0,
      previous: comparison?.previous?.net || 0,
    },
  ];

  const hasData = barData.some((row) => row.current > 0 || row.previous > 0);
  if (!hasData) return <ChartEmpty message="No comparison data available" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={barData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
        <Bar dataKey="current" fill={CHART_THEME.income} name="This month" radius={[6, 6, 0, 0]} />
        <Bar dataKey="previous" fill={CHART_THEME.previous} name="Last month" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendLineChart({ data, currency }) {
  if (!data?.length) return <ChartEmpty message="No monthly trend data" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
        <Line type="monotone" dataKey="income" stroke={CHART_THEME.income} strokeWidth={2} dot={false} name="Income" />
        <Line type="monotone" dataKey="expense" stroke={CHART_THEME.expense} strokeWidth={2} dot={false} name="Expense" />
        <Line type="monotone" dataKey="net" stroke={CHART_THEME.net} strokeWidth={2} dot={false} name="Net" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendAreaChart({ data, currency }) {
  if (!data?.length) return <ChartEmpty message="No monthly trend data" />;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
        <Area type="monotone" dataKey="income" stroke={CHART_THEME.income} fill={`${CHART_THEME.income}33`} name="Income" />
        <Area type="monotone" dataKey="expense" stroke={CHART_THEME.expense} fill={`${CHART_THEME.expense}33`} name="Expense" />
        <Area type="monotone" dataKey="net" stroke={CHART_THEME.net} fill={`${CHART_THEME.net}22`} name="Net" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DailyExpenseBarChart({ data, currency, days = 14 }) {
  const slice = data?.slice(-days) || [];
  if (!slice.length || slice.every((d) => d.total === 0)) {
    return <ChartEmpty message="No daily spending in this period" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={slice}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Bar dataKey="total" fill={CHART_THEME.daily} name="Expense" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NetWorthLineChart({ data, currency }) {
  if (!data?.length) return <ChartEmpty message="No net worth trend data" />;

  const netWorthData = data.reduce((acc, row, index) => {
    const prev = index > 0 ? acc[index - 1].netWorth : 0;
    acc.push({
      label: row.label,
      netWorth: Number((prev + row.net).toFixed(2)),
      monthlyNet: row.net,
    });
    return acc;
  }, []);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={netWorthData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency)} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Legend />
        <Line type="monotone" dataKey="netWorth" stroke={CHART_THEME.net} strokeWidth={2} name="Net worth" dot />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CategoryBreakdownBars({ data, currency, type = "expense" }) {
  if (!data?.length) {
    return <ChartEmpty message={`No ${type} categories for this period`} />;
  }

  const color = type === "income" ? CHART_THEME.income : CHART_THEME.expense;

  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={(v) => formatCurrency(v, currency)} />
        <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11 }} />
        <Tooltip content={<CurrencyTooltip currency={currency} />} />
        <Bar dataKey="total" fill={color} name={type === "income" ? "Income" : "Expense"} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
