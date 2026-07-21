import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";

export default function ResetPassword() {
  return (
    <AuthLayout
      title="Reset password"
      subtitle="Password reset will be available when backend Phase 13 is complete"
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
        This page is ready for integration. The reset token flow will connect to
        the backend once email/password reset APIs are implemented.
      </div>
      <Link to={ROUTES.LOGIN} className="mt-6 block">
        <Button variant="secondary" className="w-full">
          Back to sign in
        </Button>
      </Link>
    </AuthLayout>
  );
}
