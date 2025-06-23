/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // Next.js App Router
    "./pages/**/*.{js,ts,jsx,tsx}", // Se usar Pages Router também
    "./components/**/*.{js,ts,jsx,tsx}", // Seus componentes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
