module.exports = {
  darkMode: ["class"],
  content: [
  "./app/**/*.{js,ts,jsx,tsx}",
  "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
      primary: "var(--primary)",
      secondary: "var(--secondary)"
    }
  },
  plugins: []
}
};