/* Vread's 30-day reading program, English page /en/30-day-reading-program/ (one price, the app's US annual price,
 * $74.99 a year with a 14-day free trial, no A/B test).
 * Same waiting-list backend as the French pages (programme-30-jours-gas); p30.js sends lang 'en' and version 'en'.
 * No pre-order here: no products, and p30.js only loads the payment module when precommande is true AND the page's
 * version has a product. See programme-30-jours/config.js before changing anything about payment.
 */
window.P30 = {
  precommande: false,
  api: 'https://script.google.com/macros/s/AKfycbxXW-9xz90F1nalrIOMIVU9RarjRHTa1zb8F-ajfVIESYEfg5Ec1y4PyObDjz7HL9OA/exec',
  consent: 'p30-en-2026-11-03',
  contact: 'octave@vread.fr',
  ouverture: 'January 2027',
  produits: {},
};
