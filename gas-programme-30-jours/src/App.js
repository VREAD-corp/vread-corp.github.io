/** Configuration of the « 30 jours pour refinir un livre » waiting list (loaded first: files run in alphabetical order). */
var APP = {
  name: 'Programme 30 jours (Vread)',
  site: 'programme-30-jours',
  host: 'outils.vread.fr',                 // public page: https://outils.vread.fr/programme-30-jours/
  base: '/programme-30-jours',
  enBase: '/en/30-day-reading-program',    // English page (one price, no A/B): https://outils.vread.fr/en/30-day-reading-program/
  tz: 'Europe/Paris',
  sheetTitle: 'Programme 30 jours : liste d’inscription et statistiques (READ FRANCE SAS)',
  consentVersion: 'p30-2026-11-03',        // French pages
  consentVersions: { fr: 'p30-2026-11-03', en: 'p30-en-2026-11-03' },
  adminHash: 'ff662832ac3bb59f5aaf9b8b1e01b0d3c87eef1181472a55709f02a5f5e9ac23',
  // mesure.js events of the pages. signup_ok is written by the server only (real sign-ups, not the test ones).
  events: ['view', 'price_view', 'cta_click', 'form_open', 'signup_submit', 'signup_ok'],
  // Phase 1 (from 2026-11-03): one price, the app's annual price. French page /programme-30-jours/ = version 'app'
  // (79 € a year, 14-day free trial). English page = version 'en' (US annual price of the app, $74.99). No A/B test.
  prices: { app: 79, en: 74.99 },
  currencies: { app: 'EUR', en: 'USD' },
  langVersions: { fr: ['app'], en: ['en'] },
  rootVersion: 'app',                      // version counted for the page /programme-30-jours/ itself
  xp: {},
  // December price test (OFF): grid set by Tanguy end of November. To switch on, with TEST_DECEMBRE in
  // tools/programme-30-jours.mjs: prices.a / prices.b = the grid (EUR a year), currencies a/b 'EUR',
  // langVersions.fr = ['a', 'b'], rootVersion = '' (the root page then only draws a or b), xp = { 'p30-prix-dec': ['a', 'b'] };
  // then bash gas-programme-30-jours/scripts/deploy.sh.
};
