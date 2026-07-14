import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import {
  ALL_EFFECT_CLASSES,
  THEME_CSS_VAR_NAMES,
  type ThemeConfig,
} from "../lib/themes.ts";
import { THEME_COOKIE } from "../lib/cookies.ts";

interface ThemeSwitcherProps {
  themes: ThemeConfig[];
  activeThemeId: string;
}

// :root fallbacks for swatches when a theme (e.g. vhs) has empty cssVars
const SWATCH_DEFAULTS: Record<string, string> = {
  "--theme-bg": "#0a0a0a",
  "--theme-accent": "#aa55ff",
  "--theme-accent-secondary": "#3366ff",
};

const SWATCH_VARS = [
  "--theme-bg",
  "--theme-accent",
  "--theme-accent-secondary",
];

export default function ThemeSwitcher(
  { themes, activeThemeId }: ThemeSwitcherProps,
) {
  const isOpen = useSignal(false);
  const committedId = useSignal(activeThemeId);
  const announcement = useSignal("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const committed = themes.find((t) => t.id === committedId.value) ??
    themes[0];

  const applyThemeToBody = (t: ThemeConfig) => {
    const body = document.body;

    // CSS variables: clear all, then set the theme's own
    for (const name of THEME_CSS_VAR_NAMES) {
      body.style.removeProperty(name);
    }
    for (const [k, v] of Object.entries(t.cssVars)) {
      body.style.setProperty(k, v);
    }

    // Mirror _app.tsx: bind bg/text to the vars only when the theme
    // provides vars; otherwise fall back to the :root defaults
    if (Object.keys(t.cssVars).length > 0) {
      body.style.setProperty("background-color", "var(--theme-bg)");
      body.style.setProperty("color", "var(--theme-text)");
    } else {
      body.style.removeProperty("background-color");
      body.style.removeProperty("color");
    }

    // Effect + theme body classes: strip every known one, add this theme's
    const themeBodyClasses = themes
      .map((theme) => theme.bodyClass)
      .filter((c): c is string => Boolean(c));
    body.classList.remove(...ALL_EFFECT_CLASSES, ...themeBodyClasses);
    body.classList.add(...t.effects.split(" ").filter(Boolean));
    if (t.bodyClass) body.classList.add(t.bodyClass);
  };

  const revertToCommitted = () => {
    applyThemeToBody(committed);
  };

  const close = (revert = true) => {
    if (revert) revertToCommitted();
    isOpen.value = false;
    triggerRef.current?.focus();
  };

  const selectTheme = (t: ThemeConfig) => {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${THEME_COOKIE}=${
      encodeURIComponent(t.id)
    }; path=/; max-age=31536000; SameSite=Lax${secure}`;
    committedId.value = t.id;
    applyThemeToBody(t);
    announcement.value = `THEME SET: ${t.label.toUpperCase()}`;
    isOpen.value = false;
    triggerRef.current?.focus();
  };

  // Escape closes and reverts any preview
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen.value) {
        close();
      }
    };
    globalThis.addEventListener("keydown", handleEscape);
    return () => globalThis.removeEventListener("keydown", handleEscape);
  }, []);

  const handleOptionKeyDown = (e: KeyboardEvent, index: number) => {
    const options = optionRefs.current;
    let target: number | null = null;
    if (e.key === "ArrowDown") target = (index + 1) % themes.length;
    else if (e.key === "ArrowUp") {
      target = (index - 1 + themes.length) % themes.length;
    } else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = themes.length - 1;
    if (target !== null) {
      e.preventDefault();
      options[target]?.focus();
    }
  };

  const swatchColor = (t: ThemeConfig, varName: string): string =>
    t.cssVars[varName] ?? SWATCH_DEFAULTS[varName];

  return (
    <div class="relative">
      <button
        type="button"
        ref={triggerRef}
        onClick={() => {
          if (isOpen.value) close();
          else isOpen.value = true;
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen.value}
        aria-controls="theme-menu"
        class="font-mono text-sm text-t-text-dim border-2 border-t-border bg-transparent px-3 py-1 transition-colors duration-200 hover:text-t-accent hover:border-t-accent"
      >
        <span class="hidden md:inline">
          [ THEME: {committed.label.toUpperCase()} ]
        </span>
        <span class="md:hidden" aria-hidden="true">[◱]</span>
        <span class="sr-only md:hidden">Select theme</span>
      </button>

      {isOpen.value && (
        <>
          {/* Click-outside overlay */}
          <div
            class="fixed inset-0 z-[1090]"
            onClick={() => close()}
            aria-hidden="true"
          />

          <ul
            id="theme-menu"
            role="listbox"
            aria-label="Color theme"
            class="absolute right-0 top-[calc(100%+8px)] z-[1100] min-w-[240px] border-2 border-t-border bg-decay-void p-1 shadow-t-glow"
            onMouseLeave={revertToCommitted}
          >
            {themes.map((t, i) => (
              <li key={t.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={t.id === committedId.value}
                  ref={(el) => (optionRefs.current[i] = el)}
                  tabIndex={t.id === committedId.value ? 0 : -1}
                  onMouseEnter={() => applyThemeToBody(t)}
                  onFocus={() => applyThemeToBody(t)}
                  onClick={() => selectTheme(t)}
                  onKeyDown={(e) => handleOptionKeyDown(e, i)}
                  class={`flex w-full items-center justify-between gap-4 px-3 py-2 font-mono text-sm text-left transition-colors duration-150 hover:bg-t-surface-light focus:bg-t-surface-light ${
                    t.id === committedId.value
                      ? "text-t-accent"
                      : "text-t-text-dim"
                  }`}
                >
                  <span>
                    {t.id === committedId.value ? "› " : "  "}
                    {t.label.toUpperCase()}
                  </span>
                  <span class="flex gap-1" aria-hidden="true">
                    {SWATCH_VARS.map((v) => (
                      <span
                        key={v}
                        class="inline-block h-3 w-3 border border-t-border"
                        style={{ backgroundColor: swatchColor(t, v) }}
                      />
                    ))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div role="status" aria-live="polite" class="sr-only">
        {announcement.value}
      </div>
    </div>
  );
}
