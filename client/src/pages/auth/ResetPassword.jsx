import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { authService } from "../../services/auth.service";
import { ROUTES } from "../../constants/routes";

const schema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Missing reset token. Open the link from your email.");
      return;
    }
    try {
      await authService.resetPassword({ token, password: data.password });
      toast.success("Password updated. You can sign in now.");
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Reset failed");
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset password" subtitle="Invalid or missing link">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-200">
          Request a new reset link from the forgot password page.
        </div>
        <Link to={ROUTES.FORGOT_PASSWORD} className="mt-6 block">
          <Button className="w-full">Forgot password</Button>
        </Link>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout title="Password updated" subtitle="Sign in with your new password">
        <Link to={ROUTES.LOGIN}>
          <Button className="w-full">Sign in</Button>
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="New password"
          type="password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
