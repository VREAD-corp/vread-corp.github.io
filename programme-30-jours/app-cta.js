// Bouton « Commencer maintenant, 14 jours gratuits » (Tanguy, 05/11/2026).
// Sur iPhone : App Store ; sur Android : Google Play ; ailleurs : les deux liens.
// Visite venue d'une pub Meta (utm_source=meta) : code ct=meta-<utm_content> pour compter les installations par pub.
(function () {
  var q = new URLSearchParams(location.search);
  var clean = function (v, n) { return String(v || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, n); };
  var src = clean(q.get('utm_source'), 30);
  var ua = navigator.userAgent || '';
  var ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  var android = /Android/.test(ua);
  var as = 'https://apps.apple.com/fr/app/vread/id6752836822?pt=128157942&ct=p30-direct&mt=8';
  var gp = 'https://play.google.com/store/apps/details?id=com.vread.app&referrer=' + encodeURIComponent('utm_source=outils.vread.fr&utm_campaign=programme-30-jours');
  if (src === 'meta') {
    var content = clean(q.get('utm_content'), 34) || 'pub';
    var camp = clean(q.get('utm_campaign'), 60);
    as = 'https://apps.apple.com/fr/app/vread/id6752836822?pt=128157942&ct=' + ('meta-' + content).slice(0, 40) + '&mt=8';
    gp = 'https://play.google.com/store/apps/details?id=com.vread.app&referrer=' + encodeURIComponent('utm_source=meta&utm_medium=paid_social&utm_campaign=' + camp + '&utm_content=' + content);
  }
  document.querySelectorAll('[data-app-cta]').forEach(function (box) {
    box.querySelectorAll('[data-store="ios"]').forEach(function (a) { a.href = as; });
    box.querySelectorAll('[data-store="android"]').forEach(function (a) { a.href = gp; });
    var btn = box.querySelector('[data-store-btn]');
    if (btn) btn.href = android ? gp : as;
    var links = box.querySelector('[data-store-links]');
    if (links && (ios || android)) links.hidden = true;
  });
})();
