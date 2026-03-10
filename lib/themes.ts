export interface ThemeConfig {
  id: string;
  label: string;
  cssVars: Record<string, string>;
  effects: string;
  bodyClass?: string;
}

// Default fallback theme when API is unreachable
const DEFAULT_THEME: ThemeConfig = {
  id: "vhs",
  label: "VHS Static",
  cssVars: {},
  effects: "effect-grain effect-crt-vignette effect-chromatic",
};

const API_BASE_URL = Deno.env.get("API_BASE_URL") || "http://localhost:8000";

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
