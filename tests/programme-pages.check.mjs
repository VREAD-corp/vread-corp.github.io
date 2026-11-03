// Pages of /programme-30-jours/ (Vread waiting list, price test A/B): generated, noindex, not linked, not in a sitemap,
// prices per version, verified claims only, pre-order flag off. node tests/programme-pages.check.mjs  (exit 0 = ok)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { pages, DIR, API, VERSIONS, EN_DIR, EN_PRICE, EN_CONSENT } from '../tools/programme-30-jours.mjs';

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

// 5b. English page: one price in dollars, no A/B, same backend with lang 'en', English legal page, linked only from the
//     English screen-time tool.
{
  const en = gen[`${EN_DIR}/index.html`], te = text(en), pv = gen[`${EN_DIR}/privacy/index.html`];
  assert.ok(en.includes('<html lang="en" data-version="en">'));
  assert.ok(en.includes(`<link rel="canonical" href="https://outils.vread.fr/${EN_DIR}/">`));
  assert.ok(!/OCTAVE_XP/.test(en) && !/OCTAVE_XP/.test(pv), 'no A/B test in English');
  assert.ok(te.includes(EN_PRICE + ' a year'), 'dollar price shown');
  assert.ok(!/€|79[.,]99|39,99/.test(te), 'one price only, in dollars');
  assert.ok(en.includes(`src="/${EN_DIR}/config.js`) && en.includes(`src="/${DIR}/p30.js`));
  assert.ok(en.includes(`src="/${DIR}/mesure.js`) && en.indexOf('/mesure.js') < en.indexOf('src="/cro.js"'));
  assert.ok(pv.includes(`src="/${DIR}/mesure.js`) && pv.includes('src="/cro.js"'), 'privacy page measured too');
  for (const id of ['hero', 'constat', 'comment', 'pourquoi', 'preuve', 'prix', 'faq']) assert.match(en, new RegExp(`<section[^>]* id="${id}"`), 'en: section ' + id);
  assert.equal((en.match(/data-open-form data-mesure="cta_click"/g) || []).length, 3, 'en: three sign-up buttons, measured');
  assert.match(en, /name="email" type="email"[^>]*required/);
  assert.match(en, /type="checkbox" name="consent" required/);
  assert.match(en, /name="website"[^>]*tabindex="-1"/);
  assert.ok(!en.includes('p30-precommande') && !en.includes('og-checkout.js'), 'no pre-order in English');
  assert.match(te, /More than 19,000 readers have started at least one book/);
  assert.match(te, /4\.7 out of 5 on the French App Store \(158 ratings\)/);
  assert.ok(en.includes('https://www.vread.fr/presse') && en.includes('October 29, 2026') && en.includes('centrenationaldulivre.fr') && /p\. 23/.test(en));
  assert.ok(!/27,?000|22,000|10 million/.test(en), 'only the figures of vread.fr/presse');
  assert.ok(en.includes(`href="/${EN_DIR}/privacy/"`) && pv.includes(EN_CONSENT));
  assert.ok(!/<a [^>]*href="\/programme-30-jours\//.test(en + pv), 'English pages do not send to the French ones');
  const cfg = { window: {} };
  vm.runInNewContext(read(`${EN_DIR}/config.js`), cfg);
  assert.equal(cfg.window.P30.precommande, false);
  assert.equal(cfg.window.P30.api, API);
  assert.equal(cfg.window.P30.consent, EN_CONSENT);
  assert.deepEqual(Object.keys(cfg.window.P30.produits), []);
  assert.ok(/lang: lang/.test(read(`${DIR}/p30.js`)), 'p30.js sends the page language');
  const tool = read('en/screen-time-to-books/index.html');
  assert.ok(tool.includes(`href="/${EN_DIR}/?utm_source=`), 'English tool links to the English page');
  for (const f of ['index.html', '404.html', 'a-propos/index.html', 'mentions-legales.html', 'informations-prospects/index.html', 'robots.txt', 'sitemap.xml', 'sitemap-hub.xml']) {
    assert.ok(!read(f).includes(EN_DIR), f + ' mentions ' + EN_DIR);
  }
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
