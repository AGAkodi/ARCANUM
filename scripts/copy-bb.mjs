// Copies @aztec/bb.js's prebuilt browser bundle into public/bb/.
//
// bb.js 0.87's browser bundle breaks when processed by Next's webpack
// ("Object.defineProperty called on non-object"), so the app loads it at
// runtime from /bb/index.js with webpackIgnore instead of bundling it.
// Runs on postinstall; public/bb is gitignored.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/@aztec/bb.js/dest/browser');
const dest = join(root, 'public/bb');

mkdirSync(dest, { recursive: true });
for (const file of readdirSync(src)) {
  cpSync(join(src, file), join(dest, file));
}
console.log(`Copied bb.js browser bundle -> public/bb (${readdirSync(src).length} files)`);
