import { Menu, Moon, Sun, LogOut, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useThemeStore } from "../stores/themeStore";
import { useSettingsStore } from "../stores/settingsStore";
import { notificationService } from "../services";
import { authService } from "../services/auth.service";
import { ROUTES } from "../constants/routes";
import Button from "../components/ui/Button";

export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { resolveTheme, setTheme } = useThemeStore();
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);
  const markSettingsSaved = useSettingsStore((s) => s.markSaved);

  const isDark = resolveTheme() === "dark";

  const handleThemeToggle = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    setThemePreference(next);
    authService.updateSettings({ theme: next }).then(() => {
      markSettingsSaved();
    }).catch(() => {
      /* keep local theme; user can retry from Settings */
    });
  };

  const { data: unreadData } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationService.unreadCount().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.unreadCount || 0;

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-sm text-slate-500">Welcome back</p>
          <p className="font-semibold">{user?.name || "User"}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          className="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={handleThemeToggle}
          className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
