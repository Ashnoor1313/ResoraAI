/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "#0B1020",
        card: "#121826",
        border: "#1F293D",
        primary: {
          DEFAULT: "#6366F1",
          hover: "#4F46E5",
        },
        secondary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-secondary': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
