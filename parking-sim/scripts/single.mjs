// Yığılmış dist/ qovluğunu tək HTML faylına çevirir (CSS və JS daxilə yerləşdirilir).
// Bu fayl telefonda linklə açmaq və ya istənilən yerə yükləmək üçündür.
// İstifadə: npm run build:single  →  dist/park-ustasi.html
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const read = (f) => readFileSync(join(DIST, f), 'utf8');
let html = read('index.html');
let js = '';

html = html
  .replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, f) => `<style>${read(f)}</style>`)
  .replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, f) => {
    js = read(f).replace(/<\/script/gi, '<\\/script');
    return '';
  })
  .replace('</body>', () => `<script type="module">${js}</script>\n</body>`);

writeFileSync(join(DIST, 'park-ustasi.html'), html);
console.log(`dist/park-ustasi.html: ${(html.length / 1024).toFixed(0)} KB`);
