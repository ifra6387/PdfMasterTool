import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './client/src'),
      '@assets': path.resolve(process.cwd(), './attached_assets'),
    },
  },
  root: './client',
  build: {
    outDir: '../dist/public',
    rollupOptions: {
      input: {
        main: path.resolve(process.cwd(), './client/index.html'),
      },
    },
  },
});