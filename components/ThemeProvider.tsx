import { buildThemeStyle, getTheme } from "../lib/themes.ts";

interface ThemeProviderProps {
  styleTheme: string | null | undefined;
}

export default function ThemeProvider({ styleTheme }: ThemeProviderProps) {
  const theme = getTheme(styleTheme);

  // Default VHS theme — no overrides needed
  if (!theme.bodyClass) return null;

  const varsString = buildThemeStyle(theme);

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `:root { ${varsString} }`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){var b=document.body;b.className="${theme.effects}${
              theme.bodyClass ? " " + theme.bodyClass : ""
            }";b.style.backgroundColor="var(--theme-bg)";b.style.color="var(--theme-text)";})();`,
        }}
      />
    </>
  );
}
