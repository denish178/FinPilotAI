import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bot, Sparkles, AlertTriangle, PiggyBank, TrendingUp, Info } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Loader";
import { aiService } from "../services";
import { formatCurrency } from "../utils/format";
import { useSettingsStore } from "../stores/settingsStore";

export default function AIAssistant() {
  const currency = useSettingsStore((s) => s.currency);
  const [activeTab, setActiveTab] = useState("insights");

  const { data: providerInfo } = useQuery({
    queryKey: ["ai-provider"],
    queryFn: () => aiService.getProvider().then((r) => r.data.data),
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => aiService.getInsights().then((r) => r.data.data),
  });

  if (isLoading) return <PageLoader />;

  const tabs = [
    { id: "insights", label: "Overview", icon: Sparkles },
    { id: "habits", label: "Spending Habits", icon: TrendingUp },
    { id: "savings", label: "Savings Tips", icon: PiggyBank },
    { id: "unusual", label: "Unusual Expenses", icon: AlertTriangle },
  ];

  const activeProvider =
    data?.meta?.provider ||
    providerInfo?.activeProvider ||
    data?.spendingHabits?.provider ||
    "rule_based";
  const fallbackNote =
    data?.meta?.fallbackReason || providerInfo?.fallbackReason || null;

  return (
    <div className="space-y-6">
      {fallbackNote && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-100">
          <Info size={18} className="mt-0.5 shrink-0" />
          <p>{fallbackNote}</p>
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary-600 p-3 text-white"><Bot size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-sm text-slate-500">
              Provider: {activeProvider}
              {providerInfo?.openaiConfigured && providerInfo?.configuredProvider === "openai"
                ? " · OpenAI key detected"
                : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} isLoading={isFetching}>Refresh Analysis</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${activeTab === id ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === "insights" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h3 className="mb-3 font-semibold">Monthly Summary</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {data?.monthlySummary?.narrative}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-3xl font-bold text-primary-600">{data?.monthlySummary?.healthScore}</span>
              <span className="text-sm text-slate-500">Financial Health Score</span>
            </div>
          </Card>
          <Card>
            <h3 className="mb-3 font-semibold">Personalized Tips</h3>
            <div className="space-y-3">
              {(data?.tips?.tips || []).map((tip, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <Badge variant={tip.priority === "high" ? "danger" : "info"} className="mb-2">{tip.type}</Badge>
                  <p className="text-sm">{tip.tip}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "habits" && (
        <Card>
          <h3 className="mb-2 font-semibold">Spending Analysis</h3>
          <p className="mb-4 text-sm text-slate-500">Score: {data?.spendingHabits?.score}/100</p>
          <ul className="space-y-2">
            {(data?.spendingHabits?.insights || []).map((insight, i) => (
              <li key={i} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/50">{insight}</li>
            ))}
          </ul>
        </Card>
      )}

      {activeTab === "savings" && (
        <Card>
          <p className="mb-4 text-sm text-primary-600 font-medium">{data?.savingsSuggestions?.message}</p>
          <div className="space-y-3">
            {(data?.savingsSuggestions?.suggestions || []).map((s, i) => (
              <div key={i} className="flex items-start justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div>
                  <p className="font-medium">{s.category}</p>
                  <p className="text-sm text-slate-500">{s.tip}</p>
                </div>
                <Badge variant="success">Save {formatCurrency(s.suggestedReduction, currency)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "unusual" && (
        <Card>
          <p className="mb-4 text-sm">{data?.unusualExpenses?.message}</p>
          {(data?.unusualExpenses?.unusualExpenses || []).length === 0 ? (
            <p className="text-sm text-slate-500">No unusual expenses detected.</p>
          ) : (
            <div className="space-y-3">
              {data.unusualExpenses.unusualExpenses.map((item) => (
                <div key={item.transactionId} className="flex justify-between rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-900/20">
                  <div>
                    <p className="font-medium">{item.description || item.category}</p>
                    <p className="text-xs text-slate-500">{item.reason}</p>
                  </div>
                  <p className="font-bold text-red-600">{formatCurrency(item.amount, currency)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
