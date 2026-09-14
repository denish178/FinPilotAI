/** Maps pre–category-refresh labels to current canonical names. */
export const LEGACY_CATEGORY_MAP = {
  Food: "Food & Dining",
  Bills: "Bills & Utilities",
  Health: "Healthcare",
  Investment: "Investment Returns",
};

export const getCanonicalCategory = (category) => {
  const trimmed = String(category || "").trim();
  if (!trimmed) return trimmed;
  return LEGACY_CATEGORY_MAP[trimmed] ?? trimmed;
};
