import { fileURLToPath, URL } from 'node:url'
import process from 'node:process';
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  publicPath: process.env.NODE_ENV === "production" ? "/segmint-web3/frontend" : "/",
})
