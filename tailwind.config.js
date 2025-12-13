/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0070f3',
        secondary: '#f3f4f6',
      }
    },
  },
  // SỬA: plugins phải là một mảng rỗng (hoặc chứa các plugin của Tailwind như typography, forms...)
  // KHÔNG được để tailwindcss và autoprefixer ở đây.
  plugins: [],
}