import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Loader";
import { budgetService } from "../services";
import { formatCurrency } from "../utils/format";
import { useSettingsStore } from "../stores/settingsStore";
import { EXPENSE_CATEGORIES } from "../constants/transactions";
import { cn } from "../utils/cn";

const now = new Date();
const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

export default function Budgets() {
  const currency = useSettingsStore((s) => s.currency);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const form = useForm({
    defaultValues: { category: "", monthlyLimit: "", month: now.getUTCMonth() + 1, year: now.getUTCFullYear() },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: () =>
      budgetService
        .list({ month: now.getUTCMonth() + 1, year: now.getUTCFullYear() })
        .then((r) => r.data.data.budgets),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editBudget ? budgetService.update(editBudget._id, payload) : budgetService.create(payload),
    onSuccess: () => {
      toast.success(editBudget ? "Budget updated" : "Budget created");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setModalOpen(false);
      setEditBudget(null);
      form.reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => budgetService.delete(id),
    onSuccess: () => {
      toast.success("Budget deleted");
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setDeleteId(null);
    },
  });

  const getBarColor = (usage) => {
    if (usage?.status === "exceeded") return "bg-red-500";
    if (usage?.status === "warning") return "bg-amber-500";
    return "bg-primary-500";
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budgets</h1>
          <p className="text-sm text-slate-500">Track spending against your limits</p>
        </div>
        <Button onClick={() => { setEditBudget(null); form.reset(); setModalOpen(true); }}>
          <Plus size={16} /> Create Budget
        </Button>
      </div>

      {!data?.length ? (
        <EmptyState title="No budgets" description="Create a budget to track category spending" action={
          <Button onClick={() => setModalOpen(true)}>Create Budget</Button>
        } />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((budget) => {
            const pct = budget.usage?.percentage || 0;
            return (
              <Card key={budget._id}>
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{budget.category}</h3>
                    <p className="text-sm text-slate-500">
                      {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.monthlyLimit, currency)}
                    </p>
                  </div>
                  <Badge variant={budget.usage?.status === "exceeded" ? "danger" : budget.usage?.status === "warning" ? "warning" : "success"}>
                    {budget.usage?.status || "ok"}
                  </Badge>
                </div>
                <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className={cn("h-full rounded-full transition-all", getBarColor(budget.usage))} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="mb-4 text-xs text-slate-500">{pct.toFixed(0)}% used · {formatCurrency(budget.remaining, currency)} remaining</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditBudget(budget); form.reset({ category: budget.category, monthlyLimit: budget.monthlyLimit, month: budget.month, year: budget.year }); setModalOpen(true); }}>
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteId(budget._id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editBudget ? "Edit Budget" : "Create Budget"}>
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate({ ...d, monthlyLimit: Number(d.monthlyLimit) }))} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              {...form.register("category", { required: "Category is required" })}
              className={selectClass}
            >
              <option value="">Select category</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {form.formState.errors.category && (
              <p className="mt-1 text-xs text-red-500">Category is required</p>
            )}
          </div>
          <Input label="Monthly Limit" type="number" min="1" {...form.register("monthlyLimit", { required: true })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={saveMutation.isPending}>Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} message="Delete this budget?" isLoading={deleteMutation.isPending} />
    </div>
  );
}
