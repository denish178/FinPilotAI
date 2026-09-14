export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "other", label: "Other" },
];

export const EXPENSE_CATEGORIES = [
  "Groceries",
  "Food & Dining",
  "Transport",
  "Fuel",
  "Shopping",
  "Bills & Utilities",
  "Rent",
  "EMI & Loans",
  "Insurance",
  "Healthcare",
  "Education",
  "Entertainment",
  "Subscriptions",
  "Personal Care",
  "Travel",
  "Gifts & Charity",
  "Taxes & Fees",
  "Other",
];

export const INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Business",
  "Investment Returns",
  "Rental Income",
  "Refunds & Cashback",
  "Gift Received",
  "Other",
];

export const SORT_OPTIONS = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "category", label: "Category" },
  { value: "createdAt", label: "Created" },
];

export const CSV_HEADERS = [
  "type",
  "amount",
  "category",
  "description",
  "date",
  "paymentMethod",
];

export const getCategoriesForType = (type) =>
  type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
