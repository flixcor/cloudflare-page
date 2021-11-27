import type { UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const config: UserConfig = {
  plugins: [vue()],
  build: {
    emptyOutDir: false
  },
}

export default config
