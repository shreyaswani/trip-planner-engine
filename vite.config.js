import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // Force Vite to use esbuild for minification instead of lightningcss
  build: {
    cssMinify: 'esbuild', 
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/, 
    exclude: [],
  }
})