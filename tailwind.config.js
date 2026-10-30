/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        workstation: {
          bg: '#0f141c',
          panel: '#161d27',
          sidebar: '#121820',
          border: '#242f3d',
          hover: '#1e2836',
          active: '#273447',
          text: '#e2e8f0',
          muted: '#8b9bb4',
          accent: '#38bdf8', // crisp sky blue
          gold: '#eab308',
          crimson: '#f43f5e',
          emerald: '#10b981'
        }
      },
      fontFamily: {
        serif: ['"Crimson Pro"', '"Georgia"', '"Merriweather"', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    },
  },
  plugins: [],
}
