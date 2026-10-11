import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  build: mode === "lib"
    ? {
        outDir: "dist",
        emptyOutDir: true,
        lib: {
          entry: "src/index.ts",
          name: "Monochromation",
          fileName: "index",
          formats: ["es", "cjs"],
        },
        // The colour library is bundled in on purpose: its extensionless ESM imports
        // do not resolve under plain Node, so consumers must not have to re-bundle it.
        rollupOptions: { external: [] },
      }
    : { outDir: "dist-demo", emptyOutDir: true },
  test: {
    environment: "jsdom",
    globals: true,
    // Vitest externalises node_modules; Node then fails on the extensionless imports. Inline it.
    server: { deps: { inline: ["@material/material-color-utilities"] } },
  },
}));
