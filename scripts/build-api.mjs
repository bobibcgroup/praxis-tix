/**
 * Bundle API routes that import from src/ so path alias @/ and ../src resolve in Vercel.
 * Outputs .js next to the .ts so Vercel runs the bundled .js (ignore the .ts via .vercelignore).
 */
import * as esbuild from 'esbuild';
import path from 'path';
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
    const out = entry.replace(/\.ts$/, '.js');
    await esbuild.build({
      entryPoints: [path.join(root, entry)],
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
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
