import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // Required for Docker on Windows: bind mounts don't propagate file events,
      // so Vite won't hot-reload unless it polls for changes.
      usePolling: true,
    },
    host: true,
    allowedHosts: [
      'quaintance.tplinkdns.com',
      'home.quaintance.net',
    ],
    // Proxy API to backend when frontend uses relative /api/v1 (no VITE_API_URL)
    // Use 'backend' service name for Docker networking (Docker Compose creates internal DNS)
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
