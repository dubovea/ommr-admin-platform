import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

function getProxyTarget(rawBackendBaseUrl: string | undefined) {
  const fallback = "http://localhost:4000";

  if (!rawBackendBaseUrl || rawBackendBaseUrl.startsWith("/")) {
    return fallback;
  }

  try {
    return new URL(rawBackendBaseUrl).origin;
  } catch {
    return fallback;
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT) || 5174;
  const host = env.VITE_HOST || "0.0.0.0";
  const backendProxyTarget =
    env.VITE_BACKEND_PROXY_TARGET || getProxyTarget(env.VITE_BACKEND_BASE_URL);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@ommr/shared": path.resolve(
          __dirname,
          "../../packages/shared/src/index.ts",
        ),
      },
    },
    server: {
      host,
      port,
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host,
      port,
    },
  };
});
