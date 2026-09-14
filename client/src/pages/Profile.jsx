import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera, Loader2 } from "lucide-react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useAuthStore } from "../stores/authStore";
import { useSettingsStore } from "../stores/settingsStore";
import { getAvatarUrl } from "../utils/avatar";
import { ROUTES } from "../constants/routes";
import { CURRENCIES } from "../constants/settings";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  currency: z.string().length(3, "Use a 3-letter currency code"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, updateProfile, changePassword, uploadAvatar, deleteAccount, isLoading } =
    useAuthStore();
  const setCurrency = useSettingsStore((s) => s.setCurrency);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      currency: user?.currency || "INR",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        currency: user.currency || "INR",
      });
    }
  }, [user, profileForm]);

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const avatarUrl = getAvatarUrl(user?.avatar);

  const onProfileSubmit = async (data) => {
    try {
      const updated = await updateProfile(data);
      setCurrency(updated.currency || data.currency);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const onPasswordSubmit = async (data) => {
    try {
      await changePassword(data);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be 2MB or smaller");
      return;
    }

    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm deletion");
      return;
    }

    try {
      await deleteAccount(deletePassword);
      toast.success("Account deleted");
      navigate(ROUTES.LOGIN);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    } finally {
      setDeleteOpen(false);
      setDeletePassword("");
    }
  };

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-sm text-slate-500">Manage your account information</p>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-2xl font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
              aria-label="Change avatar"
            >
              {avatarUrl ? (
                <img
                  key={avatarUrl}
                  src={avatarUrl}
                  alt={user?.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "U"
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                {avatarUploading ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Camera size={20} className="text-white" />
                )}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <p className="mt-1 text-xs text-slate-400">Click avatar to upload (max 2MB)</p>
          </div>
        </div>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            error={profileForm.formState.errors.name?.message}
            {...profileForm.register("name")}
          />
          <Input label="Email" type="email" disabled value={user?.email || ""} />
          <div>
            <label className="mb-1.5 block text-sm font-medium">Currency</label>
            <select {...profileForm.register("currency")} className={selectClass}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            {profileForm.formState.errors.currency?.message && (
              <p className="mt-1 text-xs text-red-500">
                {profileForm.formState.errors.currency.message}
              </p>
            )}
          </div>
          <Button type="submit" isLoading={isLoading}>
            Update Profile
          </Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Change Password</h3>
        <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            error={passwordForm.formState.errors.currentPassword?.message}
            {...passwordForm.register("currentPassword")}
          />
          <Input
            label="New Password"
            type="password"
            error={passwordForm.formState.errors.newPassword?.message}
            {...passwordForm.register("newPassword")}
          />
          <Input
            label="Confirm New Password"
            type="password"
            error={passwordForm.formState.errors.confirmPassword?.message}
            {...passwordForm.register("confirmPassword")}
          />
          <Button type="submit" isLoading={isLoading}>
            Change Password
          </Button>
        </form>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <h3 className="mb-2 font-semibold text-red-600">Delete Account</h3>
        <p className="mb-4 text-sm text-slate-500">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <Button variant="danger" onClick={() => setDeleteOpen(true)}>
          Delete Account
        </Button>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletePassword("");
        }}
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        message="Enter your password to permanently delete your account and all financial data."
        confirmText="Delete forever"
        isLoading={isLoading}
      >
        <Input
          label="Password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          className="mt-4"
        />
      </ConfirmDialog>
    </div>
  );
}
