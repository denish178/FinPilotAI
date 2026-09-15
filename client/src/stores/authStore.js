import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services/auth.service";
import { useSettingsStore } from "./settingsStore";
import { useThemeStore } from "./themeStore";

const applyServerSettings = (settings) => {
  if (!settings) return;
  useSettingsStore.getState().hydrateFromServer(settings);
  useThemeStore.getState().setTheme(settings.theme ?? "light");
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: !!token }),

      setSession: ({ user, accessToken, refreshToken }) =>
        set({
          user: user ?? null,
          accessToken: accessToken ?? null,
          refreshToken: refreshToken ?? null,
          isAuthenticated: Boolean(accessToken),
        }),

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.login(credentials);
          get().setSession({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });
          set({ isLoading: false });
          await get().loadSettings();
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loginWithGoogle: async (credential) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.googleLogin(credential);
          get().setSession({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });
          set({ isLoading: false });
          await get().loadSettings();
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          await authService.register(payload);
          const { data } = await authService.login({
            email: payload.email,
            password: payload.password,
          });
          get().setSession({
            user: data.data.user,
            accessToken: data.data.accessToken,
            refreshToken: data.data.refreshToken,
          });
          set({ isLoading: false });
          await get().loadSettings();
          return data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      loadSettings: async () => {
        try {
          const { data } = await authService.getSettings();
          applyServerSettings(data.data);
          return data.data;
        } catch {
          return null;
        }
      },

      saveSettings: async () => {
        set({ isLoading: true });
        try {
          const payload = useSettingsStore.getState().getPayload();
          const { data } = await authService.updateSettings(payload);
          applyServerSettings(data.data);
          useSettingsStore.getState().markSaved();
          set((state) => ({
            user: state.user ? { ...state.user, currency: data.data.currency } : state.user,
            isLoading: false,
          }));
          return data.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      fetchUser: async () => {
        const token = get().accessToken;
        if (!token) return null;
        try {
          const { data } = await authService.getMe();
          set({ user: data.data, isAuthenticated: true });
          await get().loadSettings();
          return data.data;
        } catch {
          get().logout();
          return null;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // ignore
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (user) => set({ user }),

      updateProfile: async (payload) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.updateProfile(payload);
          set({ user: data.data, isLoading: false });
          if (payload.currency) {
            useSettingsStore.getState().hydrateFromServer({
              ...useSettingsStore.getState().getPayload(),
              currency: data.data.currency,
            });
          }
          return data.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      changePassword: async (payload) => {
        set({ isLoading: true });
        try {
          await authService.changePassword(payload);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      uploadAvatar: async (file) => {
        set({ isLoading: true });
        try {
          const { data } = await authService.uploadAvatar(file);
          set({ user: data.data, isLoading: false });
          return data.data;
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      deleteAccount: async (password) => {
        set({ isLoading: true });
        try {
          await authService.deleteAccount(password);
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
    }),
    {
      name: "finpilot-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
