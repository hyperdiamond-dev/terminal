export type StyleTheme =
  | "vhs"
  | "poolrooms"
  | "backrooms_yellow"
  | "void"
  | "redrooms";

export interface ThemeConfig {
  id: StyleTheme;
  label: string;
  cssVars: Record<string, string>;
  effects: string;
  bodyClass?: string;
}

export const THEMES: Record<StyleTheme, ThemeConfig> = {
  vhs: {
    id: "vhs",
    label: "VHS Static",
    cssVars: {},
    effects: "effect-grain effect-crt-vignette effect-chromatic",
  },
  poolrooms: {
    id: "poolrooms",
    label: "The Poolrooms",
    cssVars: {
      "--theme-bg": "#0a1a1a",
      "--theme-text": "#c8e6e6",
      "--theme-text-dim": "#7ab8b8",
      "--theme-text-muted": "#4a8888",
      "--theme-accent": "#00bfa5",
      "--theme-accent-dim": "#009688",
      "--theme-accent-secondary": "#4dd0e1",
      "--theme-surface": "rgba(13, 38, 38, 0.8)",
      "--theme-surface-light": "rgba(20, 51, 51, 0.8)",
      "--theme-border": "#1a4040",
      "--theme-glow":
        "0 0 16px rgba(0, 191, 165, 0.3), 0 2px 8px rgba(0, 0, 0, 0.8)",
      "--theme-text-shadow":
        "0 0 8px rgba(0, 191, 165, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)",
    },
    effects: "effect-grain effect-crt-vignette",
    bodyClass: "theme-poolrooms",
  },
  backrooms_yellow: {
    id: "backrooms_yellow",
    label: "Level 0",
    cssVars: {
      "--theme-bg": "#1a1608",
      "--theme-text": "#e8d44d",
      "--theme-text-dim": "#b8a43d",
      "--theme-text-muted": "#8a7a2e",
      "--theme-accent": "#e8d44d",
      "--theme-accent-dim": "#c4b340",
      "--theme-accent-secondary": "#d4a030",
      "--theme-surface": "rgba(37, 32, 16, 0.8)",
      "--theme-surface-light": "rgba(51, 44, 22, 0.8)",
      "--theme-border": "#4a4020",
      "--theme-glow":
        "0 0 16px rgba(232, 212, 77, 0.25), 0 2px 8px rgba(0, 0, 0, 0.8)",
      "--theme-text-shadow":
        "0 0 8px rgba(232, 212, 77, 0.5), 2px 2px 4px rgba(0, 0, 0, 0.9)",
    },
    effects: "effect-grain-heavy effect-crt-vignette",
    bodyClass: "theme-yellow",
  },
  void: {
    id: "void",
    label: "The Void",
    cssVars: {
      "--theme-bg": "#020202",
      "--theme-text": "#888888",
      "--theme-text-dim": "#555555",
      "--theme-text-muted": "#333333",
      "--theme-accent": "#6a0dad",
      "--theme-accent-dim": "#4a0a7a",
      "--theme-accent-secondary": "#8b5cf6",
      "--theme-surface": "rgba(8, 8, 8, 0.8)",
      "--theme-surface-light": "rgba(16, 16, 16, 0.8)",
      "--theme-border": "#1a1a1a",
      "--theme-glow":
        "0 0 24px rgba(106, 13, 173, 0.2), 0 2px 8px rgba(0, 0, 0, 0.9)",
      "--theme-text-shadow":
        "0 0 12px rgba(106, 13, 173, 0.4), 2px 2px 6px rgba(0, 0, 0, 1)",
    },
    effects: "effect-crt-vignette",
    bodyClass: "theme-void",
  },
  redrooms: {
    id: "redrooms",
    label: "The Crimson Halls",
    cssVars: {
      "--theme-bg": "#0a0505",
      "--theme-text": "#e8c0c0",
      "--theme-text-dim": "#b08080",
      "--theme-text-muted": "#805050",
      "--theme-accent": "#cc2244",
      "--theme-accent-dim": "#991133",
      "--theme-accent-secondary": "#e65030",
      "--theme-surface": "rgba(26, 10, 10, 0.8)",
      "--theme-surface-light": "rgba(42, 16, 16, 0.8)",
      "--theme-border": "#401515",
      "--theme-glow":
        "0 0 16px rgba(204, 34, 68, 0.3), 0 2px 8px rgba(0, 0, 0, 0.8)",
      "--theme-text-shadow":
        "0 0 8px rgba(204, 34, 68, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)",
    },
    effects: "effect-grain effect-crt-vignette",
    bodyClass: "theme-redrooms",
  },
};

export function getTheme(themeId: string | null | undefined): ThemeConfig {
  if (themeId && themeId in THEMES) {
    return THEMES[themeId as StyleTheme];
  }
  return THEMES.vhs;
}
