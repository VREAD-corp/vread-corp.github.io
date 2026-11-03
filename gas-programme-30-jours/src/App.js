/** Configuration of the « 30 jours pour refinir un livre » waiting list (loaded first: files run in alphabetical order). */
var APP = {
  name: 'Programme 30 jours (Vread)',
  site: 'programme-30-jours',
  host: 'outils.vread.fr',                 // public pages: https://outils.vread.fr/programme-30-jours/{a,b}/
  base: '/programme-30-jours',
  enBase: '/en/30-day-reading-program',    // English page (one price, no A/B): https://outils.vread.fr/en/30-day-reading-program/
  tz: 'Europe/Paris',
  sheetTitle: 'Programme 30 jours : liste d’inscription et statistiques (READ FRANCE SAS)',
  consentVersion: 'p30-2026-11-03',        // French pages
  consentVersions: { fr: 'p30-2026-11-03', en: 'p30-en-2026-11-03' },
  adminHash: 'ff662832ac3bb59f5aaf9b8b1e01b0d3c87eef1181472a55709f02a5f5e9ac23',
  // mesure.js events of the pages. signup_ok is written by the server only (real sign-ups, not the test ones).
  events: ['view', 'price_view', 'cta_click', 'form_open', 'signup_submit', 'signup_ok'],
  // Price test: one URL per version (/a/ and /b/), EUR per year, as displayed on the page. Version 'en': the English
  // page, USD per year, outside the test.
  prices: { a: 39.99, b: 79.99, en: 39.99 },
  currencies: { a: 'EUR', b: 'EUR', en: 'USD' },
  langVersions: { fr: ['a', 'b'], en: ['en'] },
  xp: { 'p30-prix': ['a', 'b'] },
};
