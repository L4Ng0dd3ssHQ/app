/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#F1E6FA",
          100: "#E5D0F5",
          200: "#C9A1EA",
          300: "#A56BD6",
          500: "#7C2FB8",
          600: "#641F9A",
          700: "#4B0F8B",
          800: "#37056A",
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
        card: "0 4px 14px rgba(75, 15, 139, 0.08)",
        cardLg: "0 10px 30px rgba(75, 15, 139, 0.12)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
