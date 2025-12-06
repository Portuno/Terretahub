/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        terreta: {
          bg: '#F9F6F0',
          dark: '#3E2723',
          deep: '#231715',
          olive: '#556B2F',
          gold: '#D4AF37',
          accent: '#8D6E63',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'out-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      }
    }
  },
  plugins: [],
}

