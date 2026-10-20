// Kopiert transformers.js und die ONNX-Runtime nach vendor/, damit die Desktop-App offline startet.
// Läuft automatisch nach "npm install" (postinstall).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules', '@huggingface', 'transformers', 'dist');
const dest = path.join(root, 'vendor');
const files = [
  'transformers.min.js',
  'ort-wasm-simd-threaded.jsep.mjs',
  'ort-wasm-simd-threaded.jsep.wasm'
];

if (!fs.existsSync(src)) {
  console.log('[vendor] @huggingface/transformers nicht installiert, übersprungen.');
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const f of files) {
  fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
console.log(`[vendor] ${files.length} Dateien nach vendor/ kopiert.`);
