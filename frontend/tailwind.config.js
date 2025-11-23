/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4f46e5', // indigo-600
        secondary: '#9333ea' // purple-600
      },
      borderRadius: {
        'none': '0px',
        'sm': '4px',
        DEFAULT: '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
        'button': '8px'
      }
    },
  },
  plugins: [],
}
