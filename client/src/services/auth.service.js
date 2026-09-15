import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (credential, intent = "login") =>
    api.post("/auth/google", { credential, intent }),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.patch("/auth/profile", data),
  changePassword: (data) => api.patch("/auth/change-password", data),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api.post("/auth/avatar", formData);
  },
  deleteAccount: (password) =>
    api.delete("/auth/account", {
      data: password?.trim() ? { password: password.trim() } : {},
    }),
  getSettings: () => api.get("/auth/settings"),
  updateSettings: (data) => api.patch("/auth/settings", data),
  forgotPassword: (email) =>
    api.post("/auth/forgot-password", { email: String(email).trim() }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
};
