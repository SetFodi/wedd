import vinext from "vinext";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

export default defineConfig({
  server: {
    watch: {
      ignored: ["**/.output/**", "**/.vercel/**", "**/.vinext/**"],
      ...(isCodexSeatbeltSandbox
        ? { useFsEvents: false, usePolling: true }
        : {}),
    },
  },
  plugins: [vinext(), nitro()],
});
