import { defineConfig } from "tsup";
import { cpSync } from "fs";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/executors/format/executor.ts",
    "src/executors/check/executor.ts",
    "src/generators/init/generator.ts",
    "src/utils/run-oxfmt.ts",
    "src/utils/resolve-oxfmt.ts",
    "src/utils/normalize-options.ts",
    "plugin.ts",
  ],
  format: ["cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  target: "es2021",
  external: ["@nx/devkit", "nx", "tslib"],
  async onSuccess() {
    // Copy generator template files alongside compiled output so that
    // generateFiles(tree, join(__dirname, 'files'), ...) resolves correctly at runtime.
    cpSync("src/generators/init/files", "dist/src/generators/init/files", { recursive: true });
  },
});
