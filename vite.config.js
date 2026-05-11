import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Inline small assets (<= 4kb) directly into JS to save HTTP requests
    assetsInlineLimit: 4096,
    // Suppress source maps in production for faster build + smaller output
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor code into parallel-loadable chunks
        manualChunks: {
          // Core React runtime — loaded first, cached longest
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Data-fetching layer
          'vendor-query': ['@tanstack/react-query', 'axios'],
          // Charts — heavy, only needed on Dashboard
          'vendor-charts': ['recharts'],
          // Calendar — heavy, only needed on Dashboard
          'vendor-calendar': ['react-big-calendar', 'moment', 'date-fns'],
          // Radix UI components — medium weight, used everywhere
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
          ],
          // Icons — tree-shaken but still substantial
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Warn on chunks > 500kb (default is 500kb anyway, making it explicit)
    chunkSizeWarningLimit: 500,
  },
})

