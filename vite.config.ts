import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    cssTarget: 'chrome87',
    rollupOptions: {
      output: {
        manualChunks: {
          gsap: ['gsap'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
  },
  server: { host: true, port: 5180 },
})
