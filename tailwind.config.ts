import type { Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vhs: {
          white: "#e8e8e8",
          "white-dim": "#c0c0c0",
          "white-dirty": "#a0a0a0",
          gray: "#808080",
          "gray-dark": "#404040",
          black: "#0a0a0a",
          "static-light": "#d0d0d0",
          "static-dark": "#303030",
        },
        analog: {
          red: "#ff3366",
          "red-dim": "#cc2244",
          blue: "#3366ff",
          "blue-dim": "#2244cc",
          purple: "#9933ff",
          "purple-dim": "#7722cc",
          cyan: "#33ffff",
          "cyan-dim": "#22cccc",
        },
        decay: {
          void: "#000000",
          "void-soft": "#0d0d0d",
          ash: "#1a1a1a",
          smoke: "#262626",
          dust: "#333333",
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
        "vhs-glow":
          "0 0 16px rgba(255, 51, 102, 0.4), 0 2px 8px rgba(0, 0, 0, 0.8)",
        "vhs-glow-blue":
          "0 0 16px rgba(51, 102, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.8)",
        "vhs-glow-purple":
          "0 0 16px rgba(153, 51, 255, 0.3), 0 2px 8px rgba(0, 0, 0, 0.8)",
        "static-border":
          "0 0 4px rgba(192, 192, 192, 0.3), inset 0 0 4px rgba(48, 48, 48, 0.5)",
        "void-deep":
          "0 8px 32px rgba(0, 0, 0, 0.95), inset 0 2px 8px rgba(0, 0, 0, 0.9)",
        "decay-edge": "0 4px 16px rgba(0, 0, 0, 0.9)",
      },
      textShadow: {
        "vhs-red":
          "0 0 8px rgba(255, 51, 102, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)",
        "vhs-blue":
          "0 0 8px rgba(51, 102, 255, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)",
        "vhs-purple":
          "0 0 8px rgba(153, 51, 255, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.9)",
        "vhs-white":
          "0 0 4px rgba(232, 232, 232, 0.4), 1px 1px 2px rgba(0, 0, 0, 0.9)",
        "static-text":
          "1px 1px 2px rgba(192, 192, 192, 0.3), 0 0 4px rgba(48, 48, 48, 0.8)",
        "void-text": "2px 2px 6px rgba(0, 0, 0, 1)",
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
    function ({
      matchUtilities,
      theme,
    }: {
      matchUtilities: (
        utilities: Record<string, (value: string) => Record<string, string>>,
        config: { values: Record<string, string> },
      ) => void;
      theme: (path: string) => Record<string, string>;
    }) {
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
