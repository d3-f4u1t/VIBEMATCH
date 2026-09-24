import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    hmr: { clientPort: 5173 },
  },
  build: {
    target: 'es2019',
    cssMinify: true,
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/react")) return "vendor";
          if (id.includes("node_modules/react-dom")) return "vendor";
          if (id.includes("node_modules/react-router")) return "vendor";
          return undefined;
        },
      },
    },
  },
})
