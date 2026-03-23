import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, 'src').replace(/\\/g, '/');

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${srcDir}/$1` },
    ],
  },
  server: {
    port: 3000,
  },
});
