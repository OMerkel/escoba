import { cpSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  // Use relative asset paths so dist/index.html works from folder-based static servers.
  base: "./",
  root: "src",
  // Keep deck SVGs in src/img as single source of truth.
  publicDir: false,
  plugins: [
    {
      name: "copy-src-img-to-dist",
      apply: "build",
      closeBundle() {
        const sourceDir = resolve(__dirname, "src/img");
        const targetDir = resolve(__dirname, "dist/img");

        if (existsSync(sourceDir)) {
          cpSync(sourceDir, targetDir, { recursive: true, force: true });
        }
      },
    },
  ],
  build: {
    outDir: "../dist",
    sourcemap: true,
    minify: false,
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    open: false,
  },
});
