import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000', // Adjust backend URL
      '/ws': 'http://localhost:5000', // Adjust backend WebSocket URL
    },
  },
})
