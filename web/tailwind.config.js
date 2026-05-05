/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#F5EEF1",
          100: "#E8D5DC",
          200: "#C9A3B0",
          300: "#A67285",
          500: "#4c333e",
          600: "#3f2a34",
          700: "#351e28",
          800: "#261520",
        },
        ink: "#1A0F2E",
        muted: "#6E6680",
        bg: "#FAF7FD",
        good: "#10B981",
        warn: "#F59E0B",
        bad: "#EF4444",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 14px rgba(53, 30, 40, 0.08)",
        cardLg: "0 10px 30px rgba(53, 30, 40, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};