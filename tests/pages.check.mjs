// Every HTML page of the hub loads cro.js (site `hub`, France backend) as a classic script, and mesure.js where it is used.
// node tests/pages.check.mjs   (exit code 0 = ok, no dependency)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://script.google.com/macros/s/AKfycbzD1IRL8QALluKGZxgGiORFP6-DkC_qFJYR9aOxZiimxa06nbCqpzUI-9iLblp6V2VY/exec';
const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(e.name)) pages.push(p);
  }
})(root);
assert.ok(pages.length >= 6, 'pages found: ' + pages.length);
for (const p of pages) {
  const rel = path.relative(root, p), html = fs.readFileSync(p, 'utf8');
  const tags = html.match(/<script[^>]*\bsrc="[^"]*cro\.js"[^>]*>/g) || [];
  assert.equal(tags.length, 1, rel + ': one cro.js tag');
  const t = tags[0];
  assert.ok(!/type="module"/.test(t), rel + ': classic script');
  assert.ok(t.includes('data-site="hub"') && t.includes(`data-api="${API}"`) && t.includes('data-hosts="outils.vread.fr"'), rel + ': site/api/hosts');
  const src = t.match(/src="([^"]+)"/)[1];
  const file = src.startsWith('/') ? path.join(root, src) : path.join(path.dirname(p), src);
  assert.equal(path.relative(root, file), 'cro.js', rel + ': src resolves to /cro.js');
  if (html.includes('/mesure.js')) assert.ok(html.indexOf('/mesure.js') < html.indexOf(src), rel + ': cro.js after mesure.js');
  assert.ok(!/OCTAVE_XP\s*=\s*\[\s*\{/.test(html), rel + ': no A/B experiment on the hub');
}
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const id of ['hero', 'offres', 'gratuit', 'qui']) assert.match(index, new RegExp(`<section[^>]* id="${id}"`), 'section ' + id);
console.log(`pages: ok (${pages.length} pages load cro.js)`);
