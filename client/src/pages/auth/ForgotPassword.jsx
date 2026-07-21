import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { authService } from "../../services/auth.service";
import { ROUTES } from "../../constants/routes";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await authService.forgotPassword(data.email);
      toast.success("If the email exists, a reset link will be sent.");
    } catch {
      toast.success("If the email exists, a reset link will be sent.");
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="We'll send you a reset link (API coming in Phase 13)"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset link
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
