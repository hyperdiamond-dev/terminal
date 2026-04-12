import { type PageProps } from "$fresh/server.ts";
import Header from "../components/Header.tsx";
import type { ThemeConfig } from "../lib/themes.ts";

// Default fallback for when no theme is resolved by route handlers
const DEFAULT_THEME: ThemeConfig = {
  id: "vhs",
  label: "VHS Static",
  cssVars: {},
  effects: "effect-grain effect-crt-vignette effect-chromatic",
};

export default function App({ Component, url, state }: PageProps) {
  // Extract current path
  const currentPath = url.pathname;

  // Determine if this is a static page or a module page
  const staticPages = ["/", "/about", "/login", "/register"];
  const isStaticPage = staticPages.includes(currentPath) ||
    !currentPath.includes("/module");

  // Resolve theme from route handler state (already fetched async in handlers)
  const theme = (state?.resolvedTheme as ThemeConfig) || DEFAULT_THEME;

  // Apply effect classes based on page type, with theme overrides
  const effectClasses = isStaticPage
    ? "effect-grain-heavy effect-crt-vignette effect-glitch"
    : theme.effects;

  const bodyClass = [effectClasses, theme.bodyClass].filter(Boolean).join(" ");

  // Build inline styles: inject CSS custom properties from theme
  const bodyStyle: Record<string, string> = {};
  if (Object.keys(theme.cssVars).length > 0) {
    Object.assign(bodyStyle, theme.cssVars);
    bodyStyle.backgroundColor = "var(--theme-bg)";
    bodyStyle.color = "var(--theme-text)";
  }

  // Extract module name from URL if present
  const moduleMatch = currentPath.match(/\/module\/([^\/]+)/);
  const moduleName = moduleMatch ? moduleMatch[1].toUpperCase() : null;

  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>TERMINAL UTOPIA</title>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body
        class={bodyClass}
        style={Object.keys(bodyStyle).length > 0 ? bodyStyle : undefined}
      >
        <div class="relative z-10">
          <Header currentPath={currentPath} moduleName={moduleName} />
          <main id="main-content" class="pt-[60px] min-h-screen">
            <Component />
          </main>
        </div>
      </body>
    </html>
  );
}
