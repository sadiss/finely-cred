import { defineConfig } from 'vite';

// Ensures the dev server serves THIS project (Finely Cred enhanced).
// Run from this folder: "Finely-Cred" — npm run dev
export default defineConfig({
  root: '.',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  build: {
    // Keep warnings meaningful without blocking builds.
    chunkSizeWarningLimit: 900,
    // Gzip-sizing every chunk holds all output in memory at once; this box has 7.4 GB.
    reportCompressedSize: false,
    rollupOptions: {
      maxParallelFileOps: 2,
      output: {
        manualChunks: {
          // Heavyweight PDF tooling
          pdf: ['pdf-lib', 'pdfjs-dist'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});
