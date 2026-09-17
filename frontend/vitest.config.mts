import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests cover pure logic (schemas, SSE parsing, structured data). The UI
// flow is covered by Playwright, so no DOM environment is needed here.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
