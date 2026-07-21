import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Plus, Trash2, PartyPopper } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Loader";
import { goalService } from "../services";
import { formatCurrency, formatDate } from "../utils/format";
import { useSettingsStore } from "../stores/settingsStore";

export default function Goals() {
  const currency = useSettingsStore((s) => s.currency);
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [contribAmount, setContribAmount] = useState("");
  const form = useForm({
    defaultValues: { goalName: "", targetAmount: "", savedAmount: 0, deadline: "" },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalService.list().then((r) => r.data.data.goals),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => goalService.create({ ...payload, targetAmount: Number(payload.targetAmount), savedAmount: Number(payload.savedAmount || 0), deadline: new Date(payload.deadline).toISOString() }),
    onSuccess: () => {
      toast.success("Goal created");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setModalOpen(false);
      form.reset();
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }) => goalService.contribute(id, Number(amount)),
    onSuccess: (res) => {
      const completed = res.data.data.progress?.isCompleted;
      toast.success(completed ? "🎉 Goal achieved!" : "Contribution added");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setContribGoal(null);
      setContribAmount("");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => goalService.delete(id),
    onSuccess: () => {
      toast.success("Goal deleted");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setDeleteId(null);
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Savings Goals</h1>
          <p className="text-sm text-slate-500">Track progress toward your financial goals</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={16} /> Add Goal</Button>
      </div>

      {!data?.length ? (
        <EmptyState title="No goals yet" description="Set a savings goal and track your progress" action={<Button onClick={() => setModalOpen(true)}>Add Goal</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((goal) => {
            const pct = goal.progress?.percentage || 0;
            const isComplete = goal.status === "completed";
            return (
              <motion.div key={goal._id} initial={{ scale: 1 }} animate={isComplete ? { scale: [1, 1.02, 1] } : {}}>
                <Card>
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{goal.goalName}</h3>
                      <p className="text-xs text-slate-500">Due {formatDate(goal.deadline)}</p>
                    </div>
                    <Badge variant={isComplete ? "success" : goal.status === "overdue" ? "danger" : "info"}>
                      {isComplete ? <><PartyPopper size={12} className="mr-1 inline" /> Done</> : goal.status}
                    </Badge>
                  </div>
                  <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
                    <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-200 dark:text-slate-800" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${pct * 2.64} 264`} className="text-primary-500" strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-lg font-bold">{pct}%</span>
                  </div>
                  <p className="mb-1 text-center text-sm">
                    {formatCurrency(goal.savedAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                  </p>
                  <p className="mb-4 text-center text-xs text-slate-500">{formatCurrency(goal.progress?.remaining, currency)} to go</p>
                  <div className="flex gap-2">
                    {!isComplete && (
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setContribGoal(goal)}>Contribute</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(goal._id)}><Trash2 size={14} /></Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Savings Goal">
        <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
          <Input label="Goal Name" {...form.register("goalName", { required: true })} />
          <Input label="Target Amount" type="number" {...form.register("targetAmount", { required: true })} />
          <Input label="Already Saved" type="number" {...form.register("savedAmount")} />
          <Input label="Deadline" type="date" {...form.register("deadline", { required: true })} />
          <Button type="submit" className="w-full" isLoading={saveMutation.isPending}>Create Goal</Button>
        </form>
      </Modal>

      <Modal open={!!contribGoal} onClose={() => setContribGoal(null)} title={`Contribute to ${contribGoal?.goalName}`} size="sm">
        <Input label="Amount" type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} />
        <Button className="mt-4 w-full" onClick={() => contributeMutation.mutate({ id: contribGoal._id, amount: contribAmount })} isLoading={contributeMutation.isPending}>Add Contribution</Button>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteMutation.mutate(deleteId)} message="Delete this goal?" isLoading={deleteMutation.isPending} />
    </div>
  );
}
