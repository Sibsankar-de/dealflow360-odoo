import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "es2022",
  clean: true,
  sourcemap: true,
  splitting: false,
  onSuccess: "cp -R resources dist/",
});
