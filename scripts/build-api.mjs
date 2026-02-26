/**
 * Bundle API routes that import from src/ so path alias @/ and ../src resolve in Vercel.
 * Outputs .js then overwrites .ts with a stub that re-exports the .js (file stays so Vercel finds it).
 */
import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const apiRoutesToBundle = [
  { entry: 'api/generate-outfits.ts', stub: "export { default } from './generate-outfits.js';\n" },
  { entry: 'api/generate-outfits-stream.ts', stub: "export { default, config } from './generate-outfits-stream.js';\n" },
  { entry: 'api/interpret-intent.ts', stub: "export { default } from './interpret-intent.js';\n" },
  { entry: 'api/biometrics/session/start.ts', stub: "export { default } from './start.js';\n" },
  { entry: 'api/biometrics/session/face.ts', stub: "export { default } from './face.js';\n" },
  { entry: 'api/biometrics/session/body.ts', stub: "export { default } from './body.js';\n" },
  { entry: 'api/biometrics/session/finalize.ts', stub: "export { default } from './finalize.js';\n" },
  { entry: 'api/biometrics/session/result.ts', stub: "export { default } from './result.js';\n" },
  { entry: 'api/biometrics-session-start.ts', stub: "export { default } from './biometrics-session-start.js';\n" },
  { entry: 'api/biometrics-session-face.ts', stub: "export { default } from './biometrics-session-face.js';\n" },
  { entry: 'api/biometrics-session-body.ts', stub: "export { default } from './biometrics-session-body.js';\n" },
  { entry: 'api/biometrics-session-finalize.ts', stub: "export { default } from './biometrics-session-finalize.js';\n" },
  { entry: 'api/biometrics-session-result.ts', stub: "export { default } from './biometrics-session-result.js';\n" },
  { entry: 'api/biometrics.ts', stub: "export { default } from './biometrics.js';\n" },
];

async function build() {
  for (const { entry, stub } of apiRoutesToBundle) {
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
        fs.writeFileSync(entryPath, stub, 'utf8');
        console.log('Wrote stub', entry);
      } catch (e) {
        console.warn('Could not write stub', entry, e.message);
      }
    }
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
