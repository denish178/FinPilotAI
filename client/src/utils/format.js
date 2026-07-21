export const formatCurrency = (amount, currency = "INR") => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
