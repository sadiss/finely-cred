import { defineConfig } from 'vite';

// Ensures the dev server serves THIS project (Finely Cred enhanced).
// Run from this folder: "Finely-Cred" — npm run dev
export default defineConfig({
  root: '.',
  server: {
    port: 5175,
    strictPort: true,
  },
  build: {
    // Keep warnings meaningful without blocking builds.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
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
