import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/sistema-brm',
        changeOrigin: true,
        secure: false
      },
      '/gotenberg-api': {
        target: 'https://sitebrm-gotenberg.ryk9yi.easypanel.host',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/gotenberg-api/, ''),
        secure: false
      }
    }
  }
})
