import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: true,
        port: 8080,
        watch: {
            usePolling: true
        },
        proxy: {
            '/auth': {
                target: 'http://backend:3000',
                changeOrigin: true
            },
            '/items': {
                target: 'http://backend:3000',
                changeOrigin: true
            }
        }
    }
})
