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
  },
})
