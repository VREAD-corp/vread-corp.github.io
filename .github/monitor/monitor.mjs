// Daily independent monitor: last runs of the watched GitHub workflows, HTTP status of the public sites, per-source
// status files (/statut.json) and Apps Script alert runs, all listed in a JSON config.
//
//   node tools/monitor.mjs [--config tools/monitor-watch.json] [--dry-run]
//
// Config `mode`:
//   "issue"  any failure opens or updates ONE issue labelled `surveillance` in the repository running the workflow
//            (GitHub notifies the people in `mention` and the watchers); when everything is back to normal the issue
//            gets a comment and is closed. Use it in a PRIVATE repository.
//   "fail"   no issue: the job exits 2 on failure, so GitHub e-mails the person who last changed the workflow's
//            schedule (failed-run notification). For public repositories, where an issue would be public.
// Token: the workflow's GITHUB_TOKEN only (public repositories + the current one). Private repositories it cannot
// read answer 404 and are listed as « non vérifiables ».
import fs from 'node:fs';

let UA = 'Monitor/1.0';
const API = 'https://api.github.com';
const BAD = new Set(['failure', 'timed_out', 'startup_failure']);
export const LABEL = 'surveillance';
export const TITLE = 'Surveillance automatique : échecs détectés';

const hours = (ms) => ms / 3600e3;
const fmtH = (h) => (h < 48 ? `${Math.round(h)} h` : `${Math.round(h / 24)} j`);

/** Verdict on the runs of one workflow (newest first, as the API returns them). */
export function evaluateRuns(w, wf, runs, now) {
  const name = `${w.repo} / ${w.workflow}`;
  if (wf && wf.state && wf.state !== 'active') return { fail: `${name} : workflow désactivé (${wf.state})`, key: `${name}:disabled` };
  const rel = runs.filter((r) => r.event !== 'pull_request' && r.event !== 'pull_request_target' && (!w.events || w.events.includes(r.event)));
  if (!rel.length) return w.maxAgeHours ? { fail: `${name} : aucun run`, key: `${name}:none` } : { ok: `${name} : aucun run` };
  const done = rel.filter((r) => r.status === 'completed' && r.conclusion !== 'cancelled' && r.conclusion !== 'skipped');
  const last = done[0];
  if (last && BAD.has(last.conclusion)) {
    return { fail: `${name} : dernier run en échec (${last.conclusion}, ${last.event}, ${last.created_at.slice(0, 16).replace('T', ' ')} UTC) ${last.html_url}`, key: `${name}:failed` };
  }
  if (w.maxAgeHours) {
    const age = hours(now - Date.parse((last || rel[0]).created_at));
    if (age > w.maxAgeHours) return { fail: `${name} : pas de run réussi depuis ${fmtH(age)} (attendu : ${w.maxAgeHours} h au plus)`, key: `${name}:stale` };
  }
  return { ok: `${name} : ${last ? last.conclusion : rel[0].status}` };
}

/** Verdict on a /statut.json (veille-ao-afrique): guard, and each source's last successful read. */
export function evaluateStatus(s, url, now, maxAgeHours = 48) {
  const out = { fails: [], warns: [] };
  if (s.guard) out.fails.push({ fail: `${url} : publication bloquée par le garde-fou (${(s.guard.problems || []).join(' ; ')})`, key: `${url}:guard` });
  for (const [id, x] of Object.entries(s.sources || {})) {
    const age = x.last_success ? hours(now - Date.parse(x.last_success)) : Infinity;
    if (age > maxAgeHours) out.fails.push({ fail: `${url} : source ${x.label || id} sans lecture réussie depuis ${x.last_success ? fmtH(age) : 'toujours'}${x.error ? ` (${x.error.slice(0, 160)})` : ''}`, key: `${url}:${id}:stale` });
    else if (x.ok === false) out.warns.push(`${url} : source ${x.label || id} en échec à la dernière tentative, dernières données gardées (lecture réussie il y a ${fmtH(age)})`);
  }
  return out;
}

/** Verdict on an Apps Script `alerts_status` answer. */
export function evaluateAlerts(j, name, now, maxAgeHours = 30) {
  if (j && j.error === 'unknown_action') return { warn: `${name} : envoi des alertes pas encore activé (étape propriétaire installAlerts + redéploiement en attente)` };
  if (!j || !j.ok) return { fail: `${name} : statut des alertes illisible`, key: `${name}:alerts-unreadable` };
  if (!j.alerts) return { warn: `${name} : aucun envoi d'alertes enregistré pour l'instant` };
  const age = hours(now - Date.parse(j.alerts.at));
  if (!j.alerts.ok) return { fail: `${name} : dernier envoi d'alertes en erreur (${j.alerts.errors} erreur(s), ${j.alerts.at})`, key: `${name}:alerts-error` };
  if (age > maxAgeHours) return { fail: `${name} : dernier envoi d'alertes il y a ${fmtH(age)}`, key: `${name}:alerts-stale` };
  return { ok: `${name} : alertes ok` };
}

/** Issue body: failures, warnings, what could not be checked; a fingerprint comment to detect changes. */
export function issueBody(r, at, mention) {
  const fp = r.fails.map((f) => f.key).sort().join('|');
  const lines = [`Dernier contrôle : ${at} (UTC). ${mention ? `${mention} ` : ''}`, '', `## Échecs (${r.fails.length})`, ...r.fails.map((f) => `- [ ] ${f.fail}`)];
  if (r.warns.length) lines.push('', `## À surveiller (${r.warns.length})`, ...r.warns.map((w) => `- ${w}`));
  if (r.unchecked.length) lines.push('', `## Non vérifiables avec GITHUB_TOKEN (${r.unchecked.length})`, ...r.unchecked.map((u) => `- ${u}`));
  lines.push('', `Contrôles réussis : ${r.oks.length}. Issue mise à jour par \`.github/workflows/monitor.yml\` (tools/monitor.mjs) ; fermée automatiquement quand tout est rétabli.`, '', `<!-- fp:${fp} -->`);
  return { body: lines.join('\n'), fp };
}

/* ------------------------------------------------------------------ I/O */

async function gh(token, path, opt = {}) {
  const res = await fetch(API + path, {
    ...opt,
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': UA, 'X-GitHub-Api-Version': '2022-11-28', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opt.headers || {}) },
  });
  const text = await res.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { status: res.status, body };
}

async function http(url, tries = 2) {
  let last = '';
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(30e3) });
      const text = await res.text();
      if (res.status < 400) return { status: res.status, text };
      last = `HTTP ${res.status}`;
    } catch (e) {
      last = String(e.cause?.code || e.message || e);
    }
    if (i + 1 < tries) await new Promise((r) => setTimeout(r, 15e3));
  }
  return { error: last };
}

async function check(cfg, token, now) {
  // `repo` may omit the owner (public configs): the owner of the repository running the monitor is used.
  const owner = process.env.GITHUB_REPOSITORY_OWNER || cfg.owner || '';
  const full = (repo) => (repo.includes('/') ? repo : `${owner}/${repo}`);
  const r = { fails: [], warns: [], oks: [], unchecked: [] };
  const add = (v) => { if (v.fail) r.fails.push(v); else if (v.warn) r.warns.push(v.warn); else if (v.ok) r.oks.push(v.ok); };
  for (const w of cfg.workflows) {
    if (w.workflow === 'pages-build-deployment') { // legacy Pages build: a dynamic workflow, found by run name
      const runs = await gh(token, `/repos/${full(w.repo)}/actions/runs?per_page=30`);
      if (runs.status === 404 || runs.status === 403) { r.unchecked.push(`${w.repo} / ${w.workflow} (HTTP ${runs.status})`); continue; }
      add(evaluateRuns(w, null, ((runs.body && runs.body.workflow_runs) || []).filter((x) => x.name === 'pages-build-deployment'), now));
      continue;
    }
    const wf = await gh(token, `/repos/${full(w.repo)}/actions/workflows/${encodeURIComponent(w.workflow)}`);
    if (wf.status === 404 || wf.status === 403) { r.unchecked.push(`${w.repo} / ${w.workflow} (dépôt privé ou inaccessible : HTTP ${wf.status})`); continue; }
    if (wf.status !== 200) { r.fails.push({ fail: `${w.repo} / ${w.workflow} : API GitHub HTTP ${wf.status}`, key: `${w.repo}/${w.workflow}:api` }); continue; }
    const runs = await gh(token, `/repos/${full(w.repo)}/actions/workflows/${encodeURIComponent(w.workflow)}/runs?per_page=30&exclude_pull_requests=true`);
    add(evaluateRuns(w, wf.body, (runs.body && runs.body.workflow_runs) || [], now));
  }
  for (const s of cfg.sites) {
    const res = await http(s.url);
    if (res.error) r.fails.push({ fail: `${s.url} : inaccessible (${res.error})`, key: `${s.url}:http` });
    else if (s.contains && !res.text.includes(s.contains)) r.fails.push({ fail: `${s.url} : HTTP ${res.status} mais le texte attendu « ${s.contains} » est absent`, key: `${s.url}:content` });
    else r.oks.push(`${s.url} : HTTP ${res.status}`);
  }
  for (const s of cfg.statusFiles || []) {
    const res = await http(s.url);
    if (res.error) { r.fails.push({ fail: `${s.url} : inaccessible (${res.error})`, key: `${s.url}:http` }); continue; }
    let j;
    try { j = JSON.parse(res.text); } catch { r.fails.push({ fail: `${s.url} : JSON illisible`, key: `${s.url}:json` }); continue; }
    const v = evaluateStatus(j, s.url, now, s.maxAgeHours);
    r.fails.push(...v.fails);
    r.warns.push(...v.warns);
    if (!v.fails.length) r.oks.push(`${s.url} : sources ok`);
  }
  for (const a of cfg.alerts || []) {
    const res = await http(a.url);
    let j = null;
    try { j = res.text ? JSON.parse(res.text) : null; } catch { j = null; }
    add(evaluateAlerts(res.error ? null : j, a.name, now, a.maxAgeHours));
  }
  return r;
}

async function writeIssue(token, repo, r, at, mention) {
  const { body, fp } = issueBody(r, at, mention);
  const open = await gh(token, `/repos/${repo}/issues?state=open&labels=${LABEL}&per_page=5`);
  if (open.status !== 200) throw new Error(`issues list HTTP ${open.status}`);
  const issue = open.body.find((i) => !i.pull_request);
  if (!r.fails.length) {
    if (issue) {
      await gh(token, `/repos/${repo}/issues/${issue.number}/comments`, { method: 'POST', body: JSON.stringify({ body: `Tout est rétabli au contrôle du ${at} (UTC) : ${r.oks.length} contrôles réussis. Issue fermée automatiquement.` }) });
      await gh(token, `/repos/${repo}/issues/${issue.number}`, { method: 'PATCH', body: JSON.stringify({ state: 'closed', state_reason: 'completed' }) });
      return `issue #${issue.number} closed`;
    }
    return 'no failure, no issue';
  }
  if (!issue) {
    await gh(token, `/repos/${repo}/labels`, { method: 'POST', body: JSON.stringify({ name: LABEL, color: 'b60205', description: 'Échecs détectés par tools/monitor.mjs' }) });
    const c = await gh(token, `/repos/${repo}/issues`, { method: 'POST', body: JSON.stringify({ title: TITLE, body, labels: [LABEL] }) });
    if (c.status !== 201) throw new Error(`issue create HTTP ${c.status}`);
    return `issue #${c.body.number} opened`;
  }
  const before = /<!-- fp:(.*?) -->/.exec(issue.body || '')?.[1] ?? '';
  const u = await gh(token, `/repos/${repo}/issues/${issue.number}`, { method: 'PATCH', body: JSON.stringify({ body }) });
  if (u.status !== 200) throw new Error(`issue update HTTP ${u.status}`);
  if (before !== fp) {
    const old = new Set(before.split('|'));
    const fresh = r.fails.filter((f) => !old.has(f.key));
    const gone = before.split('|').filter((k) => k && !r.fails.some((f) => f.key === k));
    const msg = [`Changement au contrôle du ${at} (UTC). ${mention || ''}`];
    if (fresh.length) msg.push('', 'Nouveaux échecs :', ...fresh.map((f) => `- ${f.fail}`));
    if (gone.length) msg.push('', `Rétablis : ${gone.length}.`);
    await gh(token, `/repos/${repo}/issues/${issue.number}/comments`, { method: 'POST', body: JSON.stringify({ body: msg.join('\n') }) });
  }
  return `issue #${issue.number} updated${before !== fp ? ' (+ comment)' : ''}`;
}

async function main() {
  const dry = process.argv.includes('--dry-run');
  const ci = process.argv.indexOf('--config');
  const cfg = JSON.parse(fs.readFileSync(ci > 0 ? process.argv[ci + 1] : new URL('./monitor-watch.json', import.meta.url), 'utf8'));
  if (cfg.userAgent) UA = cfg.userAgent;
  const token = process.env.GITHUB_TOKEN || '';
  const now = Date.now();
  const at = new Date(now).toISOString().slice(0, 16).replace('T', ' ');
  const r = await check(cfg, token, now);
  const summary = [`# Surveillance ${at} UTC`, '', `Échecs : ${r.fails.length} · à surveiller : ${r.warns.length} · non vérifiables : ${r.unchecked.length} · ok : ${r.oks.length}`, '',
    ...r.fails.map((f) => `- ❌ ${f.fail}`), ...r.warns.map((w) => `- ⚠️ ${w}`), ...r.unchecked.map((u) => `- ⏺ ${u}`), ...r.oks.map((o) => `- ✅ ${o}`)].join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  if (dry) return;
  if (cfg.mode === 'fail') {
    if (r.fails.length) { console.log(`::error::${r.fails.length} échec(s), voir le résumé du job`); process.exitCode = 2; }
    return;
  }
  if (!token || !process.env.GITHUB_REPOSITORY) throw new Error('GITHUB_TOKEN and GITHUB_REPOSITORY are required (or --dry-run)');
  console.log(await writeIssue(token, process.env.GITHUB_REPOSITORY, r, at, (cfg.mention || []).map((m) => '@' + m).join(' ')));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
