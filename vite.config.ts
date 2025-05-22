import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  css: {
    postcss: {
      plugins: [
        require('tailwindcss')({
          content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
          theme: {
            extend: {
              colors: {
                primary: {
                  50: '#EFF6FF',
                  100: '#DBEAFE',
                  200: '#BFDBFE',
                  300: '#93C5FD',
                  400: '#60A5FA',
                  500: '#3B82F6',
                  600: '#2563EB',
                  700: '#1D4ED8',
                  800: '#1E40AF',
                  900: '#1E3A8A',
                  950: '#172554',
                },
                secondary: {
                  50: '#ECFDF5',
                  100: '#D1FAE5',
                  200: '#A7F3D0',
                  300: '#6EE7B7',
                  400: '#34D399',
                  500: '#10B981',
                  600: '#059669',
                  700: '#047857',
                  800: '#065F46',
                  900: '#064E3B',
                  950: '#022C22',
                },
                accent: {
                  50: '#F5F3FF',
                  100: '#EDE9FE',
                  200: '#DDD6FE',
                  300: '#C4B5FD',
                  400: '#A78BFA',
                  500: '#8B5CF6',
                  600: '#7C3AED',
                  700: '#6D28D9',
                  800: '#5B21B6',
                  900: '#4C1D95',
                  950: '#2E1065',
                },
                success: {
                  50: '#F0FDF4',
                  500: '#22C55E',
                  700: '#15803D',
                },
                warning: {
                  50: '#FFFBEB',
                  500: '#F59E0B',
                  700: '#B45309',
                },
                error: {
                  50: '#FEF2F2',
                  500: '#EF4444',
                  700: '#B91C1C',
                }
              },
              fontFamily: {
                sans: ['Inter', 'sans-serif'],
              },
            },
          }
        })
      ]
    }
  }
})
