// Generates the pages of the « 30 jours pour refinir un livre » waiting list (Vread, READ FRANCE SAS):
//   programme-30-jours/index.html             random version (a or b), kept in localStorage, then redirect
//   programme-30-jours/a/index.html           39,99 € par an
//   programme-30-jours/b/index.html           79,99 € par an
//   programme-30-jours/confidentialite/       privacy notice of this list
//   programme-30-jours/mentions-legales/      legal notice (READ FRANCE SAS)
//   en/30-day-reading-program/index.html      English page for the partners' audience: one price, $39.99 a year, no A/B
//   en/30-day-reading-program/privacy/        privacy notice and terms of the list, in English
//   (en/30-day-reading-program/config.js is hand-written: same backend, English consent text version)
// node tools/programme-30-jours.mjs   (tests/programme-pages.check.mjs fails if the committed pages differ)
// Not linked from the hub, noindex until Tanguy validates, not in any sitemap, not sent to IndexNow. Linked only from the
// screen-time tools (/temps-ecran-en-livres/ -> French page, /en/screen-time-to-books/ -> English page).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR = 'programme-30-jours';
export const API = 'https://script.google.com/macros/s/AKfycbxXW-9xz90F1nalrIOMIVU9RarjRHTa1zb8F-ajfVIESYEfg5Ec1y4PyObDjz7HL9OA/exec';
export const VERSIONS = { a: { prix: '39,99 €', montant: '39,99' }, b: { prix: '79,99 €', montant: '79,99' } };
const BASE = 'https://outils.vread.fr/' + DIR + '/';
const CNL = 'https://centrenationaldulivre.fr/sites/default/files/2025-04/Barom%C3%A8tre%20Les%20Fran%C3%A7ais%20et%20la%20lecture%20Synth%C3%A8se%202025-04-08.pdf';
const ASSET_V = '2026-11-03c';
export const EN_DIR = 'en/30-day-reading-program';
export const EN_PRICE = '$39.99';
export const EN_CONSENT = 'p30-en-2026-11-03';
const EN_BASE = 'https://outils.vread.fr/' + EN_DIR + '/';

/** French typography in text nodes only: non-breaking space before ; : ! ? » and after «, and inside « 39,99 € ». */
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

const head = ({ title, desc, canonical, version, extraHead = '' }) => `<!doctype html>
<html lang="fr"${version ? ` data-version="${version}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
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

const scripts = (version) => `${version ? `<script>window.OCTAVE_XP=[{id:'p30-prix',variants:['${version}']}];</script>\n` : ''}<script src="/${DIR}/mesure.js?v=${ASSET_V}" defer></script>
<script src="/cro.js" data-site="programme-30-jours" data-api="${API}" data-hosts="outils.vread.fr" data-cta="[data-open-form]" defer></script>`;

const cta = (where) => `<a class="btn" href="#inscription" data-open-form data-mesure="cta_click" data-detail="${where}">Je rejoins le programme de janvier</a>`;

function landing(v) {
  const { prix } = VERSIONS[v];
  const title = 'Tu n’arrives plus à finir un livre ? Le programme Vread de 30 jours';
  const desc = `20 minutes par jour, une preuve à chaque étape, un livre fini en 30 jours. Ouverture en janvier 2027, ${prix} par an. Inscris-toi pour être prévenu.`;
  return fr(`${head({ title, desc, canonical: BASE + v + '/', version: v, extraHead: `<script src="/${DIR}/config.js?v=${ASSET_V}"></script>\n` })}
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
      <p class="note">Ouverture en janvier 2027 à ${prix} par an. Rien à payer aujourd’hui.</p>
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
    <li><strong>Ta série grandit, et chaque semaine tu vois le chemin parcouru.</strong><span>Un rapport par e-mail te donne tes minutes de lecture validée, tes pages et où tu en es dans ton livre.</span></li>
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
    <li>Le premier livre, choisi pour toi : court, prenant, faisable en 30 jours sans effort héroïque.</li>
    <li>La preuve que tu avances : les questions valident chaque étape, ta série montre ta régularité.</li>
    <li>Le rapport de la semaine, par e-mail.</li>
  </ul>
  <p class="fine2">L’appli Vread reste gratuite pour tout le monde. Le programme ajoute le choix du premier livre, l’objectif sur 30 jours et le rapport de chaque semaine.</p>
</div></section>

<section class="band soft" id="preuve" aria-labelledby="h-preuve"><div class="wrap narrow">
  <h2 id="h-preuve">Vread aujourd’hui</h2>
  <p>Plus de 19 000 lecteurs ont commencé au moins un livre dans Vread, et plus de 13 000 livres y ont été finis, une question après l’autre. L’appli a 4,7 sur 5 sur l’App Store (158 notes).</p>
  <p class="fine2">Chiffres publiés par Vread sur <a href="https://www.vread.fr/presse">vread.fr/presse</a>, relevés le 29 octobre 2026.</p>
  <!-- Témoignage : emplacement vide. Aucun témoignage d’ancien lecteur n’a encore été recueilli (à faire lors des appels utilisateurs).
       N’ajouter qu’un témoignage réel, avec l’accord écrit de la personne, son prénom et ce qu’elle a lu. -->
</div></section>

<section class="band" id="prix" aria-labelledby="h-prix"><div class="wrap">
  <h2 id="h-prix">Le prix</h2>
  <div class="prix-box">
    <p class="prix-montant">${prix} <span>par an</span></p>
    <p>Ouverture en janvier. Inscris-toi, on te prévient le premier jour.</p>
    ${cta('prix')}
    <p class="fine2">Rien à payer aujourd’hui et aucun engagement : l’inscription sert seulement à te prévenir. Prix annoncé pour l’ouverture, toutes taxes comprises.</p>
    <div id="p30-precommande" hidden>
      <p><strong>Ou pré-commande dès maintenant, ${prix}.</strong> Tu es remboursé en entier sur simple demande jusqu’à l’ouverture, et d’office si le programme n’a pas ouvert le 31 janvier 2027.</p>
      <a class="btn ghost" href="#p30-pay" data-precommande data-mesure="cta_click" data-detail="precommande">Pré-commander, ${prix}</a>
      <div id="p30-pay"></div>
    </div>
  </div>
</div></section>

<section class="band soft faq" id="faq" aria-labelledby="h-faq"><div class="wrap">
  <h2 id="h-faq">Questions</h2>
  <details id="q-papier"><summary>Je lis sur papier, ça marche ?</summary><p>Oui. Tu lis sur ton support, papier, liseuse ou audio, et tu réponds aux questions dans l’appli.</p></details>
  <details id="q-temps"><summary>Combien de temps par jour ?</summary><p>20 minutes. Le premier livre est choisi pour être fini en 30 jours à ce rythme.</p></details>
  <details id="q-rate"><summary>Et si je rate un jour ?</summary><p>Tu as des gels de série, inclus dans la version gratuite de Vread : ils protègent ta série quand tu rates un jour. Et si une question te bloque, un nombre limité de jokers par livre te permet de passer l’étape.</p></details>
  <details id="q-ouverture"><summary>Quand le programme ouvre-t-il ?</summary><p>En janvier 2027. Tu reçois un e-mail le jour de l’ouverture, avec le prix affiché ici, et tu décides à ce moment-là.</p></details>
  <details id="q-donnees"><summary>Que devient mon adresse e-mail ?</summary><p>Elle sert seulement à te prévenir de l’ouverture. Elle n’est reliée ni à l’appli Vread ni à un compte. Le détail est sur la page <a href="/${DIR}/confidentialite/">confidentialité de la liste</a>.</p></details>
</div></section>

<div class="wrap">
  <div class="band sources" id="sources">
    <p id="source-1">1. Centre national du livre et Ipsos, <a href="${CNL}">« Les Français et la lecture », baromètre 2025, synthèse</a> (8 avril 2025), enquête par téléphone auprès de 1 001 personnes de 15 ans et plus en janvier 2025 : 31 minutes par jour consacrées à la lecture de livres dans le cadre des loisirs, 10 de moins qu’en 2023 (p. 23) ; 3 h 21 par jour devant un écran sur le temps libre (p. 45).</p>
    <p>Jokers et gels de série : <a href="https://www.vread.fr/premium">vread.fr/premium</a> et <a href="https://www.vread.fr/a-propos">vread.fr/a-propos</a>, lus le 3 novembre 2026.</p>
  </div>
  <p>${cta('bas')}</p>
</div>
</main>

<dialog class="p30-dialog" id="inscription" aria-labelledby="h-form">
  <div class="inner">
    <button class="x" type="button" data-close-form aria-label="Fermer">×</button>
    <h2 id="h-form">Rejoindre le programme de janvier</h2>
    <p>On t’écrit le jour de l’ouverture, en janvier 2027, avec le prix : ${prix} par an. Rien à payer aujourd’hui.</p>
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
${scripts(v)}
</body>
</html>
`);
}

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

const confidentialite = () => legalPage({
  slug: 'confidentialite',
  title: 'Confidentialité de la liste du programme 30 jours',
  desc: 'Ce que READ FRANCE SAS fait de ton adresse quand tu t’inscris à la liste du programme Vread de 30 jours : finalité, données, durée, droits.',
  body: `  <p>Version du 3 novembre 2026 (texte de consentement <code>p30-2026-11-03</code>). Cette page ne concerne que la liste d’inscription au programme « 30 jours pour refinir un livre ». Elle ne concerne pas l’appli Vread, qui a sa propre politique sur <a href="https://www.vread.fr/legal/privacy">vread.fr/legal/privacy</a>.</p>
  <h2>Qui est responsable</h2>
  <p>READ FRANCE SAS, 11 rue Rouvet, 75019 Paris, SIREN 988 741 773, éditrice de Vread. Contact : <a href="mailto:octave@vread.fr">octave@vread.fr</a>. Cette adresse est lue par l’équipe de READ FRANCE et par Octave, son assistant IA, qui transmet aux fondateurs les demandes sur tes données.</p>
  <h2>Ce qui est enregistré quand tu t’inscris</h2>
  <ul>
    <li>ton adresse e-mail et, si tu le donnes, ton prénom ;</li>
    <li>la version de la page que tu as vue (A ou B) et le prix qu’elle affichait ;</li>
    <li>la date et l’heure de l’inscription, la page d’inscription et la version du texte de consentement ;</li>
    <li>les paramètres de campagne présents dans l’adresse de la page (utm_source, utm_medium, utm_campaign, utm_term, utm_content) et le nom de domaine du site d’où tu venais.</li>
  </ul>
  <p>Rien d’autre : pas d’adresse IP, pas de mot de passe, pas de moyen de paiement. Ta liste n’est reliée ni à l’appli Vread, ni à un compte Vread, ni à d’autres fichiers.</p>
  <h2>Pourquoi</h2>
  <p>Pour t’écrire le jour de l’ouverture du programme, prévue en janvier 2027, et pour compter combien de personnes s’inscrivent avec chaque prix affiché. Tu ne recevras pas de lettre d’information ni d’offre d’un autre produit. L’adresse n’est ni vendue, ni louée, ni partagée.</p>
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
  <p>Une lettre, a ou b, dans le stockage local (localStorage, clé <code>p30_version</code>), pour te montrer la même version de la page, donc le même prix, à ta prochaine visite. Pour la durée de l’onglet (sessionStorage) : les paramètres utm de ton arrivée, le domaine du site d’origine et la version vue par la mesure. Rien de tout cela ne t’identifie. Tu peux l’effacer en vidant les données du site dans ton navigateur.</p>
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


/* ---------- English page (partners' audience: one sec, Brick, Opal). Adapted from the French page, same facts. ---------- */

const enHead = ({ title, desc, canonical, version, extraHead = '' }) => `<!doctype html>
<html lang="en"${version ? ` data-version="${version}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="en_US">
<meta property="og:site_name" content="Vread">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
<link rel="stylesheet" href="/${DIR}/p30.css?v=${ASSET_V}">
${extraHead}</head>`;

const enTopbar = `<a class="skip" href="#contenu">Skip to content</a>
<header class="topbar"><div class="wrap">
  <span class="wm-static">Vread <span>· 30-day program</span></span>
</div></header>`;

const enFooter = `<footer><div class="wrap">
  <p>Vread is a reading app published by READ FRANCE SAS (SIREN 988 741 773), 11 rue Rouvet, 75019 Paris, France, founded by Tanguy Warsmann. Anonymous, aggregated audience measurement, no cookies.</p>
  <nav aria-label="Footer"><a href="/${EN_DIR}/privacy/">Privacy and terms of the list</a><a href="mailto:octave@vread.fr">Contact: octave@vread.fr</a></nav>
</div></footer>`;

// No OCTAVE_XP: the English page is outside the price test.
const enScripts = `<script src="/${DIR}/mesure.js?v=${ASSET_V}" defer></script>
<script src="/cro.js" data-site="programme-30-jours" data-api="${API}" data-hosts="outils.vread.fr" data-cta="[data-open-form]" defer></script>`;

const enCta = (where) => `<a class="btn" href="#inscription" data-open-form data-mesure="cta_click" data-detail="${where}">Join the January program</a>`;

function enLanding() {
  const prix = EN_PRICE;
  const title = 'Can’t finish a book anymore? Vread’s 30-day reading program';
  const desc = `20 minutes a day, one question at every step, one book finished in 30 days. Opens in January 2027 at ${prix} a year. Join the list to hear when it opens.`;
  return `${enHead({ title, desc, canonical: EN_BASE, version: 'en', extraHead: `<script src="/${EN_DIR}/config.js?v=${ASSET_V}"></script>\n` })}
<body class="p30">
${enTopbar}
<main id="contenu">
<div class="wrap">
  <section class="p30-hero" id="hero" aria-labelledby="h1">
    <div>
      <p class="eyebrow">Vread · January 2027 program</p>
      <h1 id="h1">Can’t get through a book anymore? <span>Your phone has a lot to do with it.</span></h1>
      <p class="lead">20 minutes a day, one question at every step, one book finished in 30 days.</p>
      <div class="cta-row">${enCta('hero')}</div>
      <p class="note">Opens in January 2027 at ${prix} a year. Nothing to pay today.</p>
      <noscript><p class="note">This form needs JavaScript. You can also email <a href="mailto:octave@vread.fr">octave@vread.fr</a> and we’ll tell you when it opens.</p></noscript>
    </div>
    <figure class="step-card">
      <p class="book"><strong>The Housemaid</strong><span>Step 7 of 10</span></p>
      <div class="bar" aria-hidden="true"><i></i></div>
      <p class="ask">About the passage you just read</p>
      <p class="question">What is the first name of the Italian gardener Millie meets at the gate of the Winchester estate?</p>
      <div class="answer" aria-hidden="true"><span>Your answer, one word</span><b>Check</b></div>
      <figcaption>A step in the Vread app, rebuilt from the example published on vread.fr and translated from French: The Housemaid by Freida McFadden, 10 questions over 310 pages.</figcaption>
    </figure>
  </section>
</div>

<section class="band soft" id="constat" aria-labelledby="h-constat"><div class="wrap constat">
  <p class="chiffre">−10 min <small>of book reading a day in France, from 2023 to 2025<sup><a href="#source-1" aria-label="Source 1">1</a></sup></small></p>
  <div class="narrow">
    <h2 id="h-constat">In two years, people in France lost 10 minutes of reading a day</h2>
    <p>In January 2025, people in France aged 15 and over spent an average of 31 minutes a day reading books in their free time, down from 41 minutes in 2023. Over the same free time, they spent 3 hours 21 minutes a day looking at a screen.<sup><a href="#source-1">1</a></sup></p>
    <p>Willpower is only part of the story. Your phone is designed to keep you on it.</p>
  </div>
</div></section>

<section class="band" id="comment" aria-labelledby="h-comment"><div class="wrap">
  <h2 id="h-comment">How it works</h2>
  <ol class="etapes">
    <li><strong>Read wherever you like: paper, e-reader, it doesn’t matter.</strong><span>Audiobooks count too. Vread doesn’t replace your book; the app follows your reading.</span></li>
    <li><strong>Every 30 to 40 pages, one question shows you read and understood.</strong><span>The answer is a single word.</span></li>
    <li><strong>Your streak grows, and each week you see how far you’ve come.</strong><span>A weekly email gives you your validated reading minutes, your pages and where you are in your book.</span></li>
  </ol>
</div></section>

<section class="band soft pourquoi" id="pourquoi" aria-labelledby="h-pourquoi"><div class="wrap">
  <h2 id="h-pourquoi">Why it works</h2>
  <blockquote><p>Blocking apps is half the job. The other half is having something to do instead. A blocker takes screen time away; Vread puts a book in its place.</p></blockquote>
</div></section>

<section class="band" id="programme" aria-labelledby="h-programme"><div class="wrap">
  <h2 id="h-programme">What the program includes</h2>
  <ul class="contenu">
    <li>A target you can keep: 20 minutes of reading a day, one book finished in 30 days.</li>
    <li>Your first book, picked for you from the app’s English and French catalogue: short, gripping, and doable in 30 days without heroic effort.</li>
    <li>Proof that you’re moving: the questions validate each step, and your streak shows you kept at it.</li>
    <li>A weekly report, by email.</li>
  </ul>
  <p class="fine2">The Vread app stays free for everyone. The program adds the choice of your first book, the 30-day target and the weekly report.</p>
</div></section>

<section class="band soft" id="preuve" aria-labelledby="h-preuve"><div class="wrap narrow">
  <h2 id="h-preuve">Vread today</h2>
  <p>More than 19,000 readers have started at least one book in Vread, and more than 13,000 books have been finished in it, one question at a time. The app is rated 4.7 out of 5 on the French App Store (158 ratings), and it works in English and French.</p>
  <p class="fine2">Figures published by Vread on <a href="https://www.vread.fr/presse" hreflang="fr">vread.fr/presse</a> (in French), as of October 29, 2026. Languages: <a href="https://apps.apple.com/us/app/vread/id6752836822">App Store listing</a>, read on November 3, 2026.</p>
  <!-- Testimonial: empty slot. No testimonial has been collected yet. Only add a real one, with the person's written consent, first name and what they read. -->
</div></section>

<section class="band" id="prix" aria-labelledby="h-prix"><div class="wrap">
  <h2 id="h-prix">The price</h2>
  <div class="prix-box">
    <p class="prix-montant">${prix} <span>a year</span></p>
    <p>Opens in January. Sign up and we’ll tell you on day one.</p>
    ${enCta('prix')}
    <p class="fine2">Nothing to pay today and no commitment: signing up only means we email you when the program opens. Launch price in US dollars; local taxes may apply.</p>
  </div>
</div></section>

<section class="band soft faq" id="faq" aria-labelledby="h-faq"><div class="wrap">
  <h2 id="h-faq">Questions</h2>
  <details id="q-papier"><summary>I read on paper. Does that work?</summary><p>Yes. You read on paper, an e-reader or in audio, and answer the questions in the app.</p></details>
  <details id="q-temps"><summary>How much time a day?</summary><p>20 minutes. The first book is chosen so you can finish it in 30 days at that pace.</p></details>
  <details id="q-rate"><summary>What if I miss a day?</summary><p>Streak freezes, included in the free version of Vread, protect your streak on the days you miss. And if a question stops you, you have a limited number of jokers per book to skip that step.</p></details>
  <details id="q-ouverture"><summary>When does the program open?</summary><p>In January 2027. You get an email on opening day with the price shown here, and you decide then.</p></details>
  <details id="q-donnees"><summary>What happens to my email address?</summary><p>It is used only to tell you when the program opens. It isn’t linked to the Vread app or to any account. The details are on the <a href="/${EN_DIR}/privacy/">privacy and terms</a> page.</p></details>
</div></section>

<div class="wrap">
  <div class="band sources" id="sources">
    <p id="source-1">1. Centre national du livre and Ipsos, <a href="${CNL}" hreflang="fr">“Les Français et la lecture”, 2025 barometer, summary</a> (April 8, 2025, in French). Phone survey of 1,001 people aged 15 and over in France, January 2025: 31 minutes a day spent reading books as a leisure activity, 10 fewer than in 2023 (p. 23); 3 h 21 min a day in front of a screen in free time (p. 45).</p>
    <p>Jokers and streak freezes: <a href="https://www.vread.fr/premium" hreflang="fr">vread.fr/premium</a> and <a href="https://www.vread.fr/a-propos" hreflang="fr">vread.fr/a-propos</a> (in French), read on November 3, 2026.</p>
  </div>
  <p>${enCta('bas')}</p>
</div>
</main>

<dialog class="p30-dialog" id="inscription" aria-labelledby="h-form">
  <div class="inner">
    <button class="x" type="button" data-close-form aria-label="Close">×</button>
    <h2 id="h-form">Join the January program</h2>
    <p>We’ll email you on opening day, in January 2027, with the price: ${prix} a year. Nothing to pay today.</p>
    <form id="p30-form" novalidate>
      <label for="p30-email">Your email</label>
      <input id="p30-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254">
      <label for="p30-prenom">Your first name <small>(optional)</small></label>
      <input id="p30-prenom" name="prenom" type="text" autocomplete="given-name" maxlength="40">
      <div class="hp" aria-hidden="true"><label for="p30-website">Leave empty</label><input id="p30-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <label class="consent"><input type="checkbox" name="consent" required> <span>I agree that READ FRANCE SAS keeps my address to email me when the program opens. I can withdraw my consent at any time (<a href="/${EN_DIR}/privacy/" target="_blank" rel="noopener">privacy and terms of the list</a>).</span></label>
      <button class="btn" type="submit">Sign me up</button>
    </form>
    <p id="p30-msg" class="p30-msg" role="status" aria-live="polite"></p>
  </div>
</dialog>

${enFooter}
<script src="/${DIR}/p30.js?v=${ASSET_V}" defer></script>
${enScripts}
</body>
</html>
`;
}

function enPrivacy() {
  const title = 'Privacy and terms of the 30-day program list';
  const desc = 'What READ FRANCE SAS does with your address when you join the list of Vread’s 30-day reading program: purpose, data, retention, your rights, terms.';
  return `${enHead({ title, desc, canonical: EN_BASE + 'privacy/' })}
<body class="p30">
${enTopbar}
<header><div class="wrap"><h1>${title}</h1></div></header>
<main id="contenu" class="legal"><div class="wrap">
  <p>Version of November 3, 2026 (consent text <code>${EN_CONSENT}</code>). This page covers only the waiting list of the 30-day reading program, signed up for on the English page. It does not cover the Vread app, which has its own policy at <a href="https://www.vread.fr/legal/privacy">vread.fr/legal/privacy</a>.</p>
  <h2>Who is responsible</h2>
  <p>READ FRANCE SAS, 11 rue Rouvet, 75019 Paris, France, SIREN 988 741 773, publisher of Vread. Contact: <a href="mailto:octave@vread.fr">octave@vread.fr</a>. This inbox is read by the READ FRANCE team and by Octave, its AI assistant, which passes any request about your data on to the founders.</p>
  <h2>What is recorded when you sign up</h2>
  <ul>
    <li>your email address and, if you give it, your first name;</li>
    <li>the language of the page (English) and the price it showed ($39.99 a year);</li>
    <li>the date and time of sign-up, the sign-up page and the version of the consent text;</li>
    <li>the campaign parameters in the page address (utm_source, utm_medium, utm_campaign, utm_term, utm_content) and the domain name of the site you came from.</li>
  </ul>
  <p>Nothing else: no IP address, no password, no payment details. The list is not linked to the Vread app, to a Vread account or to any other file.</p>
  <h2>Why</h2>
  <p>To email you on the day the program opens, planned for January 2027, and to count how many people sign up. You will not get a newsletter or offers for another product. Your address is not sold, rented or shared.</p>
  <p>Legal basis: your consent (Article 6(1)(a) of the EU General Data Protection Regulation), given by ticking the box on the form. You can withdraw it at any time without giving a reason.</p>
  <h2>How long</h2>
  <p>Until the opening email, then three months. If the program does not open, the list is deleted by June 30, 2027 at the latest.</p>
  <h2>Where the data is kept</h2>
  <p>The list is a Google Sheets spreadsheet belonging to READ FRANCE, filled in by a Google Apps Script. The pages are hosted on GitHub Pages (GitHub, Inc.). Both companies are based in the United States and take part in the EU–US Data Privacy Framework, which governs transfers of personal data out of the European Union.</p>
  <h2>Your rights</h2>
  <p>You can ask for access to your data, its correction, deletion or portability, and object to its use, by writing to <a href="mailto:octave@vread.fr">octave@vread.fr</a> from the address you signed up with. We answer within one month. If you are not satisfied with the answer, you can complain to the CNIL, the French data protection authority (<a href="https://www.cnil.fr/en/complaints">cnil.fr/en/complaints</a>), or to the authority where you live.</p>
  <h2>Audience measurement, without cookies</h2>
  <p>These pages count, anonymously and in aggregate, page views, how many visitors reach the price, clicks on the sign-up button, form openings and submissions, along with the referring site’s domain, utm parameters, scroll depth, sections reached, questions opened, the name of the last field touched (never its content), technical errors and loading speed. Only daily totals are kept, in the same spreadsheet. No cookie, no identifier, no IP address. Nothing is measured if your browser sends “Do Not Track” or “Global Privacy Control”. This follows the French rules for audience measurement exempt from consent (Article 82 of the French Data Protection Act, CNIL recommendation of September 17, 2020).</p>
  <h2>What these pages keep in your browser</h2>
  <p>For the life of the tab (sessionStorage): the utm parameters you arrived with. They do not identify you. You can clear them by clearing this site’s data in your browser.</p>
  <h2>Terms of the list</h2>
  <p>Joining the list is free and commits you to nothing. No payment is taken on these pages and no pre-order is offered. The price on the page, $39.99 a year in US dollars, is the price announced for the opening; local taxes may apply. The opening email will give the price and the terms of sale, and you decide then. You can leave the list at any time by writing to <a href="mailto:octave@vread.fr">octave@vread.fr</a>.</p>
  <h2>Publisher and hosting</h2>
  <p>READ FRANCE SAS, a French simplified joint-stock company (société par actions simplifiée) with share capital of €1,000<br>
  Registered office: 11 rue Rouvet, 75019 Paris, France<br>
  SIREN 988 741 773, Paris Trade and Companies Register (RCS Paris)<br>
  Publication director: Tanguy Warsmann, president<br>
  Contact: <a href="mailto:octave@vread.fr">octave@vread.fr</a></p>
  <p>Pages: GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, USA. Waiting list: Google Apps Script and Google Sheets, Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.</p>
  <p>Text adapted from Tanguy Warsmann’s plan, translated and laid out by Octave, READ FRANCE’s AI assistant. The figures quoted are sourced on the program page. Vread is a brand and an app of READ FRANCE SAS. The Housemaid is a novel by Freida McFadden, cited as an example of a step in the Vread app; the question shown is translated from the one Vread publishes on vread.fr.</p>
  <p><a href="/${EN_DIR}/">Back to the program</a></p>
</div></main>
${enFooter}
${enScripts}
</body>
</html>
`;
}

export function pages() {
  return {
    [`${DIR}/index.html`]: chooser(),
    [`${DIR}/a/index.html`]: landing('a'),
    [`${DIR}/b/index.html`]: landing('b'),
    [`${DIR}/confidentialite/index.html`]: confidentialite(),
    [`${DIR}/mentions-legales/index.html`]: mentions(),
    [`${EN_DIR}/index.html`]: enLanding(),
    [`${EN_DIR}/privacy/index.html`]: enPrivacy(),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  for (const [rel, html] of Object.entries(pages())) {
    const f = path.join(ROOT, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, html);
    console.log('wrote', rel);
  }
}
