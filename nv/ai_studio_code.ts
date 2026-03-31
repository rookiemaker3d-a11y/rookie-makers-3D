import type { Config } from "tailwindcss";

const config: Config> = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        precision: "#00F2FF",
        action: "#FF5C00",
        industrial: {
          800: "#121212",
          900: "#0A0A0A",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;