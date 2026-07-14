import { FreshContext } from "$fresh/server.ts";
import { fetchThemes, getTheme } from "../lib/themes.ts";
import { getCookieValue, THEME_COOKIE } from "../lib/cookies.ts";
import type { AppState } from "../lib/state.ts";

/**
 * Resolve the user's theme (from the theme cookie) for every page render.
 * Module routes overwrite this with the module's curated theme.
 */
export async function handler(
  req: Request,
  ctx: FreshContext<AppState>,
): Promise<Response> {
  if (ctx.destination !== "route") return ctx.next();

  const userThemeId = getCookieValue(req, THEME_COOKIE);
  ctx.state.themes = await fetchThemes();
  ctx.state.resolvedTheme = await getTheme(userThemeId);
  // getTheme falls back to "vhs" for unknown ids — only treat an exact
  // match as an explicit user choice
  ctx.state.themeSource =
    userThemeId && ctx.state.resolvedTheme.id === userThemeId
      ? "user"
      : "default";
  return ctx.next();
}
