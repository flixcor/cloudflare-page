import type { SSROptions, UserConfig } from 'vite'
import baseConfig from './vite.config'

const ssr: SSROptions = {
  noExternal: /./,
  target: 'webworker'
}

const ssrConfig: UserConfig = {
  ...baseConfig,
  ssr
}

export default ssrConfig