import { useSettingsStore } from "../stores/settingsStore";
import { translate } from "../locales";

export function useTranslation() {
  const language = useSettingsStore((s) => s.language);

  const t = (key, fallback) => translate(language, key, fallback);

  return { t, language };
}
