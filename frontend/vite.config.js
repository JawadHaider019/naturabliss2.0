import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  cacheDir: 'node_modules/.vite_cache',
  base: "/",
  server: { port: 5174 },
  // Production builds run on Preact (React-compatible, ~4 KB instead of ~130 KB of react-dom),
  // which roughly halves the JavaScript work at page load on phones. The dev server keeps real
  // React so React DevTools and fast refresh behave as usual.
  resolve: command === 'build' ? {
    alias: {
      'react': 'preact/compat',
      'react-dom/test-utils': 'preact/test-utils',
      'react-dom/client': 'preact/compat/client',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime',
      'react/jsx-dev-runtime': 'preact/jsx-runtime',
    },
  } : {},
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          slick: ['react-slick', 'slick-carousel']
        }
      }
    }
  }
}))
