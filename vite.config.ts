import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/LL2LO/'
  // No proxy needed - Anthropic supports CORS with 'anthropic-dangerous-direct-browser-access: true' header
})
