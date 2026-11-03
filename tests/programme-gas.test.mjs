// Unit tests of the programme-30-jours waiting-list Apps Script (gas-programme-30-jours/src) under a minimal Apps Script mock.
// node tests/programme-gas.test.mjs   (exit code 0 = ok, no dependency)
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const ROOT = new URL('../gas-programme-30-jours/src/', import.meta.url);

function load() {
  function Sheet(name) { this.name = name; this.rows = []; }
  Sheet.prototype = {
    getLastRow() { return this.rows.length; },
    getLastColumn() { return this.rows.reduce((m, r) => Math.max(m, r.length), 0); },
    appendRow(r) { this.rows.push(r.slice()); },
    deleteRow(n) { this.rows.splice(n - 1, 1); },
    getRange(r, c, nr = 1, nc = 1) {
      const sh = this;
      return {
        setValues(v) { v.forEach((row, i) => row.forEach((x, j) => { (sh.rows[r - 1 + i] ||= [])[c - 1 + j] = x; })); return this; },
        getValues() { const o = []; for (let i = 0; i < nr; i++) { const row = []; for (let j = 0; j < nc; j++) row.push((sh.rows[r - 1 + i] || [])[c - 1 + j] ?? ''); o.push(row); } return o; },
        getValue() { return (sh.rows[r - 1] || [])[c - 1] ?? ''; },
        setValue(x) { (sh.rows[r - 1] ||= [])[c - 1] = x; return this; },
        setFontWeight() { return this; },
        setNumberFormat() { return this; },
        setNumberFormats() { return this; },
      };
    },
    setFrozenRows() {},
  };
  const sheets = {};
  const ss = { getId: () => 'sheet-id', getUrl: () => 'https://docs.google.com/spreadsheets/d/sheet-id', getSheets: () => Object.values(sheets), getSheetByName: (n) => sheets[n], insertSheet: (n) => (sheets[n] = new Sheet(n)), deleteSheet() {}, setSpreadsheetTimeZone() {} };
  const cache = {}, props = {};
  const ctx = {
    console, JSON, Date, Math, Number, String, Array, Object, RegExp, Error, isFinite,
    SpreadsheetApp: { openById: () => ss, create: () => ss },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null, setProperty: (k, v) => { props[k] = v; }, deleteProperty: (k) => { delete props[k]; } }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, tryLock: () => true, releaseLock() {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache[k] ?? null, put: (k, v) => { cache[k] = v; }, getAll: (ks) => Object.fromEntries(ks.map((k) => [k, cache[k]])), putAll: (o) => Object.assign(cache, o) }) },
    ContentService: { createTextOutput: (t) => ({ setMimeType() { return t; } }), MimeType: { JSON: 'json' } },
    Utilities: {
      formatDate: (d) => d.toISOString().slice(0, 10), DigestAlgorithm: { SHA_256: 1 }, Charset: { UTF_8: 1 },
      computeDigest: (a, t) => [...crypto.createHash('sha256').update(t).digest()].map((b) => (b > 127 ? b - 256 : b)),
    },
  };
  vm.createContext(ctx);
  for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(new URL(f, ROOT), 'utf8'), ctx, { filename: f });
  return { ctx, sheets };
}


const { ctx, sheets } = load();
const APP = ctx.APP;
const post = (body) => JSON.parse(ctx.doPost({ postData: { contents: JSON.stringify(body) }, parameter: {} }));
const get = (q) => JSON.parse(ctx.doGet({ parameter: q }));
const base = { action: 'inscription', version: 'a', email: 'lecteur@example.com', prenom: 'Camille', consent: true, consent_version: APP.consentVersion,
  page: '/programme-30-jours/a/', utm_source: 'instagram', utm_medium: 'paid', utm_campaign: 'douleur', ref_domain: 'l.instagram.com' };

// ping and scope
assert.equal(get({ action: 'ping' }).site, 'programme-30-jours');
const manifest = JSON.parse(fs.readFileSync(new URL('appsscript.json', ROOT), 'utf8'));
assert.deepEqual(manifest.oauthScopes, ['https://www.googleapis.com/auth/spreadsheets'], 'only scope: spreadsheets');
for (const f of fs.readdirSync(ROOT).filter((f) => f.endsWith('.js'))) {
  const s = fs.readFileSync(new URL(f, ROOT), 'utf8');
  assert.ok(!/MailApp|GmailApp|UrlFetchApp|DriveApp/.test(s), f + ': no mail, no fetch, no Drive');
}

// track: page normalised, version from the page, excluded hits apart, signup_ok refused from a browser
assert.deepEqual(post({ action: 'track', v: 2, site: APP.site, page: '/programme-30-jours/b/', event: 'view', device: 'mobile' }), { ok: true });
assert.equal(sheets.Stats.rows[1][2], '/b/');
assert.equal(sheets.Stats.rows[1][4], 'b');
post({ action: 'track', v: 2, site: APP.site, page: '/programme-30-jours/b/', event: 'view', device: 'mobile' });
assert.equal(sheets.Stats.rows[1][9], 2, 'same key increments');
for (const ev of ['price_view', 'cta_click', 'form_open', 'signup_submit']) assert.equal(post({ action: 'track', v: 2, site: APP.site, page: '/programme-30-jours/a/', event: ev }).ok, true, ev);
assert.equal(post({ action: 'track', v: 2, site: APP.site, page: '/programme-30-jours/a/', event: 'signup_ok' }).field, 'event');
post({ action: 'track', v: 2, site: APP.site, page: '/programme-30-jours/a/', event: 'view', excluded: 'notrack' });
post({ action: 'track', site: APP.site, page: '/programme-30-jours/a/', event: 'view' });
assert.deepEqual(sheets.Exclus.rows.slice(1).map((r) => r[4]), ['notrack', 'legacy']);
assert.equal(post({ action: 'track', v: 2, site: 'hub', page: '/', event: 'view' }).error, 'bad_request');

// inscription: validation
assert.equal(post({ ...base, consent: false }).error, 'consent_required');
assert.equal(post({ ...base, consent_version: 'old' }).error, 'consent_outdated');
assert.equal(post({ ...base, email: 'nope' }).field, 'email');
assert.equal(post({ ...base, version: 'c' }).field, 'version');
assert.equal(post({ ...base, prenom: '<script>' }).field, 'prenom');
assert.deepEqual(post({ ...base, hp: 'bot' }), { ok: true });
assert.equal(sheets.Inscriptions, undefined, 'nothing written yet');
assert.equal(get({ ...base }).error, 'method_not_allowed', 'GET cannot sign up');

// inscription: stored with version, price, utm and date; one row per e-mail; tests flagged and not counted
const r1 = post(base);
assert.deepEqual([r1.ok, r1.updated, r1.test], [true, false, true]);
const row = sheets.Inscriptions.rows[1];
const col = (k) => row[ctx.SIGNUP_HEADER.indexOf(k)];
assert.deepEqual([col('version'), col('prix_eur_an'), col('email'), col('prenom'), col('page')], ['a', 39.99, 'lecteur@example.com', 'Camille', '/a/']);
assert.deepEqual([col('utm_source'), col('utm_medium'), col('utm_campaign'), col('source'), col('mode'), col('statut'), col('test')], ['instagram', 'paid', 'douleur', 'instagram', 'liste', 'inscrit', 'yes']);
assert.match(col('created_at'), /^\d{4}-\d{2}-\d{2}T/);
assert.match(col('date_paris'), /^\d{4}-\d{2}-\d{2}$/);
const r2 = post({ ...base, version: 'b', prenom: '' });
assert.equal(r2.updated, true);
assert.equal(sheets.Inscriptions.rows.length, 2, 'same e-mail updates the row');
assert.equal(sheets.Inscriptions.rows[1][3], 'a', 'the version first shown is kept');
assert.equal(sheets.Inscriptions.rows[1][6], 'Camille', 'an empty first name does not erase it');
assert.equal(sheets.Inscriptions.rows[1][18], 2);
assert.ok(!sheets.Stats.rows.some((r) => r[3] === 'signup_ok'), 'test sign-ups are not counted');
assert.equal(post({ ...base, email: 'octave+test@vread.fr' }).test, true);
assert.equal(post({ ...base, email: 'vrai.lecteur@gmail.com', test: true }).test, true, 'octave_notrack in the browser');
const real = post({ ...base, email: 'lecteur.reel@gmail.com', version: 'b', utm_campaign: '=HYPERLINK("x")' });
assert.equal(real.test, false);
const last = sheets.Inscriptions.rows.at(-1);
assert.equal(last[11], '\'=HYPERLINK("x")', 'formula injection neutralised');
assert.equal(last[4], 79.99);
assert.ok(sheets.Stats.rows.some((r) => r[3] === 'signup_ok' && r[4] === 'b' && r[6] === '(serveur)'));

// admin view
assert.equal(post({ action: 'summary' }).error, 'forbidden');
const key = process.env.PROGRAMME_30_JOURS_ADMIN_KEY || '';
if (key) {
  const s = post({ action: 'summary', key });
  assert.equal(s.inscriptions.real, 1);
  assert.equal(s.inscriptions.test, 3);
  assert.ok(!JSON.stringify(s).includes('@'), 'never an e-mail');
}

// cro.js batch accepted for this site only, with the price experiment
assert.equal(post({ action: 'track', kind: 'cro', v: 2, site: APP.site, page: '/programme-30-jours/a/', device: 'desktop', e: [['pv', '', ''], ['section', 'prix', ''], ['xp', 'p30-prix', 'a.n'], ['xp', 'p30-prix', 'a.signup']] }).ok, true);
assert.ok(sheets.Comportement.rows.some((r) => r[3] === 'section' && r[4] === 'prix'));
assert.ok(sheets.Experiences.rows.some((r) => r[2] === 'p30-prix' && r[3] === 'a' && r[4] === 'signup'));
assert.notEqual(post({ action: 'track', kind: 'cro', v: 2, site: 'other', page: '/', e: [['pv', '', '']] }).ok, true);
assert.equal(ctx.sourceOf_({ ref_domain: 'outils.vread.fr' }), '(interne)');
assert.equal(ctx.sourceOf_({ ref_domain: 'www.example.org' }), 'example.org');

// English page (lang 'en'): one version, USD, own consent text; French pages unchanged (no lang = 'fr', EUR)
const en = { action: 'inscription', lang: 'en', version: 'en', email: 'reader@example.com', prenom: 'Sam', consent: true, consent_version: APP.consentVersions.en,
  page: '/en/30-day-reading-program/', utm_source: 'one-sec', utm_medium: 'partner', utm_campaign: 'january', ref_domain: 'one-sec.app' };
assert.equal(post({ ...en, consent_version: APP.consentVersion }).error, 'consent_outdated', 'the French consent text is not the English one');
assert.equal(post({ ...en, version: 'a' }).field, 'version', 'no French price on the English page');
assert.equal(post({ ...base, email: 'x@example.com', version: 'en' }).field, 'version', 'no English version on a French page');
assert.equal(post({ ...en, lang: 'de' }).field, 'lang');
assert.equal(post({ ...en, lang: '__proto__' }).field, 'lang');
const re1 = post(en);
assert.deepEqual([re1.ok, re1.updated, re1.test], [true, false, true]);
const erow = sheets.Inscriptions.rows.at(-1);
const ecol = (k) => erow[ctx.SIGNUP_HEADER.indexOf(k)];
assert.deepEqual([ecol('version'), ecol('lang'), ecol('prix_an'), ecol('devise'), ecol('prix_eur_an'), ecol('consent_version'), ecol('page')],
  ['en', 'en', 39.99, 'USD', '', 'p30-en-2026-11-03', '/en/30-day-reading-program/']);
assert.deepEqual([ecol('utm_source'), ecol('utm_medium'), ecol('utm_campaign'), ecol('source')], ['one-sec', 'partner', 'january', 'one-sec']);
post({ ...base, email: 'fr.sans.lang@example.com' });
const frow = sheets.Inscriptions.rows.at(-1);
assert.deepEqual([frow[ctx.SIGNUP_HEADER.indexOf('lang')], frow[ctx.SIGNUP_HEADER.indexOf('devise')], frow[4]], ['fr', 'EUR', 39.99]);
assert.equal(post({ ...base, email: 'fr.lang@example.com', lang: 'fr' }).ok, true);
const realEn = post({ ...en, email: 'real.reader@gmail.com' });
assert.equal(realEn.test, false);
assert.ok(sheets.Stats.rows.some((r) => r[3] === 'signup_ok' && r[4] === 'en' && r[2] === '/en/30-day-reading-program/'), 'real English sign-up counted');
post({ action: 'track', v: 2, site: APP.site, page: '/en/30-day-reading-program/', event: 'price_view', detail: 'en' });
assert.ok(sheets.Stats.rows.some((r) => r[2] === '/en/30-day-reading-program/' && r[3] === 'price_view' && r[4] === 'en'));
post({ action: 'track', v: 2, site: APP.site, page: '/en/30-day-reading-program/privacy/', event: 'view' });
assert.ok(sheets.Stats.rows.some((r) => r[2] === '/en/30-day-reading-program/privacy/' && r[4] === ''));
assert.deepEqual(get({ action: 'ping' }).consentVersions, { fr: 'p30-2026-11-03', en: 'p30-en-2026-11-03' });

// A sheet created before the lang/prix_an/devise columns gets them in its header, rows untouched
{
  const { ctx: c2, sheets: s2 } = load();
  const old = c2.SIGNUP_HEADER.slice(0, 19);
  c2.SpreadsheetApp.openById().insertSheet('Inscriptions').appendRow(old);
  s2.Inscriptions.appendRow(['2026-11-03T06:00:00.000Z', '2026-11-03T06:00:00.000Z', '2026-11-03', 'a', 39.99, 'ancien@example.com']);
  const p2 = (b) => JSON.parse(c2.doPost({ postData: { contents: JSON.stringify(b) }, parameter: {} }));
  assert.equal(p2({ ...en, email: 'new@example.com' }).ok, true);
  assert.deepEqual(s2.Inscriptions.rows[0], c2.SIGNUP_HEADER, 'header extended');
  assert.equal(s2.Inscriptions.rows[1][5], 'ancien@example.com');
  assert.equal(s2.Inscriptions.rows[2][c2.SIGNUP_HEADER.indexOf('devise')], 'USD');
}

console.log('programme-30-jours gas: ok');
