/**
 * Waiting list of the « 30 jours pour refinir un livre » programme (Vread, READ FRANCE SAS). Standalone Apps Script
 * with its own Sheet, same pattern as the fake-door backends of the goal-v4 sites (sans-tic, lectoclasse).
 * Nothing here takes a payment, creates a PaymentIntent, sends an e-mail or touches the Vread app. Only scope: spreadsheets.
 *
 * Actions (POST text/plain JSON, or GET with the same fields as query parameters):
 *   track        cookieless, anonymous daily counters (Stats tab). Hits flagged `excluded` by mesure.js (crawler or
 *                headless user agent, navigator.webdriver, our tests with octave_notrack=1) and hits without `v`
 *                (`legacy`) go to the Exclus tab. With `kind: 'cro'` the hit is the shared cro.js batch (Cro.js,
 *                vendored byte-identical from octave-checkout): daily counters in the Comportement and Experiences tabs.
 *   inscription  POST only: e-mail, optional first name, consent, price version, lang, utm, page -> Inscriptions tab.
 *                lang 'fr' (default, French page: version 'app', or a|b during the December price test, EUR) or 'en'
 *                (English page: version 'en', USD, its own
 *                consent text version).
 *                One row per e-mail: a second sign-up updates `updated_at` (and the first name if one is given),
 *                never the version or the price first shown.
 *   ping         health check
 *   summary      counts for the operator (admin key; never returns e-mails), with `cro` (today's behaviour and A/B)
 *   cro          aggregated behaviour and A/B summary for the weekly CRO report (key: Script Property CRO_KEY_SHA256)
 *   cro_init     POST only: stores the SHA-256 of the CRO read key once
 *
 * Test rows (?octave_notrack=1 in the browser, or an address octave+…@vread.fr / @example.com) are kept and flagged
 * `test`, never counted in signup_ok or in the summary's real totals. Nothing is ever deleted by this script.
 * The spreadsheet is created on first use and its id kept in Script Properties (SHEET_ID).
 */

var SIGNUP_HEADER = ['created_at', 'updated_at', 'date_paris', 'version', 'prix_eur_an', 'email', 'prenom', 'consent_version',
  'page', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'source', 'mode', 'statut', 'test', 'inscriptions',
  // Added 2026-11-03 with the English page (existing sheets get these headers on first use): page language, price per
  // year in the currency shown (prix_eur_an stays empty for a USD price), currency.
  'lang', 'prix_an', 'devise'];
var STATS_HEADER = ['date', 'site', 'page', 'event', 'variant', 'detail', 'source', 'medium', 'campaign', 'count', 'mobile', 'desktop', 'updated_at'];
var STATS_KEYS = 9;
var EXCL_HEADER = ['date', 'site', 'page', 'event', 'reason', 'count', 'mobile', 'desktop', 'updated_at'];
var EXCL_KEYS = 5;
var EXCL_REASONS = ['webdriver', 'bot', 'notrack', 'legacy'];
var OWN_HOSTS = [APP.host, 'vread-corp.github.io'];

// Shared cro.js counters (Cro.js): same spreadsheet, same day boundary and pages as the Stats tab.
var CRO_SITES_ = [APP.site];
var CRO_EXPERIMENTS_ = APP.xp;
var CRO_GOALS_ = [];   // 'signup' is a built-in metric of Cro.js
var CRO_TZ_ = APP.tz;
function croBook_() { return ss_(); }
function croPage_(site, page) { return trackPage_(page); }

function doGet(e) { return handle_(e, (e && e.parameter) || {}); }

function doPost(e) {
  var req = {};
  e = e || {};
  e.isPost_ = true;
  try { req = JSON.parse((e.postData && e.postData.contents) || '{}') || {}; } catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  if (typeof req !== 'object' || Array.isArray(req)) return json_({ ok: false, error: 'bad_json' });
  return handle_(e, req);
}

function handle_(e, req) {
  var action = String((e && e.parameter && e.parameter.action) || req.action || '');
  try {
    switch (action) {
      case 'track': return json_(req.kind === 'cro' ? croTrack_(req) : track_(req));
      case 'cro': return json_(croAction_(req));
      case 'cro_init': return json_(e && e.isPost_ ? croInit_(req) : { ok: false, error: 'method_not_allowed' });
      case 'inscription': return json_(e && e.isPost_ ? inscription_(req) : { ok: false, error: 'method_not_allowed' });
      case 'summary': return json_(summary_(req));
      case 'ping': return json_({ ok: true, app: APP.name, site: APP.site, consentVersion: APP.consentVersion, consentVersions: APP.consentVersions });
      default: return json_({ ok: false, error: 'unknown_action' });
    }
  } catch (err) {
    if (err && err.userError) return json_({ ok: false, error: err.code, field: err.field || '' });
    console.error(String((err && err.stack) || err));
    return json_({ ok: false, error: 'server_error' });
  }
}

/* ---------- helpers ---------- */

function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function userError_(code, field) { var e = new Error(code); e.userError = true; e.code = code; e.field = field; return e; }
function now_() { return new Date(); }
function day_(d) { return Utilities.formatDate(d, APP.tz, 'yyyy-MM-dd'); }
/** Text cell: a leading quote stops formula injection (=, +, -, @). */
function txt_(v) { var s = String(v === undefined || v === null ? '' : v); return /^[=+\-@\t\r]/.test(s) ? "'" + s : s; }
function cell_(v) { return v instanceof Date ? Utilities.formatDate(v, APP.tz, 'yyyy-MM-dd') : String(v); }
function sha256Hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s), Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function clean_(v, max) { return String(v === undefined || v === null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
function token_(v, max) { return String(v === undefined || v === null ? '' : v).toLowerCase().replace(/[^a-z0-9._ -]+/g, '').replace(/\s+/g, ' ').trim().slice(0, max); }
function isTestEmail_(email) { return /@example\.(com|org)$/.test(email) || /^octave\+[a-z0-9._-]*@vread\.fr$/.test(email); }
function checkAdmin_(req) { if (!req.key || sha256Hex_(String(req.key)) !== APP.adminHash) throw userError_('forbidden'); }
function versions_(lang) { return APP.langVersions[lang] || []; }

function ss_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) return SpreadsheetApp.openById(id);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    id = props.getProperty('SHEET_ID');
    if (id) return SpreadsheetApp.openById(id);
    var ss = SpreadsheetApp.create(APP.sheetTitle);
    ss.setSpreadsheetTimeZone(APP.tz);
    props.setProperty('SHEET_ID', ss.getId());
    return ss;
  } finally { lock.releaseLock(); }
}

function tab_(name, header) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, header.length).setValues([header]).setFontWeight('bold');
    sh.setFrozenRows(1);
    var def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Feuille 1');
    if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
  }
  return sh;
}

function rateOk_(bucket, max) {
  var cache = CacheService.getScriptCache();
  var k = 'rl:' + bucket + ':' + Math.floor(now_().getTime() / 60000);
  var n = Number(cache.get(k) || 0);
  if (n >= max) return false;
  cache.put(k, String(n + 1), 120);
  return true;
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw userError_('busy');
  try { return fn(); } finally { lock.releaseLock(); }
}

/** Inscriptions tab; a sheet created before columns were appended to SIGNUP_HEADER gets the missing header cells. */
function signupTab_() {
  var sh = tab_('Inscriptions', SIGNUP_HEADER);
  var n = sh.getLastColumn();
  if (n < SIGNUP_HEADER.length) {
    var cur = sh.getRange(1, 1, 1, n).getValues()[0].map(String);
    if (cur.join('\u001f') === SIGNUP_HEADER.slice(0, n).join('\u001f')) {
      sh.getRange(1, n + 1, 1, SIGNUP_HEADER.length - n).setValues([SIGNUP_HEADER.slice(n)]).setFontWeight('bold');
    }
  }
  return sh;
}

/* ---------- tracking (cookieless, anonymous daily counters) ---------- */

/** Path inside the programme: '/a/', '/b/', '/', '/confidentialite/'… (no query, no prefix, no index.html). */
function trackPage_(page) {
  var p = String(page === undefined || page === null ? '' : page).slice(0, 300).toLowerCase().replace(/[?#].*$/, '');
  if (!/^\/[a-z0-9\/._%~-]*$/.test(p)) return null;
  if (p === APP.base || p.indexOf(APP.base + '/') === 0) p = p.slice(APP.base.length) || '/';
  p = p.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/\/{2,}/g, '/');
  return p.slice(0, 80) || '/';
}

/** Price version of a page: '/' -> APP.rootVersion ('app' in phase 1), '/a/' -> 'a', '/b/' -> 'b' (December test), the
 *  English landing page -> 'en', else ''. */
function versionOfPage_(page) {
  if (page === APP.enBase + '/') return 'en';
  if (page === '/') return APP.rootVersion || '';
  var m = /^\/([ab])\//.exec(page || '');
  return m ? m[1] : '';
}

function sourceOf_(req) {
  var ref = String(req.ref_domain || '').toLowerCase().replace(/^www\./, '');
  if (ref && !/^[a-z0-9.-]{1,100}$/.test(ref)) ref = '';
  if (OWN_HOSTS.indexOf(ref) >= 0) ref = '(interne)';
  return token_(req.utm_source, 50) || ref || '(direct)';
}

function validateTrack_(req) {
  if (String(req.site || '') !== APP.site) throw userError_('bad_request', 'site');
  var event = String(req.event || '');
  if (APP.events.indexOf(event) < 0 || event === 'signup_ok') throw userError_('bad_request', 'event');
  var page = trackPage_(req.page);
  if (page === null) throw userError_('bad_request', 'page');
  if (req.ts !== undefined && req.ts !== null && req.ts !== '') {
    var ts = Number(req.ts);
    if (!isFinite(ts) || Math.abs(ts - now_().getTime()) > 2 * 86400 * 1000) throw userError_('bad_request', 'ts');
  }
  var detail = String(req.detail === undefined || req.detail === null ? '' : req.detail);
  if (!/^[a-z0-9.-]{0,24}$/.test(detail)) detail = '';
  return {
    date: day_(now_()), site: APP.site, page: page, event: event,
    variant: versionOfPage_(page), detail: detail,
    source: sourceOf_(req), medium: token_(req.utm_medium, 30), campaign: token_(req.utm_campaign, 50),
    device: req.device === 'mobile' || req.device === 'desktop' ? req.device : '',
    reason: req.excluded ? (EXCL_REASONS.indexOf(String(req.excluded)) >= 0 ? String(req.excluded) : 'bot') : (req.v ? '' : 'legacy'),
  };
}

function track_(req) {
  var hit = validateTrack_(req);
  if (!rateOk_('track', 240)) return { ok: false, error: 'rate_limited' };
  withLock_(function () { if (hit.reason) incrementExcluded_(hit); else incrementStat_(hit); });
  return { ok: true };
}

/** Caller holds the script lock. */
function incrementStat_(h) {
  incrementRow_('Stats', STATS_HEADER, STATS_KEYS, [h.date, h.site, h.page, h.event, h.variant, h.detail, h.source, h.medium, h.campaign], h.device);
}

/** Hits that are not visits, keyed by reason. Caller holds the script lock. */
function incrementExcluded_(h) {
  incrementRow_('Exclus', EXCL_HEADER, EXCL_KEYS, [h.date, h.site, h.page, h.event, h.reason], h.device);
}

/** Daily counter row `keys` (first is the date) in tab `name`: incremented, or appended. */
function incrementRow_(name, header, nKeys, keys, device) {
  var sh = tab_(name, header);
  var key = keys.join('\u001f');
  var last = sh.getLastRow();
  var rowNum = 0;
  var n = Math.min(Math.max(last - 1, 0), 3000);
  if (n > 0) {
    var vals = sh.getRange(last - n + 1, 1, n, nKeys).getValues();
    for (var i = vals.length - 1; i >= 0; i--) {
      if (cell_(vals[i][0]) < keys[0]) break;
      if (vals[i].map(cell_).join('\u001f') === key) { rowNum = last - n + 1 + i; break; }
    }
  }
  var stamp = now_().toISOString();
  if (!rowNum) {
    sh.appendRow(keys.map(txt_).concat([1, device === 'mobile' ? 1 : 0, device === 'desktop' ? 1 : 0, stamp]));
  } else {
    var c = sh.getRange(rowNum, nKeys + 1, 1, 3).getValues()[0];
    sh.getRange(rowNum, nKeys + 1, 1, 4).setValues([[Number(c[0] || 0) + 1, Number(c[1] || 0) + (device === 'mobile' ? 1 : 0), Number(c[2] || 0) + (device === 'desktop' ? 1 : 0), stamp]]);
  }
}

/* ---------- waiting list (no payment, no commitment) ---------- */

function validEmail_(v) {
  var s = clean_(v, 254).toLowerCase();
  if (!/^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,24}$/.test(s) || s.indexOf('..') >= 0) throw userError_('bad_request', 'email');
  return s;
}

/** First name: optional, letters, spaces, apostrophes and hyphens only, 40 characters at most. */
function validPrenom_(v) {
  var s = clean_(v, 40);
  if (s && !/^[A-Za-zÀ-ÖØ-öø-ÿ' .-]+$/.test(s)) throw userError_('bad_request', 'prenom');
  return s;
}

function inscription_(req) {
  if (req.hp) return { ok: true }; // honeypot: silently ignore bots
  if (req.consent !== true && req.consent !== 'true') throw userError_('consent_required', 'consent');
  var lang = req.lang === undefined || req.lang === null || req.lang === '' ? 'fr' : String(req.lang);
  if (!Object.prototype.hasOwnProperty.call(APP.consentVersions, lang)) throw userError_('bad_request', 'lang');
  if (String(req.consent_version || '') !== APP.consentVersions[lang]) throw userError_('consent_outdated', 'consent_version');
  var version = String(req.version || '');
  if (versions_(lang).indexOf(version) < 0) throw userError_('bad_request', 'version');
  var currency = APP.currencies[version];
  var email = validEmail_(req.email);
  var prenom = validPrenom_(req.prenom);
  var page = trackPage_(req.page) || '';
  var test = req.test === true || req.test === 'true' || isTestEmail_(email);
  var utm = {};
  ['source', 'medium', 'campaign', 'term', 'content'].forEach(function (k) { utm[k] = clean_(req['utm_' + k], 100); });
  if (!rateOk_('inscription', 20)) throw userError_('rate_limited');
  var res = withLock_(function () {
    var sh = signupTab_();
    var now = now_(), stamp = now.toISOString();
    var last = sh.getLastRow();
    var row = 0;
    if (last >= 2) {
      var emails = sh.getRange(2, 6, last - 1, 1).getValues();
      for (var i = emails.length - 1; i >= 0; i--) if (String(emails[i][0]) === email) { row = i + 2; break; }
    }
    if (row) {
      var cur = sh.getRange(row, 1, 1, SIGNUP_HEADER.length).getValues()[0];
      sh.getRange(row, 2).setValue(stamp);
      if (prenom) sh.getRange(row, 7).setValue(txt_(prenom));
      sh.getRange(row, 19).setValue(Number(cur[18] || 1) + 1);
      return { updated: true, version: String(cur[3]) };
    }
    sh.appendRow([stamp, stamp, day_(now), version, currency === 'EUR' ? APP.prices[version] : '', txt_(email), txt_(prenom),
      APP.consentVersions[lang], txt_(page), txt_(utm.source), txt_(utm.medium), txt_(utm.campaign), txt_(utm.term), txt_(utm.content),
      txt_(sourceOf_(req)), 'liste', 'inscrit', test ? 'yes' : '', 1, lang, APP.prices[version], currency]);
    if (!test) incrementStat_({ date: day_(now), site: APP.site, page: page || '/', event: 'signup_ok', variant: version, detail: '', source: '(serveur)', medium: '', campaign: '', device: '' });
    return { updated: false, version: version };
  });
  return { ok: true, updated: res.updated, test: test };
}

/* ---------- operator view (admin key) ---------- */

function summary_(req) {
  checkAdmin_(req);
  var out = { ok: true, site: APP.site, sheetUrl: ss_().getUrl(), inscriptions: { real: 0, test: 0, byVersion: {}, bySource: {}, byLang: {} }, stats: {}, excluded: {} };
  var sh = signupTab_();
  if (sh.getLastRow() >= 2) sh.getRange(2, 1, sh.getLastRow() - 1, SIGNUP_HEADER.length).getValues().forEach(function (r) {
    var test = r[17] === 'yes';
    out.inscriptions[test ? 'test' : 'real']++;
    if (test) return;
    var lang = r[19] || 'fr', cur = r[21] || 'EUR', price = r[20] || r[4];
    var v = r[3] + ' (' + price + (cur === 'EUR' ? ' €' : ' ' + cur) + '/an)';
    out.inscriptions.byVersion[v] = (out.inscriptions.byVersion[v] || 0) + 1;
    out.inscriptions.byLang[lang] = (out.inscriptions.byLang[lang] || 0) + 1;
    out.inscriptions.bySource[r[14]] = (out.inscriptions.bySource[r[14]] || 0) + 1;
  });
  var st = tab_('Stats', STATS_HEADER);
  if (st.getLastRow() >= 2) st.getRange(2, 1, st.getLastRow() - 1, STATS_HEADER.length).getValues().forEach(function (r) {
    var k = cell_(r[0]) + ' ' + r[2] + ' ' + r[3] + (r[4] ? ' ' + r[4] : '');
    out.stats[k] = (out.stats[k] || 0) + Number(r[9] || 0);
  });
  var ex = tab_('Exclus', EXCL_HEADER);
  if (ex.getLastRow() >= 2) ex.getRange(2, 1, ex.getLastRow() - 1, EXCL_HEADER.length).getValues().forEach(function (r) {
    var k = cell_(r[0]) + ' ' + r[2] + ' ' + r[3] + ' ' + r[4];
    out.excluded[k] = (out.excluded[k] || 0) + Number(r[5] || 0);
  });
  var today = day_(now_());
  out.cro = croSummary_(today, today);
  if (req.email) out.hasEmail = sh.getLastRow() >= 2 && sh.getRange(2, 6, sh.getLastRow() - 1, 1).getValues().some(function (r) { return String(r[0]) === String(req.email).toLowerCase(); });
  return out;
}
