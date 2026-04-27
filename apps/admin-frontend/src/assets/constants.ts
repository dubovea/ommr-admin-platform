const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const BACKEND_BASE_URL = getEnvVar("VITE_BACKEND_BASE_URL");
