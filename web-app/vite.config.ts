import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // Izinkan host tunnel untuk QA visual dari browser cloud.
    allowedHosts: [".trycloudflare.com"],
  },
  preview: {
    allowedHosts: [".trycloudflare.com"],
    port: 5173,
  },
});
