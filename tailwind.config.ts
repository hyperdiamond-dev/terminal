import type { Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        backrooms: {
          wall: "#e8dcc4",
          "wall-dark": "#d4c5a9",
          carpet: "#8b7355",
        },
        fluorescent: {
          DEFAULT: "#fffacd",
          dim: "#f5f5dc",
        },
        crt: {
          green: "#00ff00",
          "green-dark": "#00cc00",
          amber: "#ff8800",
        },
        terminal: {
          black: "#0a0a0a",
          gray: "#2a2a2a",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "IBM Plex Mono",
          "Courier New",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        "crt-glow":
          "0 0 8px rgba(0, 255, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "crt-glow-strong":
          "0 0 20px rgba(0, 255, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.5)",
        "border-glow":
          "0 0 8px rgba(0, 255, 0, 0.3), inset 0 0 8px rgba(0, 255, 0, 0.1)",
        "header-glow":
          "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 0, 0.3)",
      },
      textShadow: {
        "crt-green":
          "0 0 8px rgba(0, 255, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "crt-amber":
          "0 0 8px rgba(255, 136, 0, 0.5), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "crt-glow": "0 0 10px currentColor",
        "crt-glow-strong": "0 0 20px currentColor, 0 0 30px currentColor",
      },
      animation: {
        "grain-wobble": "grain-wobble 0.15s steps(8) infinite",
      },
      keyframes: {
        "grain-wobble": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "10%": { transform: "translate(-5%, -10%)" },
          "20%": { transform: "translate(-10%, 5%)" },
          "30%": { transform: "translate(5%, -5%)" },
          "40%": { transform: "translate(-5%, 15%)" },
          "50%": { transform: "translate(-10%, 5%)" },
          "60%": { transform: "translate(15%, 0)" },
          "70%": { transform: "translate(0, 10%)" },
          "80%": { transform: "translate(-15%, 0)" },
          "90%": { transform: "translate(10%, 5%)" },
        },
      },
    },
  },
  plugins: [
    function ({ matchUtilities, theme }: any) {
      matchUtilities(
        {
          "text-shadow": (value: string) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") },
      );
    },
  ],
} satisfies Config;
