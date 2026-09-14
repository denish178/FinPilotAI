export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  const path = avatar.startsWith("/") ? avatar : `/${avatar}`;
  const apiUrl = import.meta.env.VITE_API_URL || "/api";
  if (apiUrl.startsWith("http")) {
    const origin = apiUrl.replace(/\/api\/?$/, "");
    return `${origin}${path}`;
  }
  return path;
};
