import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const DEV_PORT = 5175;
const DEFAULT_API_ORIGIN = "http://localhost:8000";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: DEV_PORT,
      proxy: { "/v1": { target: env.VITE_API_ORIGIN || DEFAULT_API_ORIGIN, changeOrigin: true } },
    },
  };
});
