import api from "./api";

export const dashboardService = {
  getOverview: (params) => api.get("/dashboard/overview", { params }),
  getSummary: (params) => api.get("/dashboard/summary", { params }),
  getRecent: (params) => api.get("/dashboard/recent", { params }),
  getExpenseByCategory: (params) => api.get("/dashboard/expense-by-category", { params }),
  getIncomeByCategory: (params) => api.get("/dashboard/income-by-category", { params }),
  getLast6Months: (params) => api.get("/dashboard/last-6-months", { params }),
  getTopSpending: (params) => api.get("/dashboard/top-spending-categories", { params }),
  getDailyExpense: (params) => api.get("/dashboard/daily-expense", { params }),
  getMonthlyComparison: (params) => api.get("/dashboard/monthly-comparison", { params }),
};

export const transactionService = {
  list: (params) => api.get("/transactions", { params }),
  get: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post("/transactions", data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  import: (transactions) => api.post("/transactions/import", { transactions }),
  migrateCategories: () => api.post("/transactions/migrate-categories"),
  listAll: async (params = {}) => {
    const limit = 100;
    let page = 1;
    let all = [];
    let hasNext = true;

    while (hasNext) {
      const response = await api.get("/transactions", {
        params: { ...params, page, limit },
      });
      const payload = response.data.data;
      all = all.concat(payload.transactions || []);
      hasNext = payload.pagination?.hasNextPage;
      page += 1;
    }

    return all;
  },
};

export const budgetService = {
  list: (params) => api.get("/budgets", { params }),
  create: (data) => api.post("/budgets", data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
};

export const goalService = {
  list: (params) => api.get("/goals", { params }),
  upcoming: (params) => api.get("/goals/upcoming", { params }),
  create: (data) => api.post("/goals", data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  contribute: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const notificationService = {
  list: (params) => api.get("/notifications", { params }),
  unread: (params) => api.get("/notifications/unread", { params }),
  unreadCount: () => api.get("/notifications/unread-count"),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/mark-all-read"),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const aiService = {
  getProvider: () => api.get("/ai/provider"),
  getInsights: (params) => api.get("/ai/insights", { params }),
  getTips: (params) => api.get("/ai/tips", { params }),
  getSpendingHabits: (params) => api.get("/ai/spending-habits", { params }),
  getSavings: (params) => api.get("/ai/savings-suggestions", { params }),
  getUnusual: (params) => api.get("/ai/unusual-expenses", { params }),
  getSummary: (params) => api.get("/ai/monthly-summary", { params }),
};

export const recurringService = {
  list: (params) => api.get("/recurring", { params }),
  create: (data) => api.post("/recurring", data),
  update: (id, data) => api.put(`/recurring/${id}`, data),
  delete: (id) => api.delete(`/recurring/${id}`),
  toggle: (id, isActive) => api.post(`/recurring/${id}/toggle`, { isActive }),
  runNow: (id) => api.post(`/recurring/${id}/run-now`),
};
