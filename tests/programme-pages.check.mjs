// Pages of /programme-30-jours/ (Vread waiting list): generated, noindex, not linked, not in a sitemap. Phase 1: one price,
// the app's (79 € a year, 14-day free trial), no A/B; /a/ and /b/ redirect with their utm. December price test prepared
// and off. Verified claims only, Tanguy's writing rules (2026-11-03), pre-order flag off. Also checks the reading pages
// that link to the programme. node tests/programme-pages.check.mjs  (exit 0 = ok)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { pages, DIR, API, PRIX_APPLI, TEST_DECEMBRE, LIVRES, EN_DIR, EN_PRICE, EN_CONSENT } from '../tools/programme-30-jours.mjs';

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

// Writing rules (Tanguy, 2026-11-03) for the programme page and the reading pages: no health or brain promise, never
// « addictif », no AI in how the questions are made, « tu », never « la seule appli qui vérifie la lecture », no smaller
// competitor named, never « 27 000 lecteurs actifs », no old price.
const rules = (rel, t) => {
  assert.ok(!/addicti/i.test(t), rel + ': never « addictif »');
  assert.ok(!/cerveau|c[ée]r[ée]br|neuro|dopamine|m[ée]latonine|sant[ée] mentale|bien-[êe]tre mental/i.test(t), rel + ': no brain or health claim');
  assert.ok(!/\b(vous|votre|vos)\b/i.test(t), rel + ': « tu », not « vous »');
  assert.ok(!/seule appli/i.test(t), rel + ': never « la seule appli »');
  assert.ok(!/\b(one sec|brick|opal|norma|jomo|clearspace|bookly|readwise|forest app)\b/i.test(t), rel + ': no competitor named');
  assert.ok(!/27[\s ]?000 (lecteurs|utilisateurs) actifs/i.test(t), rel + ': never « 27 000 lecteurs actifs »');
  assert.ok(!/39,99|79,99|39\.99/.test(t), rel + ': old prices');
};

// 3. Phase 1: one page, the app's price, no A/B; /a/ and /b/ redirect to it with the query string.
assert.equal(TEST_DECEMBRE.actif, false, 'December price test stays off until Tanguy sends the grid and says go');
assert.deepEqual(TEST_DECEMBRE.versions, { a: null, b: null }, 'no price for December before the grid');
assert.deepEqual([PRIX_APPLI.version, PRIX_APPLI.prix, PRIX_APPLI.essai], ['app', '79 €', '14 jours d’essai gratuit']);
const a = gen[`${DIR}/index.html`], ta = text(a);
{
  assert.ok(a.includes('<html lang="fr" data-version="app">'));
  assert.ok(a.includes(`<link rel="canonical" href="https://outils.vread.fr/${DIR}/">`));
  assert.ok(!/OCTAVE_XP/.test(a), 'no A/B test in phase 1');
  assert.ok(!/Math\.random|location\.replace/.test(a), 'the page is shown directly, no draw, no redirect');
  assert.ok(ta.includes('79 € par an, avec 14 jours d’essai gratuit'), 'price and trial shown');
  assert.match(a, /<p class="prix-montant">79\u00a0€ <span>par an<\/span><\/p>/);
  assert.ok(!/[0-9]+,[0-9]{2} €/.test(ta), 'one price only, no other amount');
  assert.ok(a.includes('src="/programme-30-jours/mesure.js') && a.indexOf('/mesure.js') < a.indexOf('src="/cro.js"'));
  for (const id of ['hero', 'constat', 'comment', 'pourquoi', 'livres', 'preuve', 'prix', 'faq']) assert.match(a, new RegExp(`<section[^>]* id="${id}"`), 'section ' + id);
  assert.equal((a.match(/data-open-form data-mesure="cta_click"/g) || []).length, 3, 'three sign-up buttons, measured');
  assert.ok(a.includes('Je rejoins le programme de janvier'));
  // Form unchanged: e-mail, optional first name, consent box (required), honeypot.
  assert.match(a, /name="email" type="email"[^>]*required/);
  assert.match(a, /name="prenom" type="text"/);
  assert.ok(!/name="prenom"[^>]*required/.test(a));
  assert.match(a, /type="checkbox" name="consent" required/);
  assert.match(a, /name="website"[^>]*tabindex="-1"/);
  rules(`${DIR}/index.html`, ta);
  assert.ok(!/\bIA\b|intelligence artificielle|Octave/.test(ta), 'no AI on the page');
}
for (const v of ['a', 'b']) {
  const r = gen[`${DIR}/${v}/index.html`];
  assert.ok(r.includes(`location.replace('/${DIR}/' + location.search + location.hash)`), v + ': redirect keeps utm and hash');
  assert.ok(r.includes(`<link rel="canonical" href="https://outils.vread.fr/${DIR}/">`), v + ': canonical is the page');
  assert.ok(r.includes(`<noscript><meta http-equiv="refresh" content="0; url=/${DIR}/"></noscript>`), v + ': works without JS');
  assert.ok(r.includes('<meta name="robots" content="noindex">'));
  assert.ok(!/€/.test(text(r)) && !/OCTAVE_XP|p30_version/.test(r), v + ': no price, no draw');
}

// 3b. December price test, prepared: with a grid it builds the draw page and two price pages (cro.js experiment), and
//     refuses to build without both prices.
{
  const grid = { ...TEST_DECEMBRE, actif: true, versions: { a: { prix: '59 €', montant: '59', essai: '14 jours d’essai gratuit' }, b: { prix: '99 €', montant: '99', essai: '' } } };
  const dec = pages(grid);
  assert.ok(/Math\.random\(\) < 0\.5 \? 'a' : 'b'/.test(dec[`${DIR}/index.html`]) && dec[`${DIR}/index.html`].includes("localStorage.setItem(k, v)"));
  for (const [v, other] of [['a', '99'], ['b', '59']]) {
    const h = dec[`${DIR}/${v}/index.html`];
    assert.ok(h.includes(`<html lang="fr" data-version="${v}">`));
    assert.ok(h.includes(`window.OCTAVE_XP=[{id:'${TEST_DECEMBRE.experience}',variants:['${v}']}]`));
    assert.ok(text(h).includes(grid.versions[v].prix + ' par an'), v + ': its price');
    assert.ok(!text(h).includes(other + ' €'), v + ': never the other price');
  }
  assert.ok(text(dec[`${DIR}/confidentialite/index.html`]).includes('p30_version'));
  assert.ok(!text(gen[`${DIR}/confidentialite/index.html`]).includes('p30_version'), 'phase 1: nothing kept in localStorage');
  assert.throws(() => pages({ ...TEST_DECEMBRE, actif: true }), /price missing/);
  assert.throws(() => pages({ ...grid, versions: { a: grid.versions.a, b: grid.versions.a } }), /same/);
}

// 4. Claims: what was checked stays sourced, what was not is absent.
assert.ok(ta.includes('19 794 lecteurs ont commencé un livre'), 'reader figure (Tanguy, 2026-11-03)');
assert.ok(ta.includes('13 804 livres y ont été terminés'));
assert.ok(ta.includes('Plus de 27 000 personnes s’y sont inscrites'));
assert.ok(!/27[\s ]?000 lecteurs/.test(ta));
assert.ok(a.includes('https://www.vread.fr/presse') && a.includes('au 3 novembre 2026'));
assert.ok(ta.includes('4,7 sur 5 sur l’App Store (160 notes)'));
assert.ok(a.includes('id="source-1"') && a.includes('centrenationaldulivre.fr') && /p\. 23/.test(a), 'CNL source of the −10 minutes');
// FAQ, exactly on Tanguy's facts: jokers skip a question; the streak counts in weeks; a freeze covers a missed week; one
// freeze every 7 correct answers, 2 in reserve at most.
assert.ok(ta.includes('Tu utilises un joker : il sert à passer une question.'));
assert.ok(ta.includes('Ta série se compte en semaines : une lecture validée dans la semaine suffit à la garder.'));
assert.ok(ta.includes('Si tu rates une semaine entière, un gel de série la couvre.'));
assert.ok(ta.includes('Tu gagnes un gel toutes les 7 bonnes réponses, et tu peux en garder 2 en réserve au maximum.'));
assert.ok(!/version gratuite|nombre limité de jokers|passer l’étape/.test(ta), 'old FAQ facts gone');
// First books (Tanguy, 2026-11-03).
assert.deepEqual(LIVRES.map((l) => l[0]), ['La Femme de ménage', 'La Psy', 'Harry Potter à l’école des sorciers', 'L’Étranger', '1984']);
for (const [t, au] of LIVRES) assert.ok(a.includes(`<em>${t}</em>, ${au}.`), "book " + t);
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
  assert.equal(EN_PRICE, '$74.99', 'US annual price of the app');
  assert.ok(te.includes(EN_PRICE + ' a year with a 14-day free trial'), 'dollar price shown');
  assert.ok(!/€|79[.,]99|39[.,]99/.test(te) && !/79[.,]99|39[.,]99/.test(text(pv)), 'one price only, in dollars');
  assert.ok(te.includes('Your streak counts in weeks: one validated reading session in the week is enough to keep it.'));
  assert.ok(te.includes('You earn a freeze every 7 correct answers, and you can keep up to 2 in reserve.'));
  assert.ok(te.includes('Use a joker: it lets you skip a question.'));
  assert.ok(!/addicti|brain|dopamine|the only app/i.test(te), 'en: writing rules');
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

// 5c. Reading pages that link to the programme: same writing rules (the Lectoguide box, in « vous », is on the Lectoguide
//     site, not here).
for (const f of ['je-n-arrive-plus-a-lire/index.html', 'se-remettre-a-lire/index.html', 'lire-au-lieu-de-scroller/index.html', 'temps-ecran-en-livres/index.html']) {
  const h = read(f);
  rules(f, text(h).replace(/« Brain Drain »|Reexamining the “brain drain” effect/g, ''));
  assert.ok(h.includes(`href="/${DIR}/?utm_source=`), f + ': links to the programme page with utm');
}

// 6. Pre-order: off; the payment module is vendored but never loaded while the flag is off; no product before December.
const ctx = { window: {} };
vm.runInNewContext(read(`${DIR}/config.js`), ctx);
assert.equal(ctx.window.P30.precommande, false, 'pre-order stays off until validated');
assert.equal(ctx.window.P30.api, API);
assert.deepEqual(Object.keys(ctx.window.P30.produits), [], 'no product before the December grid');
assert.ok(!/39,99|79,99|3999|7999/.test(read(`${DIR}/config.js`)), 'old prices gone from the config');
assert.ok(!a.includes('og-checkout.js'), 'no payment module in the page');
assert.ok(/C\.precommande === true/.test(read(`${DIR}/p30.js`)), 'module loaded only behind the flag');
assert.ok(!/checkout\/sessions/.test(read(`${DIR}/p30.js`) + read(`${DIR}/config.js`)), 'never a Checkout Session');
assert.ok(read(`${DIR}/mesure.js`).includes(API + '?action=track'));

console.log(`programme pages: ok (${Object.keys(gen).length} pages)`);
