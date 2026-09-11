/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath } from "node:url";

const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg", "icons/*.png", "fonts/**/*.woff2", "art/*.webp"],
      manifest: {
        name: "Telluride Blues & Brews",
        short_name: "Blues & Brews",
        description: "Official festival guide: lineup, your plan, alerts.",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        id: "./",
        background_color: "#EBD5B3",
        theme_color: "#1A4A80",
        lang: "en",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          { src: "icons/apple-touch-icon-180.png", sizes: "180x180", type: "image/png" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,webp,woff2,png}"],
        globIgnores: ["art/*.png", "fonts/**/*.ttf", "fonts/**/OFL.txt"],
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/\/design(\/|$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0") },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
    css: false,
    env: { VITE_DATA_SOURCE: "bundled" },
    alias: { "virtual:pwa-register": fileURLToPath(new URL("./src/test/pwa-register.mock.ts", import.meta.url)) },
  },
});
