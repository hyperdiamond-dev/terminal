import { API_BASE_URL } from "./api.ts";

export interface ThemeConfig {
  id: string;
  label: string;
  cssVars: Record<string, string>;
  effects: string;
  bodyClass?: string;
}

// Default fallback theme when API is unreachable
export const DEFAULT_THEME: ThemeConfig = {
  id: "vhs",
  label: "VHS Static",
  cssVars: {},
  effects: "effect-grain effect-crt-vignette effect-chromatic",
};

// Mirrors the :root defaults in static/styles.css — keep in sync
export const THEME_CSS_VAR_NAMES = [
  "--theme-bg",
  "--theme-text",
  "--theme-text-dim",
  "--theme-text-muted",
  "--theme-accent",
  "--theme-accent-dim",
  "--theme-accent-secondary",
  "--theme-surface",
  "--theme-surface-light",
  "--theme-border",
  "--theme-glow",
  "--theme-text-shadow",
] as const;

// Every effect class a theme may apply — keep in sync with static/styles.css
export const ALL_EFFECT_CLASSES = [
  "effect-grain",
  "effect-grain-heavy",
  "effect-crt-vignette",
  "effect-chromatic",
  "effect-glitch",
] as const;

// Heavy effects applied to pages when no theme has been chosen
export const LEGACY_STATIC_EFFECTS =
  "effect-grain-heavy effect-crt-vignette effect-glitch";

// In-memory cache with TTL
let themesCache: ThemeConfig[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchThemes(): Promise<ThemeConfig[]> {
  if (themesCache && Date.now() < cacheExpiry) {
    return themesCache;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/themes`);
    if (!res.ok) throw new Error("Failed to fetch themes");
    const data = await res.json();
    themesCache = data.themes.map(
      (t: {
        name: string;
        label: string;
        css_vars: Record<string, string>;
        effects: string;
        body_class?: string | null;
      }) => ({
        id: t.name,
        label: t.label,
        cssVars: t.css_vars,
        effects: t.effects,
        bodyClass: t.body_class || undefined,
      }),
    );
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return themesCache!;
  } catch {
    return [DEFAULT_THEME];
  }
}

export async function getTheme(
  themeId: string | null | undefined,
): Promise<ThemeConfig> {
  const themes = await fetchThemes();
  if (themeId) {
    const found = themes.find((t) => t.id === themeId);
    if (found) return found;
  }
  return themes.find((t) => t.id === "vhs") || DEFAULT_THEME;
}
