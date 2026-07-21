import { NavLink } from "react-router-dom";
import { Plane } from "lucide-react";
import { NAV_ITEMS } from "../constants/navigation";
import { useTranslation } from "../hooks/useTranslation";
import { cn } from "../utils/cn";

export default function Sidebar({ onNavigate }) {
  const { t } = useTranslation();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
        <div className="rounded-xl bg-primary-600 p-2 text-white">
          <Plane size={20} />
        </div>
        <div>
          <p className="font-bold">FinPilot AI</p>
          <p className="text-xs text-slate-500">Personal Finance</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ labelKey, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )
            }
          >
            <Icon size={18} />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
