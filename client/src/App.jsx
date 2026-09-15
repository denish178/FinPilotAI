import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";
import AppRoutes from "./routes/AppRoutes";
import { useAuthStore } from "./stores/authStore";
import { useThemeStore } from "./stores/themeStore";
import { useSettingsStore } from "./stores/settingsStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
  },
});

function AppInitializer({ children }) {
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const initTheme = useThemeStore((s) => s.initTheme);
  const settingsTheme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    initTheme();
    if (accessToken) {
      fetchUser();
    }
  }, [accessToken, fetchUser, initTheme]);

  useEffect(() => {
    useThemeStore.getState().setTheme(settingsTheme);
  }, [settingsTheme]);

  return children;
}

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export default function App() {
  const content = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppInitializer>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "dark:bg-slate-800 dark:text-white",
            }}
          />
        </AppInitializer>
      </BrowserRouter>
    </QueryClientProvider>
  );

  if (!googleClientId) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
  );
}
