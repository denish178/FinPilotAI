export const CHART_COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

export const CHART_THEME = {
  income: "#10b981",
  expense: "#ef4444",
  net: "#3b82f6",
  previous: "#94a3b8",
  daily: "#f59e0b",
  grid: "var(--chart-grid, #e2e8f0)",
};

export const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export const getYearOptions = (count = 5) => {
  const current = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => current - i);
};
