import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus, Trash2, Play, Pause, Zap, Pencil } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Loader";
import { recurringService } from "../services";
import { formatCurrency, formatDate } from "../utils/format";
import { invalidateFinanceQueries } from "../utils/queryCache";
import { useSettingsStore } from "../stores/settingsStore";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
} from "../constants/transactions";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const defaultValues = {
  type: "expense",
  amount: "",
  category: "",
  description: "",
  paymentMethod: "upi",
  frequency: "monthly",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
};

const toFormValues = (item) => ({
  type: item.type,
  amount: String(item.amount ?? ""),
  category: item.category ?? "",
  description: item.description ?? "",
  paymentMethod: item.paymentMethod || "upi",
  frequency: item.frequency || "monthly",
  startDate: item.startDate
    ? new Date(item.startDate).toISOString().slice(0, 10)
    : defaultValues.startDate,
  endDate: item.endDate
    ? new Date(item.endDate).toISOString().slice(0, 10)
    : "",
});

const buildPayload = (values, { recalculateNextRun = false, forUpdate = false } = {}) => {
  const body = {
    type: values.type,
    amount: Number(values.amount),
    category: values.category,
    description: values.description || "",
    paymentMethod: values.paymentMethod,
    frequency: values.frequency,
    startDate: new Date(values.startDate).toISOString(),
  };

  if (values.endDate) {
    body.endDate = new Date(values.endDate).toISOString();
  } else if (forUpdate) {
    body.endDate = null;
  }

  if (recalculateNextRun) {
    body.recalculateNextRun = true;
  }

  return body;
};

export default function Recurring() {
  const currency = useSettingsStore((s) => s.currency);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const form = useForm({ defaultValues });
  const watchedType = form.watch("type");

  const { data, isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: () =>
      recurringService.list({ limit: 50 }).then((r) => r.data.data.recurringTransactions),
  });

  const saveMutation = useMutation({
    mutationFn: (values) => {
      const scheduleChanged =
        editItem &&
        (values.frequency !== editItem.frequency ||
          toFormValues(editItem).startDate !== values.startDate ||
          toFormValues(editItem).endDate !== (values.endDate || ""));

      const body = buildPayload(values, {
        recalculateNextRun: Boolean(scheduleChanged),
        forUpdate: Boolean(editItem),
      });

      return editItem
        ? recurringService.update(editItem._id, body)
        : recurringService.create(body);
    },
    onSuccess: () => {
      toast.success(editItem ? "Recurring schedule updated" : "Recurring schedule created");
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setModalOpen(false);
      setEditItem(null);
      form.reset(defaultValues);
    },
    onError: (err) =>
      toast.error(
        err.response?.data?.message ||
          (editItem ? "Failed to update" : "Failed to create"),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => recurringService.delete(id),
    onSuccess: () => {
      toast.success("Recurring schedule deleted");
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => recurringService.toggle(id, isActive),
    onSuccess: (res) => {
      toast.success(res.data.message || "Status updated");
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to update"),
  });

  const runNowMutation = useMutation({
    mutationFn: (id) => recurringService.runNow(id),
    onSuccess: (res) => {
      toast.success(res.data.message || "Processed");
      invalidateFinanceQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to run"),
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring</h1>
          <p className="text-sm text-slate-500">
            Automate repeating income and expenses (cron runs daily UTC)
          </p>
        </div>
        <Button
          onClick={() => {
            setEditItem(null);
            form.reset(defaultValues);
            setModalOpen(true);
          }}
        >
          <Plus size={16} /> Add schedule
        </Button>
      </div>

      {!data?.length ? (
        <EmptyState
          title="No recurring schedules"
          description="Add rent, salary, subscriptions, or other repeating transactions"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Add schedule
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {data.map((item) => (
            <Card key={item._id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-semibold">
                    {item.description || item.category}
                  </span>
                  <Badge variant={item.type === "income" ? "success" : "warning"}>
                    {item.type}
                  </Badge>
                  <Badge variant={item.isActive ? "info" : "default"}>
                    {item.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {formatCurrency(item.amount, currency)} · {item.category} ·{" "}
                  {item.frequency}
                </p>
                <p className="text-xs text-slate-500">
                  Next run {formatDate(item.nextRunDate)}
                  {item.lastRunDate ? ` · Last ${formatDate(item.lastRunDate)}` : ""}
                  {item.totalRuns ? ` · ${item.totalRuns} run(s)` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditItem(item);
                    form.reset(toFormValues(item));
                    setModalOpen(true);
                  }}
                >
                  <Pencil size={14} /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={runNowMutation.isPending}
                  onClick={() => runNowMutation.mutate(item._id)}
                >
                  <Zap size={14} /> Run now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  isLoading={toggleMutation.isPending}
                  onClick={() =>
                    toggleMutation.mutate({ id: item._id, isActive: !item.isActive })
                  }
                >
                  {item.isActive ? <Pause size={14} /> : <Play size={14} />}
                  {item.isActive ? "Pause" : "Resume"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(item._id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
          form.reset(defaultValues);
        }}
        title={editItem ? "Edit recurring schedule" : "New recurring schedule"}
      >
        <form
          onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <select
                {...form.register("type")}
                onChange={(e) => {
                  form.setValue("type", e.target.value);
                  form.setValue("category", "");
                }}
                className={selectClass}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <Input label="Amount" type="number" step="0.01" {...form.register("amount", { required: true })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select {...form.register("category", { required: true })} className={selectClass}>
              <option value="">Select category</option>
              {(watchedType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ),
              )}
            </select>
          </div>
          <Input label="Description" {...form.register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Frequency</label>
              <select {...form.register("frequency")} className={selectClass}>
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Payment</label>
              <select {...form.register("paymentMethod")} className={selectClass}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date" type="date" {...form.register("startDate", { required: true })} />
            <Input label="End date (optional)" type="date" {...form.register("endDate")} />
          </div>
          <Button type="submit" className="w-full" isLoading={saveMutation.isPending}>
            {editItem ? "Save changes" : "Create schedule"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        message="Delete this recurring schedule?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
