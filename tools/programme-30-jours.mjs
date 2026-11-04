// Generates the pages of the « 30 jours pour refinir un livre » waiting list (Vread, READ FRANCE SAS).
// Phase 1 (from 2026-11-03, Tanguy's answer of that day): one price, the app's annual price in France, 79 € a year with a
// 14-day free trial. No A/B test.
//   programme-30-jours/index.html             the page (version 'app')
//   programme-30-jours/a/, programme-30-jours/b/   redirect to /programme-30-jours/, keeping the query string (utm) and hash
// Phase 2 (December 2026): two prices on the best ad message, on a grid Tanguy sets at the end of November. Prepared in
// TEST_DECEMBRE below, OFF. When actif is true: index.html draws a or b (kept in localStorage p30_version) and redirects,
// /a/ and /b/ show their own price, cro.js experiment TEST_DECEMBRE.experience.
//   programme-30-jours/confidentialite/       privacy notice of this list
//   programme-30-jours/mentions-legales/      legal notice (READ FRANCE SAS)
// The English page /en/30-day-reading-program/ was removed on 2026-11-04 (Tanguy: « supprime-la »). Its address is now a
// hand-written redirect (meta refresh, noindex) to the English screen-time tool /en/screen-time-to-books/.
// node tools/programme-30-jours.mjs   (tests/programme-pages.check.mjs fails if the committed pages differ)
// The programme is included in the app's annual subscription (Tanguy, 2026-11-04), no separate offer.
// Not linked from the hub or the reading pages, noindex, not in any sitemap, not sent to IndexNow while PAGE_INDEXABLE is
// false (see below).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR = 'programme-30-jours';
export const API = 'https://script.google.com/macros/s/AKfycbxXW-9xz90F1nalrIOMIVU9RarjRHTa1zb8F-ajfVIESYEfg5Ec1y4PyObDjz7HL9OA/exec';
// App prices in France, read by Tanguy in the App Store and the Play Store on 2026-11-03: annual 79 € (14-day free
// trial), monthly 9,99 €, weekly 4,99 €, lifetime 149 € (149,99 € on Android). Phase 1 shows the annual price only.
export const PRIX_APPLI = { version: 'app', prix: '79 €', montant: '79', essai: '14 jours d’essai gratuit' };
// December price test. Do NOT switch on before Tanguy has sent the grid (end of November) and written « go ». To switch on:
//   1. versions.a and versions.b = { prix: '<n> €', montant: '<n>', essai: '<texte ou chaîne vide>' } (the grid);
//   2. actif: true, then npm run programme && npm test;
//   3. gas-programme-30-jours/src/App.js: the two versions and prices (APP.decembre), then bash gas-programme-30-jours/scripts/deploy.sh;
//   4. programme-30-jours/config.js: products only if the paid pre-order is validated (web payment + consumer mediator).
export const TEST_DECEMBRE = {
  actif: false,
  experience: 'p30-prix-dec',
  versions: { a: null, b: null },
};
const BASE = 'https://outils.vread.fr/' + DIR + '/';
const CNL = 'https://centrenationaldulivre.fr/sites/default/files/2025-04/Barom%C3%A8tre%20Les%20Fran%C3%A7ais%20et%20la%20lecture%20Synth%C3%A8se%202025-04-08.pdf';
const ASSET_V = '2026-11-03d';
// Weekly e-mail report promised on the page (« Un rapport par e-mail… », « Le rapport de la semaine, par e-mail. »).
// Waits for Vincent's answer (the app's weekly summary); Tanguy, 2026-11-04: without a clear answer on 6 November, remove
// the promise. To remove it: false, then npm run programme && npm test.
export const RAPPORT_HEBDO = true;
// The page /programme-30-jours/ in search engines. false: noindex, no link from the hub or the reading pages, not in a
// sitemap, not sent to IndexNow. true (after the weekly-report decision above): the page drops noindex, and npm test then
// requires its URL in sitemap-hub.xml and a link to it from the six reading pages (send the URL to IndexNow afterwards).
// The legal pages and the /a/ /b/ redirects stay noindex.
export const PAGE_INDEXABLE = false;

/** French typography in text nodes only: non-breaking space before ; : ! ? » and after «, and inside « 79 € ». */
function fr(html) {
  let inRaw = false;
  return html.split(/(<[^>]+>)/).map((part) => {
    if (part.startsWith('<')) {
      if (/^<(script|style)\b/i.test(part)) inRaw = true;
      if (/^<\/(script|style)>/i.test(part)) inRaw = false;
      return part;
    }
    if (inRaw) return part;
    return part.replace(/ ([;:!?»€])/g, ' $1').replace(/« /g, '« ').replace(/(\d) (h|min)\b/g, '$1 $2');
  }).join('');
}

const head = ({ title, desc, canonical, version, extraHead = '', index = false }) => `<!doctype html>
<html lang="fr"${version ? ` data-version="${version}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${index ? '' : '<meta name="robots" content="noindex">\n'}<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="Vread">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/${DIR}/p30.css?v=${ASSET_V}">
${extraHead}</head>`;

const topbar = `<a class="skip" href="#contenu">Aller au contenu</a>
<header class="topbar"><div class="wrap">
  <span class="wm-static">Vread <span>· programme 30 jours</span></span>
</div></header>`;

const footer = `<footer><div class="wrap">
  <p>Vread est une appli de lecture de READ FRANCE SAS (SIREN 988 741 773), 11 rue Rouvet, 75019 Paris, fondée par Tanguy Warsmann. Mesure d’audience anonyme et agrégée, sans cookie.</p>
  <nav aria-label="Pied de page"><a href="/${DIR}/confidentialite/">Confidentialité de la liste</a><a href="/${DIR}/mentions-legales/">Mentions légales</a><a href="mailto:octave@vread.fr">Contact : octave@vread.fr</a></nav>
</div></footer>`;

// xp: cro.js experiment id (December price test only); '' = no experiment.
const scripts = (version, xp) => `${xp ? `<script>window.OCTAVE_XP=[{id:'${xp}',variants:['${version}']}];</script>\n` : ''}<script src="/${DIR}/mesure.js?v=${ASSET_V}" defer></script>
<script src="/cro.js" data-site="programme-30-jours" data-api="${API}" data-hosts="outils.vread.fr" data-cta="[data-open-form]" defer></script>`;

const cta = (where) => `<a class="btn" href="#inscription" data-open-form data-mesure="cta_click" data-detail="${where}">Je rejoins le programme de janvier</a>`;

// Premiers livres conseillés (Tanguy, 2026-11-03) : tous ont leurs questions dans Vread.
export const LIVRES = [
  ['La Femme de ménage', 'Freida McFadden', 'Parmi les livres les plus terminés dans Vread.'],
  ['La Psy', 'Freida McFadden', 'Même autrice, et lui aussi parmi les plus terminés dans Vread.'],
  ['Harry Potter à l’école des sorciers', 'J. K. Rowling', 'Le premier tome de la série.'],
  ['L’Étranger', 'Albert Camus', '150 pages : le plus court des cinq.'],
  ['1984', 'George Orwell', 'Le roman du télécran, l’écran qu’on ne peut pas éteindre. De circonstance.'],
];

/** The programme page. o: { version, prix, montant, essai, path ('' for /programme-30-jours/, 'a/' or 'b/'), xp, rapport, index }. */
function landing(o) {
  const { version, prix, essai, path: sub, xp, rapport = RAPPORT_HEBDO, index = false } = o;
  const prixLong = `${prix} par an${essai ? `, avec ${essai}` : ''}`;
  // Tanguy, 2026-11-04: the programme is included in the app's annual subscription, no separate offer (phase 1 price).
  const inclus = version === 'app';
  const title = 'Tu n’arrives plus à finir un livre ? Le programme Vread de 30 jours';
  const desc = `20 minutes par jour, une preuve à chaque étape, un livre fini en 30 jours. Ouverture en janvier 2027 : ${prixLong}. Inscris-toi pour être prévenu.`;
  return fr(`${head({ title, desc, canonical: BASE + sub, version, index, extraHead: `<script src="/${DIR}/config.js?v=${ASSET_V}"></script>\n` })}
<body class="p30">
${topbar}
<main id="contenu">
<div class="wrap">
  <section class="p30-hero" id="hero" aria-labelledby="h1">
    <div>
      <p class="eyebrow">Vread · programme de janvier 2027</p>
      <h1 id="h1">Tu n’arrives plus à finir un livre ? <span>Ton téléphone y est pour beaucoup.</span></h1>
      <p class="lead">20 minutes par jour, une preuve à chaque étape, un livre fini en 30 jours.</p>
      <div class="cta-row">${cta('hero')}</div>
      <p class="note">Ouverture en janvier 2027${inclus ? '. Le programme est compris dans l’abonnement annuel de l’appli' : ''} : ${prixLong}. Rien à payer aujourd’hui.</p>
      <noscript><p class="note">Ce formulaire a besoin de JavaScript. Tu peux aussi écrire à <a href="mailto:octave@vread.fr">octave@vread.fr</a> pour être prévenu.</p></noscript>
    </div>
    <figure class="step-card">
      <p class="book"><strong>La Femme de ménage</strong><span>Étape 7 sur 10</span></p>
      <div class="bar" aria-hidden="true"><i></i></div>
      <p class="ask">Sur le passage que tu viens de lire</p>
      <p class="question">Comment se prénomme le jardinier italien que Millie rencontre devant le portail de la propriété Winchester ?</p>
      <div class="answer" aria-hidden="true"><span>Ta réponse, en un mot</span><b>Valider</b></div>
      <figcaption>Une étape dans l’appli Vread, reconstituée d’après l’exemple publié sur vread.fr : La Femme de ménage, de Freida McFadden, 10 questions sur 310 pages.</figcaption>
    </figure>
  </section>
</div>

<section class="band soft" id="constat" aria-labelledby="h-constat"><div class="wrap constat">
  <p class="chiffre">−10 min <small>de lecture de livres par jour entre 2023 et 2025<sup><a href="#source-1" aria-label="Source 1">1</a></sup></small></p>
  <div class="narrow">
    <h2 id="h-constat">En deux ans, les Français ont perdu 10 minutes de lecture par jour</h2>
    <p>En janvier 2025, les Français de 15 ans et plus lisaient des livres 31 minutes par jour en moyenne sur leur temps de loisirs, contre 41 minutes en 2023. Sur ce même temps libre, ils passaient 3 h 21 par jour devant un écran.<sup><a href="#source-1">1</a></sup></p>
    <p>Le manque de volonté n’explique pas tout : ton téléphone est conçu pour te garder.</p>
  </div>
</div></section>

<section class="band" id="comment" aria-labelledby="h-comment"><div class="wrap">
  <h2 id="h-comment">Comment ça marche</h2>
  <ol class="etapes">
    <li><strong>Tu lis où tu veux : papier, liseuse, peu importe.</strong><span>L’audio marche aussi. Vread ne remplace pas ton livre, l’appli suit ta lecture.</span></li>
    <li><strong>À chaque étape, une question prouve que tu as lu et compris.</strong><span>Une étape fait 30 à 40 pages, et la réponse tient en un mot.</span></li>
    ${rapport
    ? '<li><strong>Ta série se compte en semaines, et chaque semaine tu vois le chemin parcouru.</strong><span>Un rapport par e-mail te donne tes minutes de lecture validée, tes pages et où tu en es dans ton livre.</span></li>'
    : '<li><strong>Ta série se compte en semaines.</strong><span>Dans l’appli, tu vois à quelle étape de ton livre tu en es.</span></li>'}
  </ol>
</div></section>

<section class="band soft pourquoi" id="pourquoi" aria-labelledby="h-pourquoi"><div class="wrap">
  <h2 id="h-pourquoi">Pourquoi ça marche</h2>
  <blockquote><p>Bloquer tes applis ne suffit pas : il faut quelque chose à mettre à la place. Les bloqueurs t’enlèvent du temps d’écran. Vread te rend des livres.</p></blockquote>
</div></section>

<section class="band" id="programme" aria-labelledby="h-programme"><div class="wrap">
  <h2 id="h-programme">Ce que contient le programme</h2>
  <ul class="contenu">
    <li>Un objectif tenable : 20 minutes de lecture par jour, un livre fini en 30 jours.</li>
    <li>Un premier livre conseillé, prenant et faisable en 30 jours à ce rythme, avec ses questions dans l’appli.</li>
    <li>La preuve que tu avances : les questions valident chaque étape, ta série montre ta régularité.</li>
${rapport ? '    <li>Le rapport de la semaine, par e-mail.</li>\n' : ''}  </ul>
</div></section>

<section class="band soft" id="livres" aria-labelledby="h-livres"><div class="wrap">
  <h2 id="h-livres">Par quel livre commencer</h2>
  <p>Cinq livres qu’on te conseille pour ton premier mois. Tous ont leurs questions dans Vread.</p>
  <ul class="contenu livres">
${LIVRES.map(([t, a, n]) => `    <li><strong><em>${t}</em>, ${a}.</strong> ${n}</li>`).join('\n')}
  </ul>
</div></section>

<section class="band" id="preuve" aria-labelledby="h-preuve"><div class="wrap narrow">
  <h2 id="h-preuve">Vread aujourd’hui</h2>
  <p>19 794 lecteurs ont commencé un livre dans Vread, et 13 804 livres y ont été terminés, une question après l’autre. Plus de 27 000 personnes s’y sont inscrites. L’appli a 4,7 sur 5 sur l’App Store (160 notes).</p>
  <p class="fine2">Chiffres de Vread au 3 novembre 2026 (ordres de grandeur publiés sur <a href="https://www.vread.fr/presse">vread.fr/presse</a>). Note de l’App Store relevée le même jour.</p>
  <!-- Témoignage : emplacement vide. Aucun témoignage d’ancien lecteur n’a encore été recueilli (à faire lors des appels utilisateurs).
       N’ajouter qu’un témoignage réel, avec l’accord écrit de la personne, son prénom et ce qu’elle a lu. -->
</div></section>

<section class="band soft" id="prix" aria-labelledby="h-prix"><div class="wrap">
  <h2 id="h-prix">Le prix</h2>
  <div class="prix-box">
    <p class="prix-montant">${prix} <span>par an</span></p>
${essai ? `    <p class="prix-essai"><strong>${essai[0].toUpperCase() + essai.slice(1)}</strong></p>\n` : ''}${inclus ? '    <p><strong>Le programme est compris dans l’abonnement annuel de l’appli Vread.</strong> Il n’y a pas d’offre à part.</p>\n' : ''}    <p>Ouverture en janvier. Inscris-toi, on te prévient le premier jour.</p>
    ${cta('prix')}
    <p class="fine2">Rien à payer aujourd’hui et aucun engagement : l’inscription sert seulement à te prévenir. Prix annoncé pour l’ouverture, toutes taxes comprises.</p>
    <div id="p30-precommande" hidden>
      <p><strong>Ou pré-commande dès maintenant, ${prix}.</strong> Tu es remboursé en entier sur simple demande jusqu’à l’ouverture, et d’office si le programme n’a pas ouvert le 31 janvier 2027.</p>
      <a class="btn ghost" href="#p30-pay" data-precommande data-mesure="cta_click" data-detail="precommande">Pré-commander, ${prix}</a>
      <div id="p30-pay"></div>
    </div>
  </div>
</div></section>

<section class="band faq" id="faq" aria-labelledby="h-faq"><div class="wrap">
  <h2 id="h-faq">Questions</h2>
  <details id="q-papier"><summary>Je lis sur papier, ça marche ?</summary><p>Oui. Tu lis sur ton support, papier, liseuse ou audio, et tu réponds aux questions dans l’appli.</p></details>
  <details id="q-temps"><summary>Combien de temps par jour ?</summary><p>20 minutes. Les livres conseillés se finissent en 30 jours à ce rythme.</p></details>
  <details id="q-rate"><summary>Et si je rate un jour, ou une semaine ?</summary><p>Ta série se compte en semaines : une lecture validée dans la semaine suffit à la garder. Si tu rates une semaine entière, un gel de série la couvre. Tu gagnes un gel toutes les 7 bonnes réponses, et tu peux en garder 2 en réserve au maximum.</p></details>
  <details id="q-joker"><summary>Et si une question me bloque ?</summary><p>Tu utilises un joker : il sert à passer une question.</p></details>
  <details id="q-prix"><summary>Combien ça coûte ?</summary><p>${inclus ? `Le programme est compris dans l’abonnement annuel de l’appli Vread : ${prixLong}. Il n’y a pas d’offre à part.` : `${prixLong}.`} Rien n’est à payer aujourd’hui : tu reçois un e-mail à l’ouverture, et tu décides à ce moment-là.</p></details>
  <details id="q-ouverture"><summary>Quand le programme ouvre-t-il ?</summary><p>En janvier 2027. Tu reçois un e-mail le jour de l’ouverture.</p></details>
  <details id="q-donnees"><summary>Que devient mon adresse e-mail ?</summary><p>Elle sert seulement à te prévenir de l’ouverture. Elle n’est reliée ni à l’appli Vread ni à un compte. Le détail est sur la page <a href="/${DIR}/confidentialite/">confidentialité de la liste</a>.</p></details>
</div></section>

<div class="wrap">
  <div class="band sources" id="sources">
    <p id="source-1">1. Centre national du livre et Ipsos, <a href="${CNL}">« Les Français et la lecture », baromètre 2025, synthèse</a> (8 avril 2025), enquête par téléphone auprès de 1 001 personnes de 15 ans et plus en janvier 2025 : 31 minutes par jour consacrées à la lecture de livres dans le cadre des loisirs, 10 de moins qu’en 2023 (p. 23) ; 3 h 21 par jour devant un écran sur le temps libre (p. 45).</p>
    <p>Série, gels de série et jokers : règles de l’appli Vread au 3 novembre 2026 (voir aussi <a href="https://www.vread.fr/premium">vread.fr/premium</a>). Prix : abonnement annuel de l’appli Vread en France, relevé dans l’App Store et le Play Store le 3 novembre 2026${inclus ? ' ; le programme est compris dans cet abonnement (Tanguy Warsmann, fondateur, 4 novembre 2026)' : ''}.</p>
  </div>
  <p>${cta('bas')}</p>
</div>
</main>

<dialog class="p30-dialog" id="inscription" aria-labelledby="h-form">
  <div class="inner">
    <button class="x" type="button" data-close-form aria-label="Fermer">×</button>
    <h2 id="h-form">Rejoindre le programme de janvier</h2>
    <p>On t’écrit le jour de l’ouverture, en janvier 2027, avec le prix : ${prixLong}. Rien à payer aujourd’hui.</p>
    <form id="p30-form" novalidate>
      <label for="p30-email">Ton e-mail</label>
      <input id="p30-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254">
      <label for="p30-prenom">Ton prénom <small>(facultatif)</small></label>
      <input id="p30-prenom" name="prenom" type="text" autocomplete="given-name" maxlength="40">
      <div class="hp" aria-hidden="true"><label for="p30-website">Ne pas remplir</label><input id="p30-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <label class="consent"><input type="checkbox" name="consent" required> <span>J’accepte que READ FRANCE SAS garde mon adresse pour me prévenir par e-mail de l’ouverture du programme. Je peux retirer mon accord quand je veux (<a href="/${DIR}/confidentialite/" target="_blank" rel="noopener">confidentialité de la liste</a>).</span></label>
      <button class="btn" type="submit">Je m’inscris</button>
    </form>
    <p id="p30-msg" class="p30-msg" role="status" aria-live="polite"></p>
  </div>
</dialog>

${footer}
<script src="/${DIR}/p30.js?v=${ASSET_V}" defer></script>
${scripts(version, xp)}
</body>
</html>
`);
}

/** December only (TEST_DECEMBRE.actif): draws a or b, keeps it in this browser, redirects to the version's page. */
function chooser() {
  return fr(`${head({ title: 'Programme Vread de 30 jours pour refinir un livre', desc: '20 minutes par jour, une preuve à chaque étape, un livre fini en 30 jours. Ouverture en janvier 2027.', canonical: BASE,
    extraHead: `<script>
// Une version de prix au hasard (a ou b), gardée dans ce navigateur pour les visites suivantes, puis la page de la version.
(function () {
  var k = 'p30_version', v;
  try { v = localStorage.getItem(k); } catch (e) {}
  if (v !== 'a' && v !== 'b') { v = Math.random() < 0.5 ? 'a' : 'b'; try { localStorage.setItem(k, v); } catch (e) {} }
  try { var r = document.referrer.split('/')[2]; if (r !== location.hostname) sessionStorage.setItem('p30_ref', r || '-'); } catch (e) {}
  location.replace('/${DIR}/' + v + '/' + location.search + location.hash);
})();
</script>
` })}
<body class="p30">
${topbar}
<main id="contenu"><div class="wrap">
  <p style="margin-top:32px">Redirection vers la page du programme. Si rien ne se passe, <a href="/${DIR}/a/">ouvre la page du programme</a>.</p>
</div></main>
<script src="/cro.js" data-site="programme-30-jours" data-api="${API}" data-hosts="outils.vread.fr" defer></script>
</body>
</html>
`);
}

/** Phase 1: /a/ and /b/ (links of the first ads drafts, bookmarks) send to /programme-30-jours/ with their utm and hash. */
function redirect(v) {
  return fr(`${head({ title: 'Programme Vread de 30 jours pour refinir un livre', desc: '20 minutes par jour, une preuve à chaque étape, un livre fini en 30 jours. Ouverture en janvier 2027.', canonical: BASE,
    extraHead: `<script>
// Version ${v} retirée (un seul prix jusqu’au test de décembre) : la page du programme, avec les paramètres utm de l’adresse.
(function () {
  try { var r = document.referrer.split('/')[2]; if (r !== location.hostname) sessionStorage.setItem('p30_ref', r || '-'); } catch (e) {}
  location.replace('/${DIR}/' + location.search + location.hash);
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=/${DIR}/"></noscript>
` })}
<body class="p30">
${topbar}
<main id="contenu"><div class="wrap">
  <p style="margin-top:32px">Redirection vers la page du programme. Si rien ne se passe, <a href="/${DIR}/">ouvre la page du programme</a>.</p>
</div></main>
<script src="/cro.js" data-site="programme-30-jours" data-api="${API}" data-hosts="outils.vread.fr" defer></script>
</body>
</html>
`);
}

function legalPage({ slug, title, desc, body }) {
  return fr(`${head({ title, desc, canonical: BASE + slug + '/' })}
<body class="p30">
${topbar}
<header><div class="wrap"><h1>${title}</h1></div></header>
<main id="contenu" class="legal"><div class="wrap">
${body}
  <p><a href="/${DIR}/">Retour au programme</a></p>
</div></main>
${footer}
${scripts('')}
</body>
</html>
`);
}

const confidentialite = (test) => legalPage({
  slug: 'confidentialite',
  title: 'Confidentialité de la liste du programme 30 jours',
  desc: 'Ce que READ FRANCE SAS fait de ton adresse quand tu t’inscris à la liste du programme Vread de 30 jours : finalité, données, durée, droits.',
  body: `  <p>Version du 3 novembre 2026 (texte de consentement <code>p30-2026-11-03</code>). Cette page ne concerne que la liste d’inscription au programme « 30 jours pour refinir un livre ». Elle ne concerne pas l’appli Vread, qui a sa propre politique sur <a href="https://www.vread.fr/legal/privacy">vread.fr/legal/privacy</a>.</p>
  <h2>Qui est responsable</h2>
  <p>READ FRANCE SAS, 11 rue Rouvet, 75019 Paris, SIREN 988 741 773, éditrice de Vread. Contact : <a href="mailto:octave@vread.fr">octave@vread.fr</a>. Cette adresse est lue par l’équipe de READ FRANCE et par Octave, son assistant IA, qui transmet aux fondateurs les demandes sur tes données.</p>
  <h2>Ce qui est enregistré quand tu t’inscris</h2>
  <ul>
    <li>ton adresse e-mail et, si tu le donnes, ton prénom ;</li>
    <li>le prix affiché par la page${test ? ' et sa version (A ou B, pendant le test de prix)' : ''} ;</li>
    <li>la date et l’heure de l’inscription, la page d’inscription et la version du texte de consentement ;</li>
    <li>les paramètres de campagne présents dans l’adresse de la page (utm_source, utm_medium, utm_campaign, utm_term, utm_content) et le nom de domaine du site d’où tu venais.</li>
  </ul>
  <p>Rien d’autre : pas d’adresse IP, pas de mot de passe, pas de moyen de paiement. Ta liste n’est reliée ni à l’appli Vread, ni à un compte Vread, ni à d’autres fichiers.</p>
  <h2>Pourquoi</h2>
  <p>Pour t’écrire le jour de l’ouverture du programme, prévue en janvier 2027, et pour compter combien de personnes s’inscrivent${test ? ' avec chaque prix affiché' : ''}. Tu ne recevras pas de lettre d’information ni d’offre d’un autre produit. L’adresse n’est ni vendue, ni louée, ni partagée.</p>
  <p>Base légale : ton consentement (article 6, paragraphe 1, point a du RGPD), donné en cochant la case du formulaire. Tu peux le retirer à tout moment, sans avoir à te justifier.</p>
  <h2>Combien de temps</h2>
  <p>Jusqu’à l’e-mail d’ouverture, puis trois mois. Si le programme n’ouvre pas, la liste est effacée au plus tard le 30 juin 2027.</p>
  <h2>Où sont les données</h2>
  <p>La liste est un tableur Google Sheets de READ FRANCE, alimenté par un script Google Apps Script (Google). Les pages sont hébergées par GitHub Pages (GitHub, Inc.). Ces deux sociétés américaines adhèrent au Data Privacy Framework UE–États-Unis, qui encadre le transfert des données hors de l’Union européenne.</p>
  <h2>Tes droits</h2>
  <p>Tu peux demander l’accès à tes données, leur correction, leur effacement ou leur portabilité, et t’opposer à leur usage, en écrivant à <a href="mailto:octave@vread.fr">octave@vread.fr</a> depuis l’adresse inscrite. Réponse sous un mois au plus. Si la réponse ne te convient pas, tu peux saisir la CNIL (<a href="https://www.cnil.fr/fr/plaintes">cnil.fr/fr/plaintes</a>).</p>
  <h2>Mesure d’audience, sans cookie</h2>
  <p>Ces pages comptent, de façon anonyme et agrégée, les pages vues, l’arrivée jusqu’au prix, les clics sur le bouton d’inscription, l’ouverture du formulaire et les envois, ainsi que le domaine du site d’origine, les paramètres utm, la profondeur de défilement, les sections atteintes, les questions ouvertes, le nom du dernier champ touché (jamais son contenu), les erreurs techniques et la vitesse d’affichage. Seuls des totaux par jour sont gardés, dans le même tableur. Pas de cookie, pas d’identifiant, pas d’adresse IP. Rien n’est mesuré si ton navigateur envoie « Do Not Track » ou « Global Privacy Control ». Cette mesure suit les règles de la mesure d’audience exemptée de consentement (article 82 de la loi Informatique et Libertés, recommandation de la CNIL du 17 septembre 2020).</p>
  <h2>Ce que ces pages gardent dans ton navigateur</h2>
  <p>${test ? 'Une lettre, a ou b, dans le stockage local (localStorage, clé <code>p30_version</code>), pour te montrer la même version de la page, donc le même prix, à ta prochaine visite. ' : ''}Pour la durée de l’onglet (sessionStorage) : les paramètres utm de ton arrivée et le domaine du site d’origine. Rien de tout cela ne t’identifie. Tu peux l’effacer en vidant les données du site dans ton navigateur.</p>
  <h2>Pré-commande</h2>
  <p>Aucune pré-commande ni aucun paiement n’est proposé aujourd’hui. Si une pré-commande ouvre, cette page sera mise à jour avant, avec ce qui concerne le paiement.</p>`,
});

const mentions = () => legalPage({
  slug: 'mentions-legales',
  title: 'Mentions légales du programme 30 jours',
  desc: 'Éditeur, hébergeur et contact des pages du programme Vread de 30 jours : READ FRANCE SAS, 11 rue Rouvet, 75019 Paris.',
  body: `  <h2>Éditeur</h2>
  <p>READ FRANCE SAS, société par actions simplifiée au capital de 1 000 €<br>
  Siège social : 11 rue Rouvet, 75019 Paris, France<br>
  SIREN 988 741 773, RCS Paris<br>
  Directeur de la publication : Tanguy Warsmann, président<br>
  Contact : <a href="mailto:octave@vread.fr">octave@vread.fr</a></p>
  <p>Vread est une marque et une appli de READ FRANCE SAS.</p>
  <h2>Hébergement</h2>
  <p>Pages : GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis. Liste d’inscription : Google Apps Script et Google Sheets, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irlande.</p>
  <h2>Rédaction</h2>
  <p>Textes repris du plan de Tanguy Warsmann et mis en page par Octave, l’assistant IA de READ FRANCE. Les chiffres cités ont leur source sur la page du programme.</p>
  <h2>Propriété intellectuelle</h2>
  <p>Les textes et la mise en page sont de READ FRANCE SAS. La Femme de ménage est un roman de Freida McFadden, cité comme exemple d’étape dans l’appli Vread ; la question citée est publiée par Vread sur vread.fr.</p>
  <h2>Données personnelles</h2>
  <p>Voir la page <a href="/${DIR}/confidentialite/">confidentialité de la liste</a>.</p>`,
});


/** All generated pages. test: the December price test (TEST_DECEMBRE by default, off until Tanguy's grid and go).
 *  opts: { rapport: RAPPORT_HEBDO, index: PAGE_INDEXABLE } by default. */
export function pages(test = TEST_DECEMBRE, { rapport = RAPPORT_HEBDO, index = PAGE_INDEXABLE } = {}) {
  const out = {};
  if (test.actif) {
    for (const v of ['a', 'b']) {
      const o = test.versions[v];
      if (!o || !/^\d+(,\d\d)? €$/.test(o.prix || '') || !o.montant) throw new Error(`TEST_DECEMBRE.versions.${v}: price missing (grid set by Tanguy)`);
    }
    if (test.versions.a.prix === test.versions.b.prix) throw new Error('TEST_DECEMBRE: the two prices are the same');
    out[`${DIR}/index.html`] = chooser();
    for (const v of ['a', 'b']) out[`${DIR}/${v}/index.html`] = landing({ essai: '', ...test.versions[v], version: v, path: v + '/', xp: test.experience, rapport });
  } else {
    out[`${DIR}/index.html`] = landing({ ...PRIX_APPLI, path: '', xp: '', rapport, index });
    for (const v of ['a', 'b']) out[`${DIR}/${v}/index.html`] = redirect(v);
  }
  out[`${DIR}/confidentialite/index.html`] = confidentialite(test.actif);
  out[`${DIR}/mentions-legales/index.html`] = mentions();
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const [rel, html] of Object.entries(pages())) {
    const f = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, html);
    console.log('wrote', rel);
  }
}
