import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { ROUTES } from "../constants/routes";
import { PageLoader } from "../components/ui/Loader";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to={ROUTES.REGISTER} state={{ from: location }} replace />;
  }

  if (!isAuthenticated) {
    return <PageLoader />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return children;
}

export function HomeRedirect() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (accessToken && !isAuthenticated) {
    return <PageLoader />;
  }

  return (
    <Navigate
      to={accessToken ? ROUTES.DASHBOARD : ROUTES.REGISTER}
      replace
    />
  );
}
