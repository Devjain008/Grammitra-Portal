/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        village: {
          darkGreen: '#1B4332',
          emerald: '#2D6A4F',
          mint: '#52B788',
          lightMint: '#D8F3DC',
          clay: '#9C6644',
          sand: '#EDE0D4',
          cream: '#F4F1DE'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}