import { create } from "zustand";
import { persist } from "zustand/middleware";

const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (preference) => {
  const resolved = preference === "system" ? getSystemTheme() : preference;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: "light",

      resolveTheme: () => {
        const { theme } = get();
        return applyTheme(theme);
      },

      toggleTheme: () => {
        const current = get().resolveTheme();
        const next = current === "light" ? "dark" : "light";
        set({ theme: next });
        applyTheme(next);
      },

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      initTheme: () => {
        applyTheme(get().theme);
      },
    }),
    { name: "finpilot-theme" },
  ),
);

if (typeof window !== "undefined") {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      const { theme } = useThemeStore.getState();
      if (theme === "system") {
        applyTheme("system");
      }
    });
}
