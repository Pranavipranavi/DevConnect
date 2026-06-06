export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#38BDF8',
        secondary: '#F9A8D4',
        accent: '#FDE7D3',
        success: '#22C55E',
        canvas: '#FFFDFB',
        text: {
          light: '#1E293B',
          dark: '#F8FAFC'
        },
        border: {
          light: '#E2E8F0',
          dark: '#334155'
        },
        surface: {
          light: '#FFFFFF',
          dark: '#1E293B',
          card: '#1F2937'
        },
        muted: {
          light: '#64748B',
          dark: '#94A3B8'
        }
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
