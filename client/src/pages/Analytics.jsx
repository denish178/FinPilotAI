import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
} from "lucide-react";
import { StatCard } from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Loader";
import ChartCard from "../components/analytics/ChartCard";
import PeriodSelector from "../components/analytics/PeriodSelector";
import {
  ExpensePieChart,
  IncomePieChart,
  IncomeExpenseBarChart,
  MonthlyTrendLineChart,
  MonthlyTrendAreaChart,
  DailyExpenseBarChart,
  NetWorthLineChart,
  CategoryBreakdownBars,
} from "../components/analytics/FinanceCharts";
import { dashboardService } from "../services";
import { formatCurrency, formatPercent } from "../utils/format";
import { useSettingsStore } from "../stores/settingsStore";

const now = new Date();

export default function Analytics() {
  const currency = useSettingsStore((s) => s.currency);
  const [period, setPeriod] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["analytics", period.month, period.year],
    queryFn: () =>
      dashboardService
        .getOverview({ month: period.month, year: period.year, days: 30 })
        .then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const summary = data?.summary || {};
  const expenseCats = data?.expenseByCategory || [];
  const incomeCats = data?.incomeByCategory || [];
  const monthly = data?.last6Months || [];
  const daily = data?.dailyExpense || [];
  const comparison = data?.monthlyComparison;
  const topSpending = data?.topSpendingCategories || [];

  const savingsRate =
    summary.monthlyIncome > 0
      ? Math.round((summary.monthlyBalance / summary.monthlyIncome) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-slate-500">
            Charts, trends, and category insights for your finances
          </p>
        </div>
        <PeriodSelector
          month={period.month}
          year={period.year}
          onChange={setPeriod}
        />
      </div>

      {isFetching && (
        <p className="text-xs text-slate-400">Refreshing analytics...</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(summary.currentBalance, currency)}
          icon={Wallet}
          subtitle="Lifetime income minus expenses"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary.monthlyIncome, currency)}
          icon={TrendingUp}
          trend={comparison?.change?.incomePercent}
        />
        <StatCard
          title="Monthly Expense"
          value={formatCurrency(summary.monthlyExpense, currency)}
          icon={TrendingDown}
          trend={comparison?.change?.expensePercent}
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(summary.monthlyBalance, currency)}
          icon={PiggyBank}
          subtitle={`${savingsRate}% savings rate`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Expense by Category"
          subtitle="Pie chart — current month breakdown"
        >
          <ExpensePieChart data={expenseCats} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Income by Category"
          subtitle="Pie chart — current month breakdown"
        >
          <IncomePieChart data={incomeCats} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Income vs Expense"
          subtitle="Bar chart — this month vs last month"
        >
          <IncomeExpenseBarChart comparison={comparison} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Monthly Trends"
          subtitle="Line chart — last 6 months"
        >
          <MonthlyTrendLineChart data={monthly} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Cash Flow (Area)"
          subtitle="Area chart — income, expense & net"
        >
          <MonthlyTrendAreaChart data={monthly} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Net Worth Trend"
          subtitle="Cumulative net from monthly cash flow"
        >
          <NetWorthLineChart data={monthly} currency={currency} />
        </ChartCard>

        <ChartCard
          title="Daily Spending"
          subtitle="Bar chart — last 14 days"
        >
          <DailyExpenseBarChart data={daily} currency={currency} days={14} />
        </ChartCard>

        <ChartCard
          title="Top Spending Categories"
          subtitle="Highest expense categories this month"
        >
          {!topSpending.length ? (
            <p className="py-16 text-center text-sm text-slate-500">No spending data yet</p>
          ) : (
            <div className="space-y-3">
              {topSpending.map((cat, index) => (
                <div
                  key={cat.category}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{cat.category}</p>
                      <p className="text-xs text-slate-500">{cat.count} transactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(cat.total, currency)}</p>
                    <Badge variant={cat.percentage > 30 ? "warning" : "default"}>
                      {formatPercent(cat.percentage)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Expense Category Breakdown"
          subtitle="Horizontal bar chart"
          action={<BarChart3 size={18} className="text-slate-400" />}
        >
          <CategoryBreakdownBars data={expenseCats} currency={currency} type="expense" />
        </ChartCard>

        <ChartCard
          title="Income Category Breakdown"
          subtitle="Horizontal bar chart"
          action={<BarChart3 size={18} className="text-slate-400" />}
        >
          <CategoryBreakdownBars data={incomeCats} currency={currency} type="income" />
        </ChartCard>
      </div>

      <ChartCard title="Category Summary Cards" subtitle="Quick view of all categories">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[...expenseCats.map((c) => ({ ...c, kind: "expense" })), ...incomeCats.map((c) => ({ ...c, kind: "income" }))].map(
            (cat) => (
              <div
                key={`${cat.kind}-${cat.category}`}
                className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm text-slate-500">{cat.category}</p>
                  <Badge variant={cat.kind === "income" ? "success" : "danger"}>
                    {cat.kind}
                  </Badge>
                </div>
                <p className="text-lg font-bold">{formatCurrency(cat.total, currency)}</p>
                <p className="text-xs text-slate-400">{formatPercent(cat.percentage)} of {cat.kind}</p>
              </div>
            ),
          )}
          {!expenseCats.length && !incomeCats.length && (
            <p className="col-span-full py-8 text-center text-sm text-slate-500">
              Add transactions to see category analytics
            </p>
          )}
        </div>
      </ChartCard>
    </motion.div>
  );
}
