import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // vite.config.ts runs in Node, so `import.meta.env` is not available — read
  // the .env files ourselves. Empty prefix because the proxy target is a
  // dev-server setting, not something the client bundle should ever see.
  const env = loadEnv(mode, __dirname, "");

  // Default matches backend/.env's PORT: on macOS :5000 is held by
  // ControlCenter (AirPlay Receiver), so the backend can't live there.
  const proxy = {
    "/api": {
      target: env.DEV_API_PROXY_TARGET || "http://localhost:5001",
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy,
    },
    preview: {
      port: 4173,
      proxy,
    },
  };
});
