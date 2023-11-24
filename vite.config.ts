// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base =
  process.env.NODE_ENV === "production"
    ? "https://e-roy.github.io/multiple-window-3d-scene-react/"
    : "/";

export default defineConfig({
  base,
  plugins: [react()],
});
