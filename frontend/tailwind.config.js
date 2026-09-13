/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F9F8",
        surface: "#FFFFFF",
        surfaceHover: "#F8FAFC",
        border: "#E5E7EB",
        primary: {
          DEFAULT: "#2563EB",
          50: "#EAF2FF",
          100: "#DBEAFE",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        medical: {
          DEFAULT: "#22A06B",
          light: "#EAF8F1",
          dark: "#166534",
        },
        ai: {
          DEFAULT: "#7C6CE7",
          light: "#F2F0FF",
          dark: "#5B46E0",
        },
        amber: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
        },
        slateText: {
          primary: "#111827",
          secondary: "#64748B",
          muted: "#94A3B8",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'swiss': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'swiss-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
