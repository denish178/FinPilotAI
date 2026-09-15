import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import GoogleSignInButton from "../../components/auth/GoogleSignInButton";
import { useAuthStore } from "../../stores/authStore";
import { ROUTES } from "../../constants/routes";

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Register() {
  const navigate = useNavigate();
  const registerUser = useAuthStore((s) => s.register);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const isLoading = useAuthStore((s) => s.isLoading);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created! Welcome to FinPilot.");
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.request ? "Cannot reach server. Is the backend running?" : "Registration failed");
      toast.error(message);
    }
  };

  const handleGoogle = async (credential) => {
    try {
      await loginWithGoogle(credential);
      toast.success("Account created! Welcome to FinPilot.");
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err.response?.data?.message || "Google sign-up failed");
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Start managing your finances">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />
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
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create account
        </Button>
      </form>
      <GoogleSignInButton onCredential={handleGoogle} disabled={isLoading} />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
