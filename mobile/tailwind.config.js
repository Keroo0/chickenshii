/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit_400Regular', 'sans-serif'],
        outfit_medium: ['Outfit_500Medium', 'sans-serif'],
        outfit_bold: ['Outfit_700Bold', 'sans-serif'],
        outfit_black: ['Outfit_900Black', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#1159B1',
          light: '#3076CC',
          soft: '#E6F0FA',
        },
        secondary: {
          DEFAULT: '#FBB03B',
          soft: '#FEF6E6',
        },
        healthy: {
          DEFAULT: '#5FBD38',
          soft: '#EDF8E7',
        },
        warning: {
          DEFAULT: '#FBB03B',
          soft: '#FEF6E6',
        },
        danger: {
          DEFAULT: '#ED1C24',
          soft: '#FCE7E8',
        },
        neutral: {
          bg: '#FFFFFF',
          card: '#FAFAFA',
          foreground: '#663300',
          muted: '#6B7280',
          'muted-soft': '#F3F4F6',
          border: '#E5E7EB',
          'border-light': '#F3F4F6',
        },
        brown: {
          DEFAULT: '#663300',
          soft: '#F4EAE1',
        },
      },
    },
  },
  plugins: [],
};
