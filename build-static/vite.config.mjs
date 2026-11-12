import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@\/assets\/shreyash_portrait\.jpg\.asset\.json$/, replacement: here("./portrait-asset.ts") },
      { find: /^@\//, replacement: here("./src/") },
    ],
  },
  build: { outDir: "dist", emptyOutDir: true, assetsDir: "site" },
});
