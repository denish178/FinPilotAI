export const CURRENCIES = [
  { code: "INR", label: "INR — Indian Rupee", symbol: "₹" },
  { code: "USD", label: "USD — US Dollar", symbol: "$" },
  { code: "EUR", label: "EUR — Euro", symbol: "€" },
  { code: "GBP", label: "GBP — British Pound", symbol: "£" },
];

export const LANGUAGES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
];

export const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

export const NOTIFICATION_OPTIONS = [
  { key: "emailNotifications", labelKey: "settings.notifications.email" },
  { key: "pushNotifications", labelKey: "settings.notifications.push" },
  { key: "budgetAlerts", labelKey: "settings.notifications.budget" },
  { key: "goalAlerts", labelKey: "settings.notifications.goal" },
  { key: "largeExpenseAlerts", labelKey: "settings.notifications.largeExpense" },
];

export const DEFAULT_SETTINGS = {
  currency: "INR",
  language: "en",
  theme: "light",
  emailNotifications: true,
  pushNotifications: true,
  budgetAlerts: true,
  goalAlerts: true,
  largeExpenseAlerts: true,
};
