/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  "#06b6d4",      // cyan-500
        primaryHover: "#0891b2",  // cyan-600
        dark:     "#111111",
        card:     "#1c1c1c",
        surface:  "#242424",
        border:   "#2e2e2e",
        glow:     "#06b6d4",
      },
      boxShadow: {
        glow:     "0 0 20px rgba(6, 182, 212, 0.3)",
        glowLg:   "0 0 40px rgba(6, 182, 212, 0.2)",
        glowCard: "0 0 30px rgba(6, 182, 212, 0.1)",
      },
      backgroundImage: {
        'hero-gradient':   'radial-gradient(ellipse at top, #1a2e35 0%, #111111 60%)',
        'card-gradient':   'linear-gradient(135deg, #1c1c1c 0%, #242424 100%)',
        'accent-gradient': 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        'badge-pos':       'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        'badge-neg':       'linear-gradient(135deg, #450a0a 0%, #7f1d1d 100%)',
      }
    },
  },
  plugins: [],
}