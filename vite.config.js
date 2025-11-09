import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Ensure clean URLs for client-side routing
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'assets/[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        }
      }
    }
  },
  // Base URL for deployment (can be changed for subdirectories)
  base: './',
  // Ensure SPA fallback for client-side routing
  server: {
    open: true,
    historyApiFallback: true,
  },
  preview: {
    port: 4173,
  },
});