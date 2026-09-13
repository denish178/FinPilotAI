/** Invalidate React Query caches tied to money movement and summaries. */
export const invalidateFinanceQueries = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["transactions"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] });
  queryClient.invalidateQueries({ queryKey: ["analytics"] });
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
  queryClient.invalidateQueries({ queryKey: ["recurring"] });
  queryClient.invalidateQueries({ queryKey: ["goals"] });
  queryClient.invalidateQueries({ queryKey: ["goals-upcoming"] });
  queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
};
