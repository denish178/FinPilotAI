export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  return avatar.startsWith("/") ? avatar : `/${avatar}`;
};
