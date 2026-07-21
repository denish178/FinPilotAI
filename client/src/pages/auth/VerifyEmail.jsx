import { Link } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/ui/Button";
import { ROUTES } from "../../constants/routes";

export default function VerifyEmail() {
  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Email verification will be available in a future update"
    >
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-200">
        Check your inbox for a verification link. This UI is ready for backend
        integration when email verification is implemented.
      </div>
      <Link to={ROUTES.DASHBOARD} className="mt-6 block">
        <Button className="w-full">Continue to dashboard</Button>
      </Link>
    </AuthLayout>
  );
}
