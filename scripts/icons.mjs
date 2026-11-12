// Kumpulkan nama ikon Material Symbols yang dipakai di kode, agar font produksi hanya
// memuat ikon tersebut (±4 MB → puluhan KB). Dijalankan otomatis oleh `npm run build`.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const valid = new Set([...readFileSync('node_modules/material-symbols/index.d.ts', 'utf8').match(/"[a-z0-9_]+"/g).map((s) => s.slice(1, -1)), 'expand_more', 'insights', 'laptop']);
const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));
const used = new Set();

for (const file of [...files('resources/js'), ...files('app')]) {
    for (const [, name] of readFileSync(file, 'utf8').matchAll(/['"]([a-z0-9_]+)['"]/g)) if (valid.has(name)) used.add(name);
}

writeFileSync('resources/icons.txt', [...used].sort().join(','));
console.log(`icons.mjs: ${used.size} ikon dipakai`);
