// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'dist',
        sourcemap: false,
        // ✅ Remove manualChunks or use function format
        rollupOptions: {
            output: {
                // ✅ Use function format instead of object
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react') || id.includes('react-dom')) {
                            return 'react-vendor';
                        }
                        if (id.includes('axios')) {
                            return 'axios-vendor';
                        }
                        return 'vendor';
                    }
                }
            }
        },
        // ✅ Or set chunk size warning limit higher
        chunkSizeWarningLimit: 1000,
    },
    server: {
        port: 5173,
        host: true,
    },
});