import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const port = Number(env.VITE_PORT) || 5174;
  const backendProxyTarget =
    env.VITE_BACKEND_PROXY_TARGET || "http://localhost:4000";

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      },
      dedupe: ["react", "react-dom"]
    },

    server: {
      port,
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true
        }
      }
    },

    preview: {
      port
    }
  };
});