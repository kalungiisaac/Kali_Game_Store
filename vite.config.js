import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: true
  }
})
