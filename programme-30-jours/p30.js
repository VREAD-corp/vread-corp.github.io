// Programme 30 jours (page /programme-30-jours/, version 'app' ; /a/ et /b/ pendant le test de prix de décembre ; la page
// anglaise, version 'en', a été retirée le 4 novembre 2026, ses messages restent ici sans servir) : formulaire d'inscription,
// événements de mesure, pré-commande (désactivée). Langue des messages : <html lang>, envoyée au backend (lang).
// Aucun paiement ici tant que window.P30.precommande est à false. Rien de ce qui est tapé n'est envoyé à la mesure.
(function () {
  var C = window.P30 || {};
  var doc = document, html = doc.documentElement;
  var version = html.getAttribute('data-version');
  var lang = html.getAttribute('lang') === 'en' ? 'en' : 'fr';
  var T = {
    fr: {
      consent: 'Coche la case pour qu’on puisse te prévenir par e-mail.',
      ok: function (r, email) { return '<strong>C’est noté.</strong> ' + (r.updated ? 'Tu étais déjà sur la liste. ' : '') +
        'On t’écrit à ' + email + ' le jour de l’ouverture, en ' + esc(C.ouverture) + '. Rien n’a été débité.'; },
      fields: { email: 'ton adresse e-mail', prenom: 'ton prénom (lettres seulement)' },
      check: function (f) { return 'Vérifie ' + f + ', puis renvoie le formulaire.'; },
      fail: 'L’envoi n’a pas abouti. Réessaie dans une minute, ou écris à ',
    },
    en: {
      consent: 'Tick the box so we can email you.',
      ok: function (r, email) { return '<strong>You’re on the list.</strong> ' + (r.updated ? 'You had already signed up. ' : '') +
        'We’ll write to ' + email + ' on opening day, in ' + esc(C.ouverture) + '. Nothing has been charged.'; },
      fields: { email: 'your email address', prenom: 'your first name (letters only)' },
      check: function (f) { return 'Check ' + f + ', then send the form again.'; },
      fail: 'The form didn’t go through. Try again in a minute, or write to ',
    },
  }[lang];
  var q = new URLSearchParams(location.search);
  var track = function (e, d) { try { window.mTrack(e, d); } catch (err) { /* mesure coupée */ } };
  var store = function (s, k, v) { try { return v === undefined ? window[s].getItem(k) : window[s].setItem(k, v); } catch (e) { return null; } };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  // Test de prix (décembre) : même version au prochain passage par /programme-30-jours/ (une lettre, aucun identifiant).
  // Hors test, la lettre d'un ancien tirage est effacée.
  if (version === 'a' || version === 'b') store('localStorage', 'p30_version', version);
  else if (version === 'app') { try { localStorage.removeItem('p30_version'); } catch (e) { /* stockage coupé */ } }

  // Paramètres de campagne : ceux de l'adresse, sinon ceux gardés pour l'onglet à l'arrivée.
  var UTM = ['source', 'medium', 'campaign', 'term', 'content'];
  var utm = {};
  UTM.forEach(function (k) { var v = q.get('utm_' + k); if (v) utm[k] = v.slice(0, 100); });
  if (Object.keys(utm).length) store('sessionStorage', 'p30_utm', JSON.stringify(utm));
  else { try { utm = JSON.parse(store('sessionStorage', 'p30_utm') || '{}') || {}; } catch (e) { utm = {}; } }

  // Nos propres essais (?octave_notrack=1, navigateur piloté) : l'inscription est marquée « test ».
  var isTest = function () { return q.get('octave_notrack') === '1' || store('localStorage', 'octave_notrack') === '1' || !!navigator.webdriver; };

  // Défilement jusqu'au prix : une fois par page vue, quand la moitié du bloc prix est à l'écran.
  var priceBox = doc.querySelector('#prix .prix-montant');
  if (priceBox && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { track('price_view', version); io.disconnect(); } });
    }, { threshold: 0.5 });
    io.observe(priceBox);
  }

  // Ouverture du formulaire.
  var dlg = doc.getElementById('inscription');
  var f = doc.getElementById('p30-form');
  var msg = doc.getElementById('p30-msg');
  var btn = f && f.querySelector('button[type=submit]');
  if (!dlg || !f) return;
  function open() {
    if (dlg.open) return;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    track('form_open', version);
    setTimeout(function () { f.elements.email.focus(); }, 30);
  }
  function close() { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  doc.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('[data-open-form]');
    if (a) { ev.preventDefault(); open(); return; }
    if (ev.target.closest && ev.target.closest('[data-close-form]')) { ev.preventDefault(); close(); }
  });
  dlg.addEventListener('click', function (ev) { if (ev.target === dlg) close(); });
  if (location.hash === '#inscription') open();

  // Inscription.
  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    msg.className = 'p30-msg';
    msg.textContent = '';
    if (!f.elements.consent.checked) {
      msg.className = 'p30-msg err';
      msg.textContent = T.consent;
      f.elements.consent.focus();
      return;
    }
    var data = {
      action: 'inscription', lang: lang, version: version, email: f.elements.email.value.trim(), prenom: f.elements.prenom.value.trim(),
      consent: true, consent_version: C.consent, page: location.pathname, hp: f.elements.website.value, test: isTest(),
      ref_domain: (store('sessionStorage', 'p30_ref') || doc.referrer.split('/')[2] || '').replace(/^-$/, ''),
    };
    UTM.forEach(function (k) { data['utm_' + k] = utm[k] || ''; });
    btn.disabled = true;
    track('signup_submit', version);
    fetch(C.api, { method: 'POST', body: JSON.stringify(data), credentials: 'omit' })
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r.ok) { var e = new Error(r.error || 'error'); e.field = r.field; throw e; }
        try { window.octaveCro && window.octaveCro.goal('signup'); } catch (e) { /* off */ }
        f.hidden = true;
        msg.className = 'p30-msg ok';
        msg.innerHTML = T.ok(r, esc(data.email));
        btn.disabled = false;
      })
      .catch(function (e) {
        btn.disabled = false;
        msg.className = 'p30-msg err';
        var field = T.fields[e.field];
        msg.innerHTML = field ? T.check(field) : T.fail + '<a href="mailto:' + C.contact + '">' + C.contact + '</a>.';
      });
  });

  // Pré-commande payante remboursable : seulement si le drapeau est levé (config.js). Le module de paiement
  // d'octave-global-checkout n'est chargé qu'à ce moment-là.
  var pre = doc.getElementById('p30-precommande');
  var P = C.produits && C.produits[version];
  if (C.precommande === true && pre && P) {
    pre.hidden = false;
    var started = false;
    pre.querySelector('[data-precommande]').addEventListener('click', function (ev) {
      ev.preventDefault();
      if (started) return;
      started = true;
      var s = doc.createElement('script');
      s.src = '/programme-30-jours/og-checkout.js?v=1.5.0';
      s.onload = function () {
        window.OctaveCheckout.mount('#p30-pay', { product: P.product, amount: P.amount, currency: P.currency, venture: P.venture, lang: 'fr', country: 'FR' });
      };
      doc.body.appendChild(s);
    });
  }
})();
