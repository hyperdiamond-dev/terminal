import type { ThemeConfig } from "./themes.ts";

/**
 * App-wide request state populated by routes/_middleware.ts and
 * consumed by routes/_app.tsx. Module routes overwrite resolvedTheme
 * with the module's curated theme and set themeSource to "module".
 */
export interface AppState {
  resolvedTheme: ThemeConfig;
  themeSource: "default" | "user" | "module";
  themes: ThemeConfig[];
}
