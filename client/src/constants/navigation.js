import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Target,
  Repeat,
  Bot,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { ROUTES } from "./routes";

export const NAV_ITEMS = [
  { labelKey: "nav.dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { labelKey: "nav.transactions", path: ROUTES.TRANSACTIONS, icon: ArrowLeftRight },
  { labelKey: "nav.analytics", path: ROUTES.ANALYTICS, icon: PieChart },
  { labelKey: "nav.budgets", path: ROUTES.BUDGETS, icon: Wallet },
  { labelKey: "nav.goals", path: ROUTES.GOALS, icon: Target },
  { labelKey: "nav.recurring", path: ROUTES.RECURRING, icon: Repeat },
  { labelKey: "nav.ai", path: ROUTES.AI, icon: Bot },
  { labelKey: "nav.notifications", path: ROUTES.NOTIFICATIONS, icon: Bell },
  { labelKey: "nav.profile", path: ROUTES.PROFILE, icon: User },
  { labelKey: "nav.settings", path: ROUTES.SETTINGS, icon: Settings },
];
