/*! Temps d'écran en livres (outils.vread.fr, READ FRANCE SAS). Le calcul se fait dans le navigateur : rien de ce qui est saisi n'est envoyé. */
(() => {
  'use strict';
  const d = document, EN = d.documentElement.lang === 'en';
  const $ = (id) => d.getElementById(id);
  const form = $('te-form');
  if (!form) return;

  // Word counts measured by READ FRANCE on the public-domain texts it already uses (whitespace split).
  const BOOKS = EN ? [
    ['jekyll', 'Strange Case of Dr Jekyll and Mr Hyde', 25631],
    ['carol', 'A Christmas Carol', 28541],
    ['gatsby', 'The Great Gatsby', 48208],
    ['awakening', 'The Awakening', 64028],
    ['frankenstein', 'Frankenstein (1831)', 77965],
    ['wuthering', 'Wuthering Heights', 115945],
    ['eyre', 'Jane Eyre', 185390],
  ] : [
    ['dernier-jour', 'Le Dernier Jour d’un condamné', 24082],
    ['candide', 'Candide', 33346],
    ['pierre-et-jean', 'Pierre et Jean', 44363],
    ['therese-raquin', 'Thérèse Raquin', 67805],
    ['madame-bovary', 'Madame Bovary', 116468],
    ['pot-bouille', 'Pot-Bouille', 141005],
    ['bonheur-des-dames', 'Au Bonheur des Dames', 152883],
  ];
  const DEF = EN ? { t: 201, v: 238, l: 'awakening' } : { t: 201, v: 214, l: 'therese-raquin' };
  const LOC = EN ? 'en-GB' : 'fr-FR';
  const URL_BASE = 'https://outils.vread.fr' + (EN ? '/en/screen-time-to-books/' : '/temps-ecran-en-livres/');

  const T = EN ? {
    hm: (t) => { const h = Math.floor(t / 60), m = t % 60; return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`; },
    kind: { t: 'of screen time', s: 'on social apps' },
    book: (n) => n === 1 ? 'book' : 'books',
    other: 'a book of your length',
    summary: (o) => `${o.time} a day ${o.kindTxt} adds up to ${o.hours} hours a year. Read at ${o.v} words a minute, that time would cover <strong>${o.year} ${o.bookW} a year</strong>, or ${o.month} a month, of the length of ${o.title} (${o.words} words).`,
    twenty: (o) => `With 20 minutes a day, you would finish <strong>${o.y20} ${o.bookW20}</strong> like ${o.title} in a year: one every ${o.days} days.`,
    cardTitle: 'MY SCREEN TIME IN BOOKS',
    cardLine: (o) => `${o.time} a day ${o.kindTxt}`,
    cardHours: (o) => `= ${o.hours} hours a year`,
    cardUnit: (o) => `${o.bookW} a year, if I read for all that time`,
    cardNote: (o) => `Books of ${o.words} words like ${o.title}, at ${o.v} words a minute`,
    card20a: 'With 20 minutes a day:',
    card20b: (o) => `${o.y20} ${o.bookW20} in a year`,
    cardPile: 'The year’s pile at 20 minutes a day',
    cardFoot: 'Vread · outils.vread.fr/en/screen-time-to-books',
    copied: 'Link copied',
    copyFail: 'Copy this link:',
    shareText: (o) => `My screen time in books: ${o.year} a year. With 20 minutes a day, ${o.y20} in a year.`,
    file: 'screen-time-in-books.png',
    bad: 'Enter a time between 1 minute and 24 hours a day.',
  } : {
    hm: (t) => { const h = Math.floor(t / 60), m = t % 60; return h ? (m ? `${h}\u00a0h\u00a0${String(m).padStart(2, '0')}` : `${h} h`) : `${m} min`; },
    kind: { t: 'de temps d’écran', s: 'sur les réseaux sociaux' },
    book: (n) => n < 2 ? 'livre' : 'livres',
    other: 'un livre de cette longueur',
    summary: (o) => `${o.time} par jour ${o.kindTxt}, c’est ${o.hours} heures par an. À ${o.v} mots par minute, ce temps suffirait pour lire <strong>${o.year} ${o.bookW} par an</strong>, soit ${o.month} par mois, de la longueur de ${o.title} (${o.words} mots).`,
    twenty: (o) => `Avec 20 minutes par jour, tu finirais <strong>${o.y20} ${o.bookW20}</strong> comme ${o.title} en un an\u00a0: un tous les ${o.days} jours.`,
    cardTitle: 'MON TEMPS D’ÉCRAN EN LIVRES',
    cardLine: (o) => `${o.time} par jour ${o.kindTxt}`,
    cardHours: (o) => `= ${o.hours} heures par an`,
    cardUnit: (o) => `${o.bookW} par an, si je lisais pendant tout ce temps`,
    cardNote: (o) => `Livres de ${o.words} mots comme ${o.title}, à ${o.v} mots par minute`,
    card20a: 'Avec 20 minutes par jour\u00a0:',
    card20b: (o) => `${o.y20} ${o.bookW20} en un an`,
    cardPile: 'La pile de l’année, à 20 minutes par jour',
    cardFoot: 'Vread · outils.vread.fr/temps-ecran-en-livres',
    copied: 'Lien copié',
    copyFail: 'Copie ce lien\u00a0:',
    shareText: (o) => `Mon temps d’écran en livres\u00a0: ${o.year} par an. Avec 20 minutes par jour, ${o.y20} en un an.`,
    file: 'temps-ecran-en-livres.png',
    bad: 'Indique un temps entre 1 minute et 24 heures par jour.',
  };

  const nf = (n, dec) => n.toLocaleString(LOC, { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  const books = (n) => nf(n, n >= 10 ? 0 : 1);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Fields
  const fH = $('te-h'), fM = $('te-m'), fV = $('te-v'), fL = $('te-l'), fW = $('te-w'), wRow = $('te-w-row');
  const out = $('te-out'), sum = $('te-sum'), tw = $('te-20'), err = $('te-err'), ex = $('te-ex');
  const cv = $('te-card'), dl = $('te-dl'), cp = $('te-copy'), sh = $('te-share'), msg = $('te-msg'), ping = $('te-ping');
  BOOKS.forEach(([id, title, w]) => fL.add(new Option(`${title} (${nf(w, 0)} ${EN ? 'words' : 'mots'})`, id)));
  fL.add(new Option(EN ? 'Other length (words)' : 'Autre longueur (mots)', 'autre'));

  const kind = () => (form.querySelector('input[name="k"]:checked') || {}).value === 's' ? 's' : 't';
  const read = () => {
    const t = Math.round((+fH.value || 0) * 60 + (+fM.value || 0));
    const v = Math.min(600, Math.max(80, Math.round(+fV.value || DEF.v)));
    const b = BOOKS.find((x) => x[0] === fL.value);
    const w = b ? b[2] : Math.min(500000, Math.max(5000, Math.round(+fW.value || 0)));
    return { t, v, w, l: b ? b[0] : '', title: b ? b[1] : T.other, k: kind() };
  };

  let last = null;
  const compute = (s) => {
    const year = (s.t * s.v * 365) / s.w, y20 = (20 * s.v * 365) / s.w;
    return {
      ...s, year: books(year), month: books(year / 12), y20: books(y20), y20n: y20,
      bookW: T.book(year), bookW20: T.book(y20),
      days: nf(Math.max(1, Math.ceil(s.w / (20 * s.v))), 0),
      hours: nf(Math.round((s.t * 365) / 60), 0), time: T.hm(s.t), v: nf(s.v, 0), words: nf(s.w, 0),
      kindTxt: T.kind[s.k], title: s.title,
    };
  };
  const shareUrl = (s, utm) => {
    const q = new URLSearchParams({ t: s.t, k: s.k, v: s.v });
    s.l ? q.set('l', s.l) : q.set('w', s.w);
    if (utm) { q.set('utm_source', 'partage'); q.set('utm_medium', 'outil-temps-ecran'); }
    return URL_BASE + '?' + q;
  };

  const render = (pushUrl) => {
    wRow.hidden = fL.value !== 'autre';
    const s = read();
    if (s.t < 1 || s.t > 1440) { err.textContent = T.bad; err.hidden = false; return; }
    err.hidden = true;
    const o = compute(s);
    last = o;
    sum.innerHTML = T.summary({ ...o, title: '<em>' + esc(o.title) + '</em>' });
    tw.innerHTML = T.twenty({ ...o, title: '<em>' + esc(o.title) + '</em>' });
    out.hidden = false;
    draw(cv, o);
    if (pushUrl) try { history.replaceState(null, '', shareUrl(s).replace('https://outils.vread.fr', '')); } catch (e) { /* file:// */ }
  };

  // Card: 1080 x 1350 (download, portrait for messaging and social apps) or 1200 x 630 (og:image)
  const C = { bg: '#f8fafc', card: '#ffffff', fg: '#0f172a', muted: '#475569', line: '#dbe2ea', accent: '#4338ca' };
  const SPINES = ['#4338ca', '#0f766e', '#b45309', '#be123c', '#1d4ed8', '#6d28d9', '#15803d', '#a16207'];
  const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  function wrap(ctx, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w; y += lh; } else line = test;
    }
    ctx.fillText(line, x, y);
    return y + lh;
  }
  function pile(ctx, n, x, y, maxW, h) {
    // one spine per book read at 20 minutes a day, capped at 40; heights and colours vary like a real shelf
    const count = Math.max(1, Math.min(40, Math.round(n))), gap = 6;
    const sw = Math.min(34, (maxW - gap * (count - 1)) / count);
    for (let i = 0; i < count; i++) {
      const hh = h * (0.72 + ((i * 37) % 23) / 80);
      ctx.fillStyle = SPINES[i % SPINES.length];
      ctx.fillRect(x + i * (sw + gap), y + h - hh, sw, hh);
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      ctx.fillRect(x + i * (sw + gap) + sw * 0.2, y + h - hh + hh * 0.12, sw * 0.6, 3);
    }
    if (n > 40) { ctx.fillStyle = C.muted; ctx.font = `600 28px ${FONT}`; ctx.fillText('+' + nf(Math.round(n) - 40, 0), x + count * (sw + gap) + 4, y + h - 6); }
  }
  function draw(canvas, o) {
    const W = canvas.width, H = canvas.height, land = W > H, ctx = canvas.getContext('2d');
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const P = land ? 56 : 72;
    ctx.fillStyle = C.card; ctx.fillRect(P / 2, P / 2, W - P, H - P);
    ctx.fillStyle = C.accent; ctx.fillRect(P / 2, P / 2, W - P, 12);
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    const x = P + 8, colW = land ? W * 0.52 - x : W - 2 * x;
    let y = land ? 110 : 150;
    ctx.fillStyle = C.accent; ctx.font = `800 ${land ? 26 : 34}px ${FONT}`; ctx.fillText(T.cardTitle, x, y);
    y += land ? 56 : 84;
    ctx.fillStyle = C.fg; ctx.font = `700 ${land ? 36 : 52}px ${FONT}`; y = wrap(ctx, T.cardLine(o), x, y, colW, land ? 44 : 64);
    ctx.fillStyle = C.muted; ctx.font = `500 ${land ? 28 : 40}px ${FONT}`; ctx.fillText(T.cardHours(o), x, y);
    y += land ? 150 : 225;
    ctx.fillStyle = C.accent; ctx.font = `800 ${land ? 150 : 230}px ${FONT}`; ctx.fillText(o.year, x - 6, y);
    y += land ? 48 : 70;
    ctx.fillStyle = C.fg; ctx.font = `700 ${land ? 28 : 40}px ${FONT}`; y = wrap(ctx, T.cardUnit(o), x, y, colW, land ? 36 : 52);
    ctx.fillStyle = C.muted; ctx.font = `500 ${land ? 21 : 30}px ${FONT}`; y = wrap(ctx, T.cardNote(o), x, y + 4, colW, land ? 28 : 40);
    let x2 = x, y2 = y + (land ? 0 : 40), w2 = colW;
    if (land) { x2 = W * 0.56; y2 = 150; w2 = W - x2 - P - 8; }
    else { ctx.fillStyle = C.line; ctx.fillRect(x, y2 - 20, colW, 3); y2 += 50; }
    ctx.fillStyle = C.fg; ctx.font = `600 ${land ? 30 : 44}px ${FONT}`; ctx.fillText(T.card20a, x2, y2);
    y2 += land ? 64 : 84;
    ctx.fillStyle = C.accent; ctx.font = `800 ${land ? 52 : 72}px ${FONT}`; y2 = wrap(ctx, T.card20b(o), x2, y2, w2, land ? 60 : 84);
    // the pile fills the space left between the 20-minute line and the footer
    const footY = H - P / 2 - (land ? 22 : 34), bottom = footY - (land ? 70 : 96);
    const py = y2 - (land ? 30 : 40), ph = Math.max(60, Math.min(land ? 190 : 210, bottom - py));
    pile(ctx, o.y20n, x2, bottom - ph, w2 - 60, ph);
    ctx.fillStyle = C.line; ctx.fillRect(x2, bottom + 2, w2, 3);
    ctx.fillStyle = C.muted; ctx.font = `500 ${land ? 20 : 26}px ${FONT}`; ctx.fillText(T.cardPile, x2, bottom + (land ? 32 : 40));
    ctx.fillStyle = C.muted; ctx.font = `600 ${land ? 20 : 28}px ${FONT}`; ctx.fillText(T.cardFoot, land ? x2 : x, footY);
  }
  window.teDraw = (canvas) => last && draw(canvas, last); // used once to render the static og:image

  // Events: the first change sends one anonymous `tool_use` (mesure.js, data-mesure); nothing typed is sent.
  let used = false;
  const use = () => { if (!used) { used = true; ex.hidden = true; ping && ping.click(); } };
  form.addEventListener('input', () => { use(); render(true); });
  form.addEventListener('change', () => render(true));
  form.addEventListener('submit', (e) => { e.preventDefault(); use(); render(true); out.scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  const say = (t) => { msg.textContent = t; msg.hidden = false; };
  dl.addEventListener('click', () => {
    if (!last) return;
    cv.toBlob((b) => { const a = d.createElement('a'); a.href = URL.createObjectURL(b); a.download = T.file; d.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }, 'image/png');
  });
  cp.addEventListener('click', async () => {
    if (!last) return;
    const u = shareUrl(last, true);
    try { await navigator.clipboard.writeText(u); say(T.copied); } catch (e) { say(T.copyFail + ' ' + u); }
  });
  if (navigator.share) {
    sh.hidden = false;
    sh.addEventListener('click', () => {
      if (!last) return;
      const u = shareUrl(last, true), data = { title: d.title, text: T.shareText(last), url: u };
      cv.toBlob(async (b) => {
        const f = new File([b], T.file, { type: 'image/png' });
        try { await navigator.share(navigator.canShare && navigator.canShare({ files: [f] }) ? { ...data, files: [f] } : data); } catch (e) { /* cancelled */ }
      }, 'image/png');
    });
  }

  // Start: URL parameters (a shared result) or the French average (CNL 2025), shown as an example.
  const q = new URLSearchParams(location.search);
  const t0 = Math.round(+q.get('t')) || DEF.t;
  fH.value = Math.floor(t0 / 60); fM.value = t0 % 60;
  fV.value = Math.round(+q.get('v')) || DEF.v;
  if (q.get('k') === 's') { const r = form.querySelector('input[name="k"][value="s"]'); if (r) r.checked = true; }
  if (q.get('l') && BOOKS.some((b) => b[0] === q.get('l'))) fL.value = q.get('l');
  else if (+q.get('w')) { fL.value = 'autre'; fW.value = Math.round(+q.get('w')); } else fL.value = DEF.l;
  if (q.has('t')) ex.hidden = true;
  render(false);
})();
