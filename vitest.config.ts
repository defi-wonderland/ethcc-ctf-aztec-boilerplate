import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/ts/setup.ts"],
    // aztec sandbox tests take quite some time
    hookTimeout: 200000,
    testTimeout: 200000,
    fileParallelism: false,
    pool: "forks",
    maxWorkers: 1,
    isolate: false,
    execArgv: ["--experimental-vm-modules"],
    // Use new API to inline dependencies through Vite's transform pipeline
    // This ensures viem, @aztec, @noble, and @scure packages use Vite's module resolution with proper aliasing
    server: {
      deps: {
        inline: [/@aztec/, /@noble\/(hashes|curves|ciphers)/, /viem/, /@scure/],
      },
    },
  },
});
