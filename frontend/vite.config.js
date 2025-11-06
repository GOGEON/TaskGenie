import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './setupTests.js',
  },
  define: {
    // React DevTools 경고 메시지 숨김
    __REACT_DEVTOOLS_GLOBAL_HOOK__: '({ isDisabled: true })'
  }
})
