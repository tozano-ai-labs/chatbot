import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || "dev"),
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
