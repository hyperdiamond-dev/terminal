import { type PageProps } from "$fresh/server.ts";
import Header from "../components/Header.tsx";
import { getTheme } from "../lib/themes.ts";

export default function App({ Component, url, state }: PageProps) {
  // Extract current path
  const currentPath = url.pathname;

  // Determine if this is a static page or a module page
  const staticPages = ["/", "/about", "/login", "/register"];
  const isStaticPage = staticPages.includes(currentPath) ||
    !currentPath.includes("/module");

  // Resolve theme from route handler state
  const styleTheme = state?.styleTheme as string | undefined;
  const theme = getTheme(styleTheme);

  // Apply effect classes based on page type, with theme overrides
  const effectClasses = isStaticPage
    ? "effect-grain-heavy effect-crt-vignette effect-glitch"
    : theme.effects;

  const bodyClass = [effectClasses, theme.bodyClass].filter(Boolean).join(" ");

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
        style={theme.bodyClass
          ? { backgroundColor: "var(--theme-bg)", color: "var(--theme-text)" }
          : undefined}
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
