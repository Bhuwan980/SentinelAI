import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'caleb-oliguretic-nonreticently.ngrok-free.dev' // your ngrok URL
    ]
  }
})