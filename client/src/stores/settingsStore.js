import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SETTINGS } from "../constants/settings";

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      isLoading: false,
      isDirty: false,

      hydrateFromServer: (settings) => {
        set({
          currency: settings.currency ?? DEFAULT_SETTINGS.currency,
          language: settings.language ?? DEFAULT_SETTINGS.language,
          theme: settings.theme ?? DEFAULT_SETTINGS.theme,
          emailNotifications:
            settings.emailNotifications ?? DEFAULT_SETTINGS.emailNotifications,
          pushNotifications:
            settings.pushNotifications ?? DEFAULT_SETTINGS.pushNotifications,
          budgetAlerts: settings.budgetAlerts ?? DEFAULT_SETTINGS.budgetAlerts,
          goalAlerts: settings.goalAlerts ?? DEFAULT_SETTINGS.goalAlerts,
          largeExpenseAlerts:
            settings.largeExpenseAlerts ?? DEFAULT_SETTINGS.largeExpenseAlerts,
          isDirty: false,
        });
      },

      setCurrency: (currency) => set({ currency, isDirty: true }),
      setLanguage: (language) => set({ language, isDirty: true }),
      setThemePreference: (theme) => set({ theme, isDirty: true }),

      updatePreferences: (prefs) =>
        set({
          ...prefs,
          isDirty: true,
        }),

      getPayload: () => {
        const state = get();
        return {
          currency: state.currency,
          language: state.language,
          theme: state.theme,
          emailNotifications: state.emailNotifications,
          pushNotifications: state.pushNotifications,
          budgetAlerts: state.budgetAlerts,
          goalAlerts: state.goalAlerts,
          largeExpenseAlerts: state.largeExpenseAlerts,
        };
      },

      markSaved: () => set({ isDirty: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "finpilot-settings",
      partialize: (state) => ({
        currency: state.currency,
        language: state.language,
        theme: state.theme,
        emailNotifications: state.emailNotifications,
        pushNotifications: state.pushNotifications,
        budgetAlerts: state.budgetAlerts,
        goalAlerts: state.goalAlerts,
        largeExpenseAlerts: state.largeExpenseAlerts,
      }),
    },
  ),
);
