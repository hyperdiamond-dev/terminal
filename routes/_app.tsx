import { type PageProps } from "$fresh/server.ts";
import Header from "../components/Header.tsx";

export default function App({ Component, url }: PageProps) {
  // Extract current path
  const currentPath = url.pathname;

  // Determine if this is a static page or a module page
  const staticPages = ["/", "/about", "/login", "/register"];
  const isStaticPage = staticPages.includes(currentPath) ||
    !currentPath.includes("/module");

  // Apply effect classes based on page type
  const effectClasses = isStaticPage
    ? "effect-grain-heavy effect-crt-vignette effect-glitch"
    : "effect-grain effect-crt-vignette effect-chromatic";

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
      <body class={effectClasses}>
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
