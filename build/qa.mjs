#!/usr/bin/env node
// QA em Chromium headless via file://:  node build/qa.mjs [out/atlas.html] [--libs=a,b] [--shots] [--only=substr]
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const file = resolve(ROOT, process.argv.find((a) => a.endsWith('.html')) || 'out/atlas-full.html');
const arg = (k, d = '') => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=')[1] ?? d;
const libs = arg('libs').split(',').filter(Boolean), onlyStr = arg('only'), shots = process.argv.includes('--shots');
const QA = join(ROOT, 'out/qa'); mkdirSync(join(QA, 'shots'), { recursive: true });
const exe = (() => { const base = '/opt/pw-browsers'; const d = readdirSync(base).find((x) => x.startsWith('chromium_headless_shell')); return d ? join(base, d, 'chrome-linux/headless_shell') : undefined; })();

const browser = await chromium.launch({ executablePath: exe, args: [...(process.argv.includes('--webgl') ? ['--enable-unsafe-swiftshader'] : ['--disable-gpu', '--disable-3d-apis']), '--no-sandbox', '--allow-file-access-from-files'] });
let cur = '(boot)'; const errs = {}, ext = {}, types = {};
const note = (m, k, v) => { (m[k] ||= new Set()).add(v); };
let page;
async function openPage() {
  if (page) await page.close({ runBeforeUnload: false }).catch(() => {});
  page = await browser.newPage({ viewport: { width: 1500, height: 900 }, locale: 'en-US' });
page.on('console', (m) => { if (m.type() === 'error' && !/<(line|path|rect|circle)> attribute \w+: Expected length|Error accessing webcam/.test(m.text())) note(errs, cur, m.text().slice(0, 200)); });
page.on('pageerror', (e) => note(errs, cur, 'pageerror: ' + String(e.message).slice(0, 200)));
page.on('requestfailed', (r) => { const u = r.url(); if (!/^(file|data|blob):/.test(u)) note(ext, cur, u.slice(0, 120)); else if (u.startsWith('file:///') && !u.includes(file) && r.resourceType() === 'image') (types[cur] ||= {})['@local:' + decodeURIComponent(u.slice(7))] = 'local-miss'; });
page.on('request', (r) => { const u = r.url(); if (!/^(file|data|blob|about):/.test(u)) { note(ext, cur, u.slice(0, 160)); (types[cur] ||= {})[u] = r.resourceType(); } });
  page.on('response', (r) => { const u = r.url(); if (r.status() >= 400 && !/^(file|data|blob):/.test(u)) note(errs, cur, `HTTP ${r.status()} ${u.slice(0, 120)}`); });
  await page.goto('file://' + file + '#q=zzzzqq'); await page.waitForFunction(() => window.__atlasCount > 0, null, { timeout: 150000 });
  await page.waitForTimeout(1200);
}
await openPage();
const boot = await page.evaluate(() => ({ n: window.__atlasCount, tiles: document.querySelectorAll('[data-tile]').length, boot: document.getElementById('boot-error').style.display }));
console.log('boot:', JSON.stringify(boot));
const all = await page.evaluate(() => window.__atlasUids || []);
if (process.argv.includes('--home')) await page.screenshot({ path: join(QA, 'home.png') });
await page.waitForTimeout(400);

const uidsFile = arg('uids'), uidSet = uidsFile ? new Set(JSON.parse(readFileSync(uidsFile, 'utf8'))) : null;
const list = all.filter((u) => (!libs.length || libs.includes(u.split(':')[0])) && (!onlyStr || u.includes(onlyStr)) && (!uidSet || uidSet.has(u)));
const rows = [];
const T = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TIMEOUT ' + label)), ms))]);
for (const uid of list) {
  cur = uid;
  try {
  await T(page.evaluate(() => { window.__atlasErrors = []; }), 8000, 'reset');
  await T(page.evaluate((u) => window.__atlasOpen(u), uid), 8000, 'open');
  await page.waitForTimeout(300);
  await page.waitForFunction(() => !window.__atlasPending, null, { timeout: 20000 }).catch(() => {});   // libs sob demanda: espera o carregamento
  await page.waitForTimeout(700);
  const loc = page.locator(`[data-stage="${uid}"]`).last();
  const info = await T(loc.evaluate((el) => ({ h: el.offsetHeight, w: el.offsetWidth, kids: el.querySelectorAll('*').length, iw: (el.firstElementChild?.firstElementChild || {}).offsetWidth ?? -1, ih: (el.firstElementChild?.firstElementChild || {}).offsetHeight ?? -1, text: (el.innerText || '').length, imgs: [...el.querySelectorAll('img')].filter((i) => !i.complete || !i.naturalWidth).length })), 10000, 'info').catch(() => null);
  const renderErr = await T(page.evaluate(() => window.__atlasErrors || []), 8000, 'errs');
  let stdev = null, soft = null;
  try { const bb = await T(loc.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth - Math.max(0, r.x)), height: Math.min(r.height, innerHeight - Math.max(0, r.y)) }; }), 8000, 'bbox');
  const buf = await T(page.screenshot({ clip: bb, timeout: 9000, animations: 'allow', caret: 'initial' }), 11000, 'shot'); const st = await sharp(buf).greyscale().stats(); stdev = +st.channels[0].stdev.toFixed(1); if (shots) await sharp(buf).resize({ width: 480, withoutEnlargement: true }).jpeg({ quality: 70 }).toFile(join(QA, 'shots', uid.replace(/[:/]/g, '__') + '.jpg')); } catch (e) { soft = 'screenshot-timeout (GPU por software)'; }
  rows.push({ uid, info, stdev, soft, renderErr, errs: [...(errs[uid] || [])], ext: [...(ext[uid] || [])] });
  } catch (e) { console.log('✗ HANG/ERRO', uid, e.message.slice(0, 80)); rows.push({ uid, info: null, stdev: null, renderErr: [], errs: ['HANG: ' + e.message.slice(0, 80)], ext: [] }); await openPage(true); }
}
await page.evaluate(() => window.__atlasOpen(null));
const flagsAuto = existsSync(join(ROOT, 'adapters/flags.auto.json')) ? JSON.parse(readFileSync(join(ROOT, 'adapters/flags.auto.json'), 'utf8')) : {};
const ovr = existsSync(join(ROOT, 'adapters/overrides.json')) ? JSON.parse(readFileSync(join(ROOT, 'adapters/overrides.json'), 'utf8')) : {};
const netOk = (r) => (flagsAuto[r.uid] || []).includes('needs-network') || (ovr[r.uid]?.flags || []).includes('needs-network');   // rede esperada nesses
const isGl = (t) => /webgl|WebGL|GL context|getContext|setting 'renderer'|getExtension|VGPUError|requestAdapter|navigator\.gpu/i.test(t);
for (const r of rows) if (!process.argv.includes('--webgl') && (r.errs.some(isGl) || r.renderErr.some(isGl))) { r.soft = (r.soft ? r.soft + '; ' : '') + 'needs-webgl'; r.errs = r.errs.filter((t) => !isGl(t)); r.renderErr = r.renderErr.filter((t) => !isGl(t)); }
const bad = rows.filter((r) => r.renderErr.length || (!netOk(r) && (r.errs.length || r.ext.length)) || !r.info || (r.info.kids < 1 && r.info.text === 0));
const blank = rows.filter((r) => r.stdev !== null && r.stdev < 1.5);
writeFileSync(join(QA, arg('tag') ? `report-${arg('tag')}.json` : 'report.json'), JSON.stringify({ boot, bootErrors: [...(errs['(boot)'] || [])], bootExt: [...(ext['(boot)'] || [])], rows }, null, 1));
console.log(`testados: ${rows.length} | com problema: ${bad.length} | possivelmente em branco: ${blank.length}`);
console.log('erros no boot:', [...(errs['(boot)'] || [])].slice(0, 5), '| requisições externas no boot:', [...(ext['(boot)'] || [])].slice(0, 5));
for (const r of bad.slice(0, 80)) console.log('✗', r.uid, JSON.stringify({ render: r.renderErr.slice(0, 1), errs: r.errs.slice(0, 2), ext: r.ext.slice(0, 2), kids: r.info?.kids }));
console.log('shots soft-timeout:', rows.filter((r) => r.soft).map((r) => r.uid).join(' '));
console.log('em branco:', blank.map((r) => r.uid).join(' '));
if (process.argv.includes('--learn')) {
  // URLs de imagem pedidas em runtime (dinâmicas) → cache/learned.json (o build embute e redireciona);
  // pedidos não-imagem (vídeo, iframe, fetch…) → flag needs-network.
  const lp = join(ROOT, 'cache/learned.json'), fp = join(ROOT, 'adapters/flags.auto.json');
  const raw = existsSync(lp) ? JSON.parse(readFileSync(lp, 'utf8')) : {};
  const learned = Array.isArray(raw) ? { _legacy: raw } : raw;               // { lib: [urls] }
  const flags = existsSync(fp) ? JSON.parse(readFileSync(fp, 'utf8')) : {};
  const touched = new Set([...rows.map((r) => r.uid.split(':')[0])]);
  const fresh = {}; for (const l of touched) fresh[l] = new Set();
  for (const [uid, m] of Object.entries(types)) for (const [u, t] of Object.entries(m)) {
    if (uid === '(boot)') continue;
    const lib = uid.split(':')[0];
    if (t === 'local-miss') fresh[lib]?.add(u.slice(7)); else if (t === 'image') fresh[lib]?.add(u); else if (/^(media|document|fetch|xhr|script|stylesheet|font|websocket|eventsource)$/.test(t) && !(/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/.test(u))) flags[uid] = [...new Set([...(flags[uid] || []), 'needs-network'])];
  }
  for (const l of touched) learned[l] = [...new Set([...(learned[l] || []), ...fresh[l]])].sort();
  writeFileSync(lp, JSON.stringify(learned, null, 1)); writeFileSync(fp, JSON.stringify(flags, null, 1));
  console.log(`learn: ${Object.entries(learned).map(([k, v]) => k + '=' + v.length).join(' ')}; ${Object.keys(flags).length} componentes com needs-network`);
}
await browser.close();
