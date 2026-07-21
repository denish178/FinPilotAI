import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Bell, Trash2, CheckCheck } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Loader";
import { notificationService } from "../services";
import { formatDate } from "../utils/format";

const typeVariant = {
  budget_exceeded: "danger",
  goal_achieved: "success",
  large_expense: "warning",
  recurring_payment: "info",
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationService.list().then((r) => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      toast.success("All marked as read");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notificationService.delete(id),
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (isLoading) return <PageLoader />;

  const notifications = data?.notifications || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">{data?.unreadCount || 0} unread</p>
        </div>
        {notifications.some((n) => !n.isRead) && (
          <Button variant="outline" size="sm" onClick={() => markAllMutation.mutate()} isLoading={markAllMutation.isPending}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      {!notifications.length ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up!" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n._id} className={!n.isRead ? "border-primary-200 dark:border-primary-800" : ""}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant={typeVariant[n.type] || "default"}>{n.type.replace(/_/g, " ")}</Badge>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-primary-500" />}
                  </div>
                  <h3 className="font-semibold">{n.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  {!n.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => markReadMutation.mutate(n._id)}>Read</Button>
                  )}
                  <button onClick={() => deleteMutation.mutate(n._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
