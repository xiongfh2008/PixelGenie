import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        // Explicitly set the platform for Rollup
        external: [
          // Exclude platform-specific rollup modules that may cause issues
          '@rollup/rollup-linux-x64-gnu',
          '@rollup/rollup-win32-x64-msvc',
          '@rollup/rollup-darwin-x64',
          '@rollup/rollup-darwin-arm64'
        ],
        // Performance optimization
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      },
      // Performance optimizations
      minify: 'esbuild',
      sourcemap: mode === 'development',
      chunkSizeWarningLimit: 1000
    },
    define: {
      // Prevent "process is not defined" error in browser
      'process.env': {}
    },
    // Development server optimization
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },
    // Preview server optimization
    preview: {
      host: true,
      port: 4173
    }
  }
})