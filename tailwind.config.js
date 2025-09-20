/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
      "./App.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
        colors: {
            primary: "#2CC26D",
            secondary: "#87DEAB",
            login: "#8EDFB1",
            botlogin: "#C3EBD4",
            text: "#DFF7E2",

        }
    },
  },
  plugins: [],
}

