import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, searchForWorkspaceRoot } from "vite";

export default defineConfig(({ mode }) => {
  const rootDir = searchForWorkspaceRoot(process.cwd());
  const env = { ...loadEnv(mode, rootDir, ""), ...process.env };

  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith("VITE_") && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }

  const port = Number(env.VITE_PORT) || 5174;
  const host = env.VITE_HOST || "0.0.0.0";
  const backendProxyTarget =
    env.VITE_BACKEND_PROXY_TARGET || "http://localhost:4000";

  return {
    envDir: rootDir,
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
      dedupe: ["react", "react-dom"]
    },

    server: {
      host,
      port,
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true
        }
      }
    },

    preview: {
      host,
      port
    }
  };
});
