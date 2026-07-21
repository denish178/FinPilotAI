import { Routes, Route, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute, { PublicRoute } from "./ProtectedRoute";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail";
import Dashboard from "../pages/Dashboard";
import Transactions from "../pages/Transactions";
import Analytics from "../pages/Analytics";
import Budgets from "../pages/Budgets";
import Goals from "../pages/Goals";
import AIAssistant from "../pages/AIAssistant";
import Notifications from "../pages/Notifications";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />

      <Route path={ROUTES.LOGIN} element={<PublicRoute><Login /></PublicRoute>} />
      <Route path={ROUTES.REGISTER} element={<PublicRoute><Register /></PublicRoute>} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path={ROUTES.RESET_PASSWORD} element={<PublicRoute><ResetPassword /></PublicRoute>} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
        <Route path={ROUTES.TRANSACTIONS} element={<Transactions />} />
        <Route path={ROUTES.ANALYTICS} element={<Analytics />} />
        <Route path={ROUTES.BUDGETS} element={<Budgets />} />
        <Route path={ROUTES.GOALS} element={<Goals />} />
        <Route path={ROUTES.AI} element={<AIAssistant />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />
        <Route path={ROUTES.PROFILE} element={<Profile />} />
        <Route path={ROUTES.SETTINGS} element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
