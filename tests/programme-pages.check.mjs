// Pages of /programme-30-jours/ (Vread waiting list): generated, noindex, not linked, not in a sitemap. Phase 1: one price,
// the app's (79 € a year, 14-day free trial), no A/B; /a/ and /b/ redirect with their utm. December price test prepared
// and off. Verified claims only, Tanguy's writing rules (2026-11-03), pre-order flag off. Also checks the reading pages,
// and « zéro santé » (Tanguy, 2026-11-04) on every public French page. The English programme page is gone (2026-11-04):
// its address only redirects to /en/screen-time-to-books/. node tests/programme-pages.check.mjs  (exit 0 = ok)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { pages, DIR, API, PRIX_APPLI, TEST_DECEMBRE, LIVRES, RAPPORT_HEBDO, PAGE_INDEXABLE } from '../tools/programme-30-jours.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const text = (html) => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// 1. Committed pages are the generator's output.
const gen = pages();
for (const [rel, html] of Object.entries(gen)) assert.equal(read(rel), html, rel + ' is stale: run node tools/programme-30-jours.mjs');

// 2. Every page: noindex, cro.js with this site's backend, no hub navigation.
for (const [rel, html] of Object.entries(gen)) {
  const indexed = PAGE_INDEXABLE && rel === `${DIR}/index.html`;
  assert.equal(html.includes('<meta name="robots" content="noindex">'), !indexed, rel + (indexed ? ': indexable (PAGE_INDEXABLE)' : ': noindex'));
  assert.ok(html.includes(`data-site="programme-30-jours" data-api="${API}"`), rel + ': cro.js site/api');
  assert.ok(!/href="\/"/.test(html) && !/href="https:\/\/outils\.vread\.fr\/"/.test(html), rel + ': no link to the hub');
  assert.ok(!/addictif/i.test(html), rel + ': never « addictif »');
}

// Zero health (Tanguy, 2026-11-04), even as a warning: none of these words on a public French page. Word starts only, so
// « intéressante » is not « santé ». A source whose title holds one of them is cited without its title, or removed.
const HEALTH = /(?<!\p{L})(m[ée]decin|sant[ée]|stress|sommeil|anxi|cerveau|c[ée]r[ée]br|dopamin|m[ée]moire|neuro|m[ée]latonine|brain)/iu;
const health = (rel, t) => { const m = t.match(HEALTH); assert.ok(!m, rel + ': health word « ' + (m && t.slice(Math.max(0, m.index - 40), m.index + 40)) + ' »'); };
// Writing rules (Tanguy, 2026-11-03) for the programme page and the reading pages: no health or brain promise, never
// « addictif », no AI in how the questions are made, « tu », never « la seule appli qui vérifie la lecture », no smaller
// competitor named, never « 27 000 lecteurs actifs », no old price.
const rules = (rel, t) => {
  health(rel, t);
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
  // Included in the app's annual subscription, no separate offer (Tanguy, 2026-11-04): hero, price box, FAQ.
  assert.ok(ta.includes('Le programme est compris dans l’abonnement annuel de l’appli : 79 € par an, avec 14 jours d’essai gratuit.'), 'hero: included');
  assert.ok(ta.includes('Le programme est compris dans l’abonnement annuel de l’appli Vread. Il n’y a pas d’offre à part.'), 'price box: included');
  assert.ok(ta.includes('Le programme est compris dans l’abonnement annuel de l’appli Vread : 79 € par an, avec 14 jours d’essai gratuit. Il n’y a pas d’offre à part.'), 'FAQ: included');
}
// Weekly e-mail report: shown while RAPPORT_HEBDO is true (waiting for Vincent), gone everywhere when it is false.
{
  assert.equal(typeof RAPPORT_HEBDO, 'boolean');
  assert.equal(/rapport/i.test(ta), RAPPORT_HEBDO, 'weekly report promise follows RAPPORT_HEBDO');
  for (const rapport of [true, false]) {
    const t = text(pages(TEST_DECEMBRE, { rapport })[`${DIR}/index.html`]);
    assert.equal(/rapport/i.test(t), rapport, 'rapport: ' + rapport);
    assert.equal(t.includes('Le rapport de la semaine, par e-mail.'), rapport);
    if (!rapport) assert.ok(t.includes('Ta série se compte en semaines. Dans l’appli, tu vois à quelle étape de ton livre tu en es.'));
    rules('rapport ' + rapport, t);
  }
  const idx = pages(TEST_DECEMBRE, { index: true });
  assert.ok(!idx[`${DIR}/index.html`].includes('name="robots"'), 'index: true drops noindex on the page');
  for (const rel of Object.keys(idx).filter((k) => k !== `${DIR}/index.html`)) assert.ok(idx[rel].includes('<meta name="robots" content="noindex">'), rel + ': stays noindex');
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

// 5. While PAGE_INDEXABLE is false: not linked from the hub's pages, not in a sitemap, not in robots.txt. When it is true:
//    in sitemap-hub.xml (the hub's other pages may then link to it).
for (const f of ['index.html', '404.html', 'a-propos/index.html', 'mentions-legales.html', 'informations-prospects/index.html', 'robots.txt', 'sitemap.xml', 'sitemap-hub.xml']) {
  if (!PAGE_INDEXABLE) assert.ok(!read(f).includes(DIR), f + ' mentions ' + DIR);
}
if (PAGE_INDEXABLE) assert.ok(read('sitemap-hub.xml').includes(`<loc>https://outils.vread.fr/${DIR}/</loc>`), 'indexable page: in the hub sitemap');
const READING = ['je-n-arrive-plus-a-lire', 'se-remettre-a-lire', 'lire-au-lieu-de-scroller', 'lire-plus-de-livres', 'un-livre-par-mois', 'quel-livre-pour-reprendre-la-lecture', 'defi-lecture-2027', 'club-de-lecture-entre-amis'];
for (const s of READING) {
  const h = read(`${s}/index.html`);
  assert.equal(h.includes(`href="/${DIR}/`), PAGE_INDEXABLE, s + (PAGE_INDEXABLE ? ': links to the programme page' : ': does not link to the programme page'));
}

// 5b. English programme page removed (Tanguy, 2026-11-04): no generated English page, no config, no privacy page; the
//     old address is a noindex meta-refresh redirect to the English screen-time tool, which links to the app stores.
{
  const EN_OLD = 'en/30-day-reading-program';
  assert.ok(!Object.keys(gen).some((k) => k.startsWith('en/')), 'the generator writes no English page');
  assert.deepEqual(fs.readdirSync(path.join(root, EN_OLD)), ['index.html'], 'only the redirect is left');
  const r = read(`${EN_OLD}/index.html`);
  assert.ok(r.includes('<meta name="robots" content="noindex">'));
  assert.ok(r.includes('<meta http-equiv="refresh" content="0; url=/en/screen-time-to-books/">'));
  assert.ok(r.includes('<link rel="canonical" href="https://outils.vread.fr/en/screen-time-to-books/">'));
  assert.ok(!/<form|\$74|price|program/i.test(text(r)), 'nothing of the old page');
  const tool = read('en/screen-time-to-books/index.html');
  assert.ok(!tool.includes(EN_OLD) && tool.includes('apps.apple.com/us/app/vread/id6752836822'), 'English tool links to the app stores');
  for (const f of ['index.html', '404.html', 'a-propos/index.html', 'mentions-legales.html', 'informations-prospects/index.html', 'robots.txt', 'sitemap.xml', 'sitemap-hub.xml', 'programme-30-jours/config.js']) {
    assert.ok(!read(f).includes(EN_OLD), f + ' mentions ' + EN_OLD);
  }
}

// 5c. Reading pages of 2026-11-03: same writing rules, no link to the programme (not opened until the founder agrees), app stores linked (the Lectoguide box, in « vous », is on the Lectoguide
//     site, not here).
for (const f of ['je-n-arrive-plus-a-lire/index.html', 'se-remettre-a-lire/index.html', 'lire-au-lieu-de-scroller/index.html', 'temps-ecran-en-livres/index.html']) {
  const h = read(f);
  rules(f, text(h));
  assert.ok(h.includes('apps.apple.com/fr/app/vread/id6752836822') && h.includes('play.google.com/store/apps/details?id=com.vread.app'), f + ': app stores linked');
}

// 5d. Reading pages of 2026-11-04 (lire plus, un livre par mois, quel livre pour reprendre): same writing rules, no link
//     to or mention of the programme, the tool and the app stores linked, listed in the hub sitemap.
for (const s of ['lire-plus-de-livres', 'un-livre-par-mois', 'quel-livre-pour-reprendre-la-lecture']) {
  const f = `${s}/index.html`, h = read(f);
  rules(f, text(h));
  if (!PAGE_INDEXABLE) assert.ok(!h.includes(DIR) && !/programme/i.test(text(h)), f + ': no link to or mention of the programme');
  assert.ok(!/jalonel/i.test(h), f + ': Vread brand only');
  assert.ok(h.includes('href="/temps-ecran-en-livres/"'), f + ': links to the tool');
  assert.ok(h.includes('https://apps.apple.com/fr/app/vread/id6752836822') && h.includes('https://play.google.com/store/apps/details?id=com.vread.app'), f + ': store links');
  assert.ok(h.includes(`<link rel="canonical" href="https://outils.vread.fr/${s}/">`), f + ': canonical');
  assert.ok(read('sitemap-hub.xml').includes(`<loc>https://outils.vread.fr/${s}/</loc>`), f + ': in the hub sitemap');
}

// 5d bis. Reading pages of 2026-11-05 (défi lecture 2027, club de lecture entre amis): same rules as 5d, store links with
//     ct/utm_campaign = the page's slug, no price but the app's (79 € a year), linked from the hub, the six other reading
//     pages' footers and each other.
for (const s of ['defi-lecture-2027', 'club-de-lecture-entre-amis']) {
  const f = `${s}/index.html`, h = read(f), t = text(h);
  rules(f, t);
  if (!PAGE_INDEXABLE) assert.ok(!h.includes(DIR) && !/programme/i.test(t), f + ': no link to or mention of the programme');
  assert.ok(!/jalonel/i.test(h) && !/href="https:\/\/(www\.)?vread\.fr\/[a-z]/.test(h), f + ': Vread brand only, no deep link to vread.fr');
  assert.ok(h.includes('href="/temps-ecran-en-livres/"'), f + ': links to the tool');
  assert.ok(h.includes(`https://apps.apple.com/fr/app/vread/id6752836822?pt=128157942&amp;ct=outils-${s}&amp;mt=8`), f + ': App Store ct');
  assert.ok(h.includes(`https://play.google.com/store/apps/details?id=com.vread.app&amp;referrer=utm_source%3Doutils.vread.fr%26utm_campaign%3D${s}`), f + ': Google Play utm');
  assert.equal((h.match(/data-mesure="cta_click"/g) || []).length, 2, f + ': two measured store buttons');
  assert.ok(!/€/.test(t) || (/79 € par an/.test(t) && !/(?<!79 )€/.test(t.replace(/79 € par an/g, ''))), f + ': no price but 79 € a year');
  assert.ok(h.includes(`<link rel="canonical" href="https://outils.vread.fr/${s}/">`), f + ': canonical');
  assert.ok(read('sitemap-hub.xml').includes(`<loc>https://outils.vread.fr/${s}/</loc>`), f + ': in the hub sitemap');
  assert.ok(read('index.html').includes(`href="/${s}/"`), f + ': linked from the hub');
  for (const o of READING) assert.ok(read(`${o}/index.html`).includes(`<li><a href="/${s}/">`), o + ': footer links to ' + s);
}
assert.ok(read('defi-lecture-2027/index.html').includes('href="/club-de-lecture-entre-amis/"') && read('club-de-lecture-entre-amis/index.html').includes('href="/defi-lecture-2027/"'), 'the two pages link to each other');

// 5e. Zero health on every public French page of the site (generated or not).
{
  const fr = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      if (e.name.startsWith('.') || ['node_modules', 'tools', 'tests', 'gas-programme-30-jours'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.html') && /<html lang="fr"/.test(read(rel))) fr.push(rel);
    }
  })('');
  assert.ok(fr.length >= 17, 'French pages found: ' + fr.length);
  for (const rel of fr) health(rel, text(read(rel)) + ' ' + (read(rel).match(/<meta[^>]+content="[^"]*"|<script type="application\/ld\+json">[\s\S]*?<\/script>|<title>[^<]*/g) || []).join(' '));
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
