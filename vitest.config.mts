import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // 5s is vitest's default and it is too tight here: the `userEvent` tests
    // advance the clock through real React state transitions and re-renders, and
    // a CI container under load can push one past it. A timeout that fails on a
    // slow machine rather than a slow test produces a red build that has nothing
    // to do with the change — and on a deploy-on-green pipeline that is a
    // randomly blocked deployment.
    testTimeout: 20_000,
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "tests/**/*.test.ts",
      "tests/**/*.test.tsx",
      // Build-time scripts: the deployment guard's rules are tested the same way
      // as the rest of the suite, so a change to the gate cannot pass silently.
      "scripts/**/*.test.ts",
    ],
  },
});