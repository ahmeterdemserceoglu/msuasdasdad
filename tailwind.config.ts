import type { Config } from "tailwindcss";

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        border: "var(--border)",
        card: "var(--card)",
        white: "#ffffff",
        black: "#000000",
        primary: {
          DEFAULT: 'var(--primary)',
          light: 'var(--primary-light)',
          hover: 'var(--primary-hover)',
          50: '#e8f5fd',
          100: '#d1ebfb',
          200: '#a2d6f7',
          300: '#74c2f3',
          400: '#45adef',
          500: '#1d9bf0',
          600: '#0c84d2',
          700: '#0a6aaa',
          800: '#085182',
          900: '#06375a',
        },
        gray: {
          50: '#f7f9fa',
          100: '#eff3f4',
          200: '#e1e8ed',
          300: '#cfd9de',
          400: '#aab8c2',
          500: '#8899a6',
          600: '#657786',
          700: '#536471',
          800: '#38444d',
          900: '#15202b',
        },
        blue: {
          400: '#60a5fa',
          600: '#2563eb',
        },
        red: {
          500: '#ef4444',
        },
        green: {
          500: '#22c55e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        '3d': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config;
