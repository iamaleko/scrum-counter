import { defineConfig, loadEnv } from 'vite'
import glob from 'fast-glob';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

import react from '@vitejs/plugin-react'

function replaceEnvVars(globs, mode = 'production') {
  return {
    name: 'replace-env-vars',
    apply: 'build',
    closeBundle() {
      const files = glob.sync(globs);
      const env = loadEnv(mode, process.cwd(), '');
      for (let file of files) {
        file = resolve(__dirname, file);
        if (!file) continue;
        writeFileSync(
          file,
          readFileSync(file, 'utf-8')
            .replace(/%(VITE_\w+)%/g, (str, key) => env[key] || str)
        );
      }
    }
  }
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      replaceEnvVars(['dist/manifest.json'], mode),
    ],
    build: {
      sourcemap: true,
      rollupOptions: {
        input: ['panel.html', 'src/js/content.js', 'src/js/background.js'],
        output: [
          {
            entryFileNames: `assets/[name].js`,
            chunkFileNames: `assets/[name].js`,
            assetFileNames: `assets/[name].[ext]`,
          },
        ],
      },
    },
  }
})
