/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#0b1530',
        },
        brand: {
          gold: '#C9A067',
          gold2: '#E9CFA6',
          choco: '#2A120A',
        },
        // ปรับปรุง: โทนสี Light Theme
        light: {
          bg: '#e2e8f0',      // (เปลี่ยนจาก #f1f5f9) ใช้ Slate-200 เพื่อให้พื้นหลังเข้มขึ้น ตัดกับ Card ขาว
          card: '#ffffff',     // Card เป็นขาวล้วน
          border: '#94a3b8',   // เส้นขอบใช้ Slate-400 ให้เห็นชัด
          text: '#0f172a',     // ข้อความสีเข้มมาก (Slate-900)
          'text-secondary': '#475569', // ข้อความรอง (Slate-600)
        },
      },
      boxShadow: {
        card: '0 12px 28px rgba(0,0,0,.35)',
        'brand-soft': '0 8px 30px rgba(0,0,0,.4)',
        gold: '0 4px 18px rgba(201, 160, 103, .35)',
        'light-card': '0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.24)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      ring: {
        DEFAULT: '1px solid',
      },
      ringColor: ({ theme }) => ({
        white: 'rgb(255 255 255)',
        ...Object.entries(theme('opacity')).reduce((acc, [key, value]) => {
          acc[`white/${key}`] = `rgb(255 255 255 / ${value})`;
          return acc;
        }, {})
      }),
      backgroundColor: {
        'white/5': 'rgb(255 255 255 / 0.05)',
        'white/10': 'rgb(255 255 255 / 0.1)',
        'white/15': 'rgb(255 255 255 / 0.15)',
        'black/5': 'rgb(0 0 0 / 0.05)',
        'black/10': 'rgb(0 0 0 / 0.1)',
      },
      textColor: {
        'white/50': 'rgb(255 255 255 / 0.5)',
        'white/70': 'rgb(255 255 255 / 0.7)',
        'white/80': 'rgb(255 255 255 / 0.8)',
        'white/90': 'rgb(255 255 255 / 0.9)',
        'black/50': 'rgb(0 0 0 / 0.5)',
        'black/70': 'rgb(0 0 0 / 0.7)',
      },
    },
  },
  plugins: [
    function({ addUtilities, theme }) {
      const ringUtilities = {
        '.ring-white\\/15': {
          '--tw-ring-color': 'rgb(255 255 255 / 0.15)',
        },
        '.ring-white\\/10': {
          '--tw-ring-color': 'rgb(255 255 255 / 0.10)',
        },
      };
      addUtilities(ringUtilities);
    }
  ],
};