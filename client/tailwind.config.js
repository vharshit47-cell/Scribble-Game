/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F172A",
        card: "#1E293B",
        primary: "#6366F1",
        accent: "#22C55E",
        warning: "#FACC15",
        danger: "#EF4444",
        ink: "#F8FAFC",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(99, 102, 241, 0.5)",
        float: "0 20px 40px -20px rgba(0,0,0,0.5)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
