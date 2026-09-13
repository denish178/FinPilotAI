import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Button from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Loader";
import { authService } from "../../services/auth.service";
import { ROUTES } from "../../constants/routes";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState(token ? "loading" : "missing");

  useEffect(() => {
    if (!token) return;

    authService
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        toast.success("Email verified");
      })
      .catch((err) => {
        setStatus("error");
        toast.error(err.response?.data?.message || "Verification failed");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <AuthLayout title="Verify email" subtitle="Confirming your address…">
        <PageLoader />
      </AuthLayout>
    );
  }

  if (status === "missing") {
    return (
      <AuthLayout title="Verify email" subtitle="No token provided">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Open the verification link from your registration email.
        </p>
        <Link to={ROUTES.LOGIN} className="mt-6 block">
          <Button variant="secondary" className="w-full">
            Sign in
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout title="Verification failed" subtitle="Link may be expired">
        <Link to={ROUTES.LOGIN}>
          <Button className="w-full">Sign in</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Email verified" subtitle="Your account is confirmed">
      <Link to={ROUTES.DASHBOARD}>
        <Button className="w-full">Continue to dashboard</Button>
      </Link>
    </AuthLayout>
  );
}
