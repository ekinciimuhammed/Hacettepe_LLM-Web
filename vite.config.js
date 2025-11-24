import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['genethlialogical-significatively-roseanne.ngrok-free.dev'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/hacettepe-menu': {
        target: 'https://sksdb.hacettepe.edu.tr',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/hacettepe-menu/, ''),
      },
    },
  },
})
