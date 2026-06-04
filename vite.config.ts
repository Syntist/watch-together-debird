import { solidStart } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [solidStart(), tailwindcss(), nitro()],
  nitro: {
    features: {
      websocket: true,
    },
    handlers: [
      {
        route: "/ws",
        handler: "./src/ws.ts",
      },
    ],
  },
});
