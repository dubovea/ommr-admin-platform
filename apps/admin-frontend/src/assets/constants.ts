const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const BACKEND_BASE_URL = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_BASE_URL || "/api/admin",
);
