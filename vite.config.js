import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    // Listen on every interface, so the app can be opened from a phone on the same
    // network. Vite binds localhost by default, which no other device can reach.
    host: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    host: true,
  },
  plugins: [vue()],
});
