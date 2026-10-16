// /sitemap.xml (index) and /robots.txt are generated from tools/sitemaps.mjs and reference every site's sitemap.
// node tests/sitemaps.check.mjs   (exit code 0 = ok, no dependency)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { SITES, sitemapIndex, robots } from '../tools/sitemaps.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
assert.equal(new Set(SITES).size, SITES.length, 'no duplicate site');
for (const s of SITES) assert.match(s, /^[a-z0-9-]+$/, 'site slug ' + s);
assert.equal(read('sitemap.xml'), sitemapIndex(), 'sitemap.xml is stale: run node tools/sitemaps.mjs');
assert.equal(read('robots.txt'), robots(), 'robots.txt is stale: run node tools/sitemaps.mjs');
// hub sitemap: root URL with its trailing slash, W3C dates
const hub = read('sitemap-hub.xml');
assert.ok(hub.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'), 'hub sitemap header');
assert.ok(hub.includes('<loc>https://outils.vread.fr/</loc>'), 'hub root URL listed');
for (const [, d] of hub.matchAll(/<lastmod>([^<]*)<\/lastmod>/g)) assert.match(d, /^\d{4}-\d{2}-\d{2}$/, 'lastmod ' + d);
console.log(`sitemaps: ok (${SITES.length} sites in sitemap.xml and robots.txt)`);
