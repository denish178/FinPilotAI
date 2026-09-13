import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Loader";
import TransactionFilters from "../components/transactions/TransactionFilters";
import { transactionService } from "../services";
import { formatCurrency, formatDate } from "../utils/format";
import { downloadCsv, parseTransactionsCsv, transactionsToCsv } from "../utils/csv";
import { invalidateFinanceQueries } from "../utils/queryCache";
import {
  getCategoriesForType,
  PAYMENT_METHODS,
} from "../constants/transactions";
import { useSettingsStore } from "../stores/settingsStore";

const txSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  date: z.string().min(1),
  paymentMethod: z.string().optional(),
});

const defaultValues = {
  type: "expense",
  amount: "",
  category: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: "upi",
};

const defaultFilters = {
  search: "",
  type: "",
  category: "",
  startDate: "",
  endDate: "",
  minAmount: "",
  maxAmount: "",
  paymentMethod: "",
  sortBy: "date",
  sortOrder: "desc",
};

const buildQueryParams = (filters, page) => {
  const params = {
    page,
    limit: 10,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  };

  if (filters.search.trim()) params.search = filters.search.trim();
  if (filters.type) params.type = filters.type;
  if (filters.category) params.category = filters.category;
  if (filters.startDate) params.startDate = new Date(filters.startDate).toISOString();
  if (filters.endDate) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
    params.endDate = end.toISOString();
  }
  if (filters.minAmount) params.minAmount = Number(filters.minAmount);
  if (filters.maxAmount) params.maxAmount = Number(filters.maxAmount);
  if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;

  return params;
};

const handleBudgetAlert = (response) => {
  const alert = response?.data?.data?.budgetAlert;
  if (!alert) return;

  if (alert.status === "exceeded") {
    toast.error("Budget exceeded for this category");
  } else if (alert.status === "warning") {
    toast("Budget warning: over 80% used", { icon: "⚠️" });
  }
};

export default function Transactions() {
  const currency = useSettingsStore((s) => s.currency);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const queryParams = buildQueryParams(filters, page);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["transactions", queryParams],
    queryFn: () =>
      transactionService.list(queryParams).then((r) => r.data.data),
  });

  const form = useForm({ resolver: zodResolver(txSchema), defaultValues });
  const watchedType = form.watch("type");
  const categoryOptions = getCategoriesForType(watchedType);

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editTx
        ? transactionService.update(editTx._id, payload)
        : transactionService.create(payload),
    onSuccess: (response) => {
      handleBudgetAlert(response);
      toast.success(editTx ? "Transaction updated" : "Transaction created");
      invalidateFinanceQueries(queryClient);
      setModalOpen(false);
      setEditTx(null);
      form.reset(defaultValues);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => transactionService.delete(id),
    onSuccess: () => {
      toast.success("Transaction deleted");
      invalidateFinanceQueries(queryClient);
      setDeleteId(null);
      setSelected([]);
    },
  });

  const importMutation = useMutation({
    mutationFn: (transactions) => transactionService.import(transactions),
    onSuccess: (response) => {
      const result = response.data.data;
      if (result.createdCount > 0) {
        toast.success(`${result.createdCount} transaction(s) imported`);
      }
      if (result.failedCount > 0) {
        toast.error(`${result.failedCount} row(s) failed to import`);
      }
      if (result.budgetAlerts?.length) {
        toast("Some imported expenses triggered budget alerts", { icon: "⚠️" });
      }
      invalidateFinanceQueries(queryClient);
      setIsImporting(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Import failed");
      setIsImporting(false);
    },
  });

  const updateFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
    setShowAdvanced(false);
  };

  const openCreate = () => {
    setEditTx(null);
    form.reset(defaultValues);
    setModalOpen(true);
  };

  const openEdit = (tx) => {
    setEditTx(tx);
    form.reset({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description || "",
      date: new Date(tx.date).toISOString().slice(0, 10),
      paymentMethod: tx.paymentMethod || "upi",
    });
    setModalOpen(true);
  };

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const exportParams = buildQueryParams(filters, 1);
      delete exportParams.page;
      delete exportParams.limit;

      const rows = await transactionService.listAll(exportParams);
      if (!rows.length) {
        toast.error("No transactions to export");
        return;
      }

      const csv = transactionsToCsv(
        rows.map((row) => ({
          type: row.type,
          amount: row.amount,
          category: row.category,
          description: row.description || "",
          date: new Date(row.date).toISOString().slice(0, 10),
          paymentMethod: row.paymentMethod || "upi",
        })),
      );

      downloadCsv(`transactions-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      toast.success(`Exported ${rows.length} transaction(s)`);
    } catch {
      toast.error("Failed to export transactions");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }

    setIsImporting(true);
    try {
      const content = await file.text();
      const { transactions, errors } = parseTransactionsCsv(content);

      if (errors.length) {
        toast(`Skipped ${errors.length} invalid row(s)`, { icon: "⚠️" });
      }

      importMutation.mutate(transactions);
    } catch (error) {
      toast.error(error.message || "Invalid CSV file");
      setIsImporting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const bulkDelete = async () => {
    try {
      await Promise.all(selected.map((id) => transactionService.delete(id)));
      toast.success(`${selected.length} transaction(s) deleted`);
      invalidateFinanceQueries(queryClient);
      setSelected([]);
    } catch {
      toast.error("Failed to delete selected transactions");
    }
  };

  if (isLoading) return <PageLoader />;

  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-slate-500">
            Create, filter, search, and manage your transactions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selected.length > 0 && (
            <Button variant="danger" size="sm" onClick={bulkDelete}>
              Delete ({selected.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            isLoading={isImporting}
          >
            <Upload size={16} /> Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} isLoading={isExporting}>
            <Download size={16} /> Export CSV
          </Button>
          <Button onClick={openCreate}>
            <Plus size={16} /> Add Transaction
          </Button>
        </div>
      </div>

      <Card>
        <TransactionFilters
          filters={filters}
          onChange={updateFilters}
          onReset={resetFilters}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
        />

        {isFetching && (
          <p className="mt-3 text-xs text-slate-400">Updating results...</p>
        )}

        {!data?.transactions?.length ? (
          <div className="mt-6">
            <EmptyState
              title="No transactions found"
              description="Try adjusting filters or add your first transaction"
              action={<Button onClick={openCreate}>Add Transaction</Button>}
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500 dark:border-slate-800">
                  <th className="pb-3 pr-4">
                    <input
                      type="checkbox"
                      checked={selected.length === data.transactions.length}
                      onChange={(e) =>
                        setSelected(
                          e.target.checked ? data.transactions.map((t) => t._id) : [],
                        )
                      }
                    />
                  </th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Payment</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4 text-right">Amount</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx._id} className="border-b border-slate-100 dark:border-slate-800/50">
                    <td className="py-3 pr-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(tx._id)}
                        onChange={() => toggleSelect(tx._id)}
                      />
                    </td>
                    <td className="py-3 pr-4">{formatDate(tx.date)}</td>
                    <td className="py-3 pr-4">{tx.description || "-"}</td>
                    <td className="py-3 pr-4">{tx.category}</td>
                    <td className="py-3 pr-4 capitalize">
                      {(tx.paymentMethod || "upi").replace(/_/g, " ")}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={tx.type === "income" ? "success" : "danger"}>
                        {tx.type}
                      </Badge>
                    </td>
                    <td
                      className={`py-3 pr-4 text-right font-medium ${
                        tx.type === "income" ? "text-primary-600" : "text-red-500"
                      }`}
                    >
                      {formatCurrency(tx.amount, currency)}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEdit(tx)}
                          className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                          aria-label="Edit transaction"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteId(tx._id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTx ? "Edit Transaction" : "Add Transaction"}
      >
        <form
          onSubmit={form.handleSubmit((values) =>
            saveMutation.mutate({
              ...values,
              date: new Date(values.date).toISOString(),
            }),
          )}
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <Input
              label="Amount"
              type="number"
              step="0.01"
              error={form.formState.errors.amount?.message}
              {...form.register("amount")}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Category</label>
            <select
              {...form.register("category")}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Select category</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {form.formState.errors.category?.message && (
              <p className="mt-1 text-xs text-red-500">
                {form.formState.errors.category.message}
              </p>
            )}
          </div>

          <Input label="Description" {...form.register("description")} />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              error={form.formState.errors.date?.message}
              {...form.register("date")}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Payment method</label>
              <select
                {...form.register("paymentMethod")}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        message="This transaction will be soft-deleted."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
