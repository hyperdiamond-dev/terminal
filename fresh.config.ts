import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";

export default defineConfig({
  plugins: [
    tailwind({
      // @ts-ignore Fresh tailwind plugin accepts config path at runtime
      config: "./tailwind.config.ts",
    }),
  ],
});
