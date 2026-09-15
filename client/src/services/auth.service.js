import api from "./api";

export const authService = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  googleLogin: (credential) => api.post("/auth/google", { credential }),
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
    api.delete("/auth/account", { data: { password } }),
  getSettings: () => api.get("/auth/settings"),
  updateSettings: (data) => api.patch("/auth/settings", data),
  forgotPassword: (email) =>
    api.post("/auth/forgot-password", { email: String(email).trim() }),
  resetPassword: (data) => api.post("/auth/reset-password", data),
  verifyEmail: (token) => api.post("/auth/verify-email", { token }),
};
