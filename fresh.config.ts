import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [
    tailwind({
      // Point to your Tailwind config
      config: "./tailwind.config.ts",
    }),
  ],
});
