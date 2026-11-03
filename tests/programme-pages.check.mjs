// Pages of /programme-30-jours/ (Vread waiting list, price test A/B): generated, noindex, not linked, not in a sitemap,
// prices per version, verified claims only, pre-order flag off. node tests/programme-pages.check.mjs  (exit 0 = ok)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { pages, DIR, API, VERSIONS } from '../tools/programme-30-jours.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// 1. Committed pages are the generator's output.
const gen = pages();
for (const [rel, html] of Object.entries(gen)) assert.equal(read(rel), html, rel + ' is stale: run node tools/programme-30-jours.mjs');

// 2. Every page: noindex, cro.js with this site's backend, no hub navigation.
for (const [rel, html] of Object.entries(gen)) {
  assert.ok(html.includes('<meta name="robots" content="noindex">'), rel + ': noindex until Tanguy validates');
  assert.ok(html.includes(`data-site="programme-30-jours" data-api="${API}"`), rel + ': cro.js site/api');
  assert.ok(!/href="\/"/.test(html) && !/href="https:\/\/outils\.vread\.fr\/"/.test(html), rel + ': no link to the hub');
  assert.ok(!/addictif/i.test(html), rel + ': never « addictif »');
}

// 3. Versions: price shown, own URL, own experiment variant, the same text otherwise.
for (const [v, { prix }] of Object.entries(VERSIONS)) {
  const html = gen[`${DIR}/${v}/index.html`];
  assert.ok(html.includes(`<html lang="fr" data-version="${v}">`));
  assert.ok(html.includes(`<link rel="canonical" href="https://outils.vread.fr/${DIR}/${v}/">`));
  assert.ok(html.includes(`window.OCTAVE_XP=[{id:'p30-prix',variants:['${v}']}]`));
  assert.ok(text(html).includes(prix + ' par an'), v + ': price shown');
  for (const [w, o] of Object.entries(VERSIONS)) if (w !== v) assert.ok(!html.includes(o.montant), v + ': never the other price');
  assert.ok(html.includes('src="/programme-30-jours/mesure.js') && html.indexOf('/mesure.js') < html.indexOf('src="/cro.js"'));
  for (const id of ['hero', 'constat', 'comment', 'pourquoi', 'preuve', 'prix', 'faq']) assert.match(html, new RegExp(`<section[^>]* id="${id}"`), v + ': section ' + id);
  assert.equal((html.match(/data-open-form data-mesure="cta_click"/g) || []).length, 3, v + ': three sign-up buttons, measured');
  assert.ok(html.includes('Je rejoins le programme de janvier'));
  // Form: e-mail, optional first name, consent box (required), honeypot.
  assert.match(html, /name="email" type="email"[^>]*required/);
  assert.match(html, /name="prenom" type="text"/);
  assert.ok(!/name="prenom"[^>]*required/.test(html));
  assert.match(html, /type="checkbox" name="consent" required/);
  assert.match(html, /name="website"[^>]*tabindex="-1"/);
}
const norm = (h) => h.replace(/data-version="[ab]"|\/[ab]\/"|variants:\['[ab]'\]|[37]9,99/g, '');
assert.equal(norm(gen[`${DIR}/a/index.html`]), norm(gen[`${DIR}/b/index.html`]), 'A and B differ only by the price');

// 4. Claims: what was checked stays sourced, what was not is absent.
const a = gen[`${DIR}/a/index.html`], ta = text(a);
assert.ok(!/27\s?000/.test(a), 'no « 27 000 lecteurs » (not published anywhere)');
assert.match(ta, /Plus de 19.000 lecteurs ont commencé au moins un livre/, 'reader count as published on vread.fr/presse');
assert.ok(a.includes('https://www.vread.fr/presse') && a.includes('relevés le 29 octobre 2026'));
assert.ok(a.includes('id="source-1"') && a.includes('centrenationaldulivre.fr') && /p\. 23/.test(a), 'CNL source of the −10 minutes');
assert.ok(a.includes('https://www.vread.fr/premium'), 'jokers and streak freezes sourced');
assert.ok(/<!-- Témoignage : emplacement vide/.test(a), 'testimonial slot is an HTML comment');
assert.ok(!/«[^»]*»\s*<\/p>\s*<p[^>]*>\s*(—|–)/.test(a) && !/class="(temoignage|testimonial)"/.test(a), 'no testimonial');

// 5. Not linked from the hub's pages, not in a sitemap, not in robots.txt. (Links from the other tools: checked by hand,
//    the brief of 2026-11-03 asks for none.)
for (const f of ['index.html', '404.html', 'a-propos/index.html', 'mentions-legales.html', 'informations-prospects/index.html', 'robots.txt', 'sitemap.xml', 'sitemap-hub.xml']) {
  assert.ok(!read(f).includes(DIR), f + ' mentions ' + DIR);
}

// 6. Pre-order: off; the payment module is vendored but never loaded while the flag is off.
const ctx = { window: {} };
vm.runInNewContext(read(`${DIR}/config.js`), ctx);
assert.equal(ctx.window.P30.precommande, false, 'pre-order stays off until validated');
assert.equal(ctx.window.P30.api, API);
assert.deepEqual(Object.keys(ctx.window.P30.produits), ['a', 'b']);
assert.equal(ctx.window.P30.produits.a.amount, 3999);
assert.equal(ctx.window.P30.produits.b.amount, 7999);
assert.ok(!a.includes('og-checkout.js'), 'no payment module in the page');
assert.ok(/C\.precommande === true/.test(read(`${DIR}/p30.js`)), 'module loaded only behind the flag');
assert.ok(!/checkout\/sessions/.test(read(`${DIR}/p30.js`) + read(`${DIR}/config.js`)), 'never a Checkout Session');
assert.ok(read(`${DIR}/mesure.js`).includes(API + '?action=track'));

console.log(`programme pages: ok (${Object.keys(gen).length} pages)`);
