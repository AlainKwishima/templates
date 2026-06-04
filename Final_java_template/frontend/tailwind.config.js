/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        slate: {
          350: '#cbd5e1', 
          705: '#334155', 
        },
        blue: {
          150: '#dbeafe', 
          650: '#2563eb', 
        }
      }
    },
  },
  plugins: [],
}
