// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all your components
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2456e6",
        "primary-dark": "#1a3fae",
        accent: "#059669",
        dark: "#0a1628",
        background: "#f4f6fa",
        textPrimary: "#0b1424",
        textSecondary: "#52607a",
        border: "#e2e8f0",
      },
      fontFamily: {
        poppins: ["Inter", "sans-serif"],
        cormorant: ["Space Grotesk", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 22px rgba(8, 22, 45, 0.07)",
        "card-hover": "0 16px 38px rgba(36, 86, 230, 0.18)",
      },
    },
  },
  plugins: [],
};
