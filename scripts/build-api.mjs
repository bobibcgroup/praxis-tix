/**
 * Bundle API routes that import from src/ so path alias @/ and ../src resolve in Vercel.
 * Outputs .js and removes the .ts so only the bundled handler is deployed (no duplicate routes).
 */
import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const apiRoutesToBundle = [
  'api/generate-outfits.ts',
  'api/generate-outfits-stream.ts',
  'api/interpret-intent.ts',
];

async function build() {
  for (const entry of apiRoutesToBundle) {
    const entryPath = path.join(root, entry);
    const out = entry.replace(/\.ts$/, '.js');
    await esbuild.build({
      entryPoints: [entryPath],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: path.join(root, out),
      alias: {
        '@': path.join(root, 'src'),
      },
      external: ['@vercel/node'],
    });
    console.log('Bundled', entry, '->', out);
    if (process.env.VERCEL === '1') {
      try {
        fs.unlinkSync(entryPath);
        console.log('Removed', entry);
      } catch (e) {
        console.warn('Could not remove', entry, e.message);
      }
    }
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
