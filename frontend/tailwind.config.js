// tailwind.config.js
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0f0f23',
          surface: '#1a1a2e',
          border: '#2a2a3e',
          text: '#ffffff',
          'text-secondary': '#a0a0a0',
        }
      }
    },
  },
  plugins: [],
}

export default config