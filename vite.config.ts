import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    emptyOutDir: false,
    ssr: {
      target: 'webworker'
    },
    rollupOptions: {
      input: './src/entry-server.ts'
    }
  }
})
