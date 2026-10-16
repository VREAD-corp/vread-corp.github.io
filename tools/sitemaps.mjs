// Single source for the root sitemap index (/sitemap.xml) and /robots.txt of outils.vread.fr.
// Every site published under outils.vread.fr/<repo>/ must be listed here, otherwise its sitemap is
// referenced by neither the index nor robots.txt and crawlers only learn about it from a manual submission.
// node tools/sitemaps.mjs          rewrite sitemap.xml and robots.txt
// (tests/sitemaps.check.mjs fails when the committed files differ from this list)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ORIGIN = 'https://outils.vread.fr';
// 2026-10-16: the sites not about reading and comprehension moved to the Jalonel brand (one subdomain each, hub
// https://jalonel.com/, repo VREAD-corp/jalonel-hub, which lists their sitemaps in its own robots.txt). Only the
// READ FRANCE reading offers stay here.
export const SITES = [
  'acquimetre', 'lu-et-retenu', 'civiclasse', 'lectoclasse', 'chapter-checks',
];
const sitemaps = [`${ORIGIN}/sitemap-hub.xml`, ...SITES.map((s) => `${ORIGIN}/${s}/sitemap.xml`)];

export const sitemapIndex = () => `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((u) => `  <sitemap><loc>${u}</loc></sitemap>`).join('\n')}
</sitemapindex>
`;

export const robots = () => `User-agent: *
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
${SITES.map((s) => `Sitemap: ${ORIGIN}/${s}/sitemap.xml`).join('\n')}
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemapIndex());
  fs.writeFileSync(path.join(root, 'robots.txt'), robots());
  console.log(`sitemap.xml + robots.txt: ${SITES.length} sites`);
}
