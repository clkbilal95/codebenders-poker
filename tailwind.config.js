/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          bg: '#0D0F1A',
          surface: '#151929',
          card: '#1E2438',
          border: '#2A3050',
          accent: '#6C63FF',
          accentLight: '#8B85FF',
          gold: '#F5C842',
          green: '#3DFFA0',
          pink: '#FF6B9D',
          text: '#E8EAFF',
          muted: '#7B82A8',
        }
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'card-flip': 'cardFlip 0.6s ease-in-out',
        'gift-fly': 'giftFly 1.2s ease-out forwards',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        cardFlip: {
          '0%': { transform: 'rotateY(0deg)' },
          '50%': { transform: 'rotateY(90deg)' },
          '100%': { transform: 'rotateY(0deg)' },
        },
        giftFly: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          '50%': { transform: 'translate(-50px, -80px) scale(1.3)', opacity: 1 },
          '100%': { transform: 'translate(-120px, -160px) scale(0.5)', opacity: 0 },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: 0 },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(108, 99, 255, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(108, 99, 255, 0.8)' },
        }
      }
    },
  },
  plugins: [],
}
