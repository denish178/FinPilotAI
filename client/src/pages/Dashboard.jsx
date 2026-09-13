import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Plus,
  Bot,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "../components/ui/Card";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Loader";
import { dashboardService, goalService } from "../services";
import { formatCurrency, formatDate } from "../utils/format";
import { ROUTES } from "../constants/routes";
import { useSettingsStore } from "../stores/settingsStore";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const navigate = useNavigate();
  const currency = useSettingsStore((s) => s.currency);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: () => dashboardService.getOverview().then((r) => r.data.data),
  });

  const { data: goals } = useQuery({
    queryKey: ["goals-upcoming"],
    queryFn: () => goalService.upcoming({ limit: 3 }).then((r) => r.data.data.goals),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const expenseData = data?.expenseByCategory || [];
  const trendData = data?.last6Months || [];
  const recent = data?.recentTransactions || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-500">Your financial overview at a glance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(ROUTES.TRANSACTIONS)}>
            <Plus size={16} /> Add Transaction
          </Button>
          <Button onClick={() => navigate(ROUTES.AI)}>
            <Bot size={16} /> AI Insights
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Balance"
          value={formatCurrency(summary.currentBalance, currency)}
          icon={Wallet}
          subtitle="Lifetime balance"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(summary.monthlyIncome, currency)}
          icon={TrendingUp}
        />
        <StatCard
          title="Monthly Expense"
          value={formatCurrency(summary.monthlyExpense, currency)}
          icon={TrendingDown}
          trend={data?.monthlyComparison?.change?.expensePercent}
        />
        <StatCard
          title="Monthly Savings"
          value={formatCurrency(summary.monthlyBalance, currency)}
          icon={PiggyBank}
          subtitle={`${summary.monthlyIncome ? Math.round((summary.monthlyBalance / summary.monthlyIncome) * 100) : 0}% savings rate`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="mb-4 font-semibold">Monthly Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b98133" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef444433" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="mb-4 font-semibold">Expense by Category</h3>
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="total"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {expenseData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No expense data yet</p>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Recent Transactions</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.TRANSACTIONS)}>
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No transactions yet</p>
            ) : (
              recent.map((tx) => (
                <div
                  key={tx._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 dark:border-slate-800"
                >
                  <div>
                    <p className="font-medium">{tx.description || tx.category}</p>
                    <p className="text-xs text-slate-500">
                      {tx.category} · {formatDate(tx.date)}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${tx.type === "income" ? "text-primary-600" : "text-red-500"}`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount, currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Bot size={18} className="text-primary-600" />
              <h3 className="font-semibold">AI Insights</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {summary.monthlyBalance >= 0
                ? `You're saving ${formatCurrency(summary.monthlyBalance, currency)} this month. Keep it up!`
                : `You're overspending by ${formatCurrency(Math.abs(summary.monthlyBalance), currency)}. Check AI tips.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => navigate(ROUTES.AI)}
            >
              View AI Analysis
            </Button>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Target size={18} className="text-primary-600" />
              <h3 className="font-semibold">Goal Progress</h3>
            </div>
            {!goals?.length ? (
              <p className="text-sm text-slate-500">No active goals</p>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => (
                  <div key={goal._id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{goal.goalName}</span>
                      <span>{goal.progress?.percentage || 0}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${goal.progress?.percentage || 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold">Top Spending</h3>
            {(data?.topSpendingCategories || []).slice(0, 3).map((cat) => (
              <div key={cat.category} className="mb-2 flex justify-between text-sm">
                <span>{cat.category}</span>
                <Badge variant={cat.percentage > 40 ? "warning" : "default"}>
                  {formatCurrency(cat.total, currency)}
                </Badge>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
