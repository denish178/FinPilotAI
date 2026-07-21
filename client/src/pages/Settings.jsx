import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Monitor, Moon, Sun } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { PageLoader } from "../components/ui/Loader";
import { useThemeStore } from "../stores/themeStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useAuthStore } from "../stores/authStore";
import { useTranslation } from "../hooks/useTranslation";
import {
  CURRENCIES,
  LANGUAGES,
  THEMES,
  NOTIFICATION_OPTIONS,
} from "../constants/settings";

const selectClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

export default function Settings() {
  const { t } = useTranslation();
  const { setTheme } = useThemeStore();
  const { saveSettings, loadSettings, isLoading: authLoading } = useAuthStore();
  const settings = useSettingsStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    loadSettings().finally(() => setBootstrapped(true));
  }, [loadSettings]);

  const handleThemeChange = (theme) => {
    settings.setThemePreference(theme);
    setTheme(theme);
  };

  const handleSave = async () => {
    try {
      await saveSettings();
      toast.success(t("settings.saved"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("settings.saveFailed"));
    }
  };

  if (!bootstrapped) return <PageLoader />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-slate-500">{t("settings.subtitle")}</p>
        </div>
        <Button onClick={handleSave} isLoading={authLoading} disabled={!settings.isDirty}>
          {t("settings.save")}
        </Button>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold">{t("settings.appearance")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map(({ value }) => {
            const Icon = themeIcons[value];
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleThemeChange(value)}
                className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition ${
                  settings.theme === value
                    ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                    : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                }`}
              >
                <Icon size={20} />
                {t(`settings.theme.${value}`)}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">{t("settings.currency")}</h3>
        <select
          value={settings.currency}
          onChange={(e) => settings.setCurrency(e.target.value)}
          className={selectClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">{t("settings.language")}</h3>
        <select
          value={settings.language}
          onChange={(e) => settings.setLanguage(e.target.value)}
          className={selectClass}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label} ({l.nativeLabel})
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-slate-500">{t("settings.languageHint")}</p>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">{t("settings.notifications")}</h3>
        <div className="space-y-3">
          {NOTIFICATION_OPTIONS.map(({ key, labelKey }) => (
            <label key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm">{t(labelKey)}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => settings.updatePreferences({ [key]: e.target.checked })}
                className="h-4 w-4 rounded accent-primary-600"
              />
            </label>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={authLoading} disabled={!settings.isDirty}>
          {t("settings.save")}
        </Button>
      </div>
    </div>
  );
}
