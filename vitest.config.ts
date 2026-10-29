import { defineConfig } from "vitest/config";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "server-only": fileURLToPath(
        new URL("./tests/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    testTimeout: 30000,
    hookTimeout: 120000,
    fileParallelism: false,
    env: { MONGOMS_DOWNLOAD_DIR: join(tmpdir(), "smartcell-mongodb-binaries") },
  },
});
