import type { SSROptions, UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const ssr: SSROptions = {
  noExternal: /./,
  target: 'webworker'
}

const config: UserConfig = {
  plugins: [vue()],
  ssr
}

export default config
