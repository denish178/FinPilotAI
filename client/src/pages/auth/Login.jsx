import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuthStore } from "../../stores/authStore";
import { ROUTES } from "../../constants/routes";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success("Welcome back!");
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? "Cannot reach server. Is the backend running?" : "Login failed");
      toast.error(message);
    }
  };

  return (
    <AuthLayout title="Sign in" subtitle="Access your FinPilot dashboard">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm text-primary-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary-600 hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
