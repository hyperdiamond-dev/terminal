import { type PageProps } from "$fresh/server.ts";
import Header from "../components/Header.tsx";
import { DEFAULT_THEME, LEGACY_STATIC_EFFECTS } from "../lib/themes.ts";
import type { AppState } from "../lib/state.ts";

export default function App(
  { Component, url, state }: PageProps<unknown, AppState>,
) {
  // Extract current path
  const currentPath = url.pathname;

  // Theme resolved by _middleware.ts (user cookie or default), overwritten
  // by module routes with the module's curated theme
  const theme = state?.resolvedTheme ?? DEFAULT_THEME;
  const themeSource = state?.themeSource ?? "default";

  // No explicit theme chosen: keep the legacy heavy-grain look
  const effectClasses = themeSource === "default"
    ? LEGACY_STATIC_EFFECTS
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
  const moduleMatch = currentPath.match(/\/modules\/([^\/]+)/);
  const moduleName = moduleMatch ? moduleMatch[1].toUpperCase() : null;

  return (
    <html lang="en">
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
        <a href="#main-content" class="skip-link">SKIP TO CONTENT</a>
        <div class="relative z-10">
          <Header
            currentPath={currentPath}
            moduleName={moduleName}
            themes={state?.themes ?? [DEFAULT_THEME]}
            activeThemeId={theme.id}
            showThemeSwitcher={themeSource !== "module"}
          />
          <main id="main-content" tabindex={-1} class="pt-[60px] min-h-screen">
            <Component />
          </main>
        </div>
      </body>
    </html>
  );
}
