import { defineConfig } from "vite";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // The library ships extensionless ESM imports; Node cannot resolve them, Vite can.
    server: { deps: { inline: ["@material/material-color-utilities"] } },
  },
});
