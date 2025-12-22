import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://clinic-details-backend-5wsv.vercel.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
