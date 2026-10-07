// Teste de overlays: abre cada componente, clica no primeiro gatilho e confere se o conteúdo do portal herdou os tokens da lib.
import { chromium } from 'playwright-core';
import { readdirSync, readFileSync, mkdirSync } from 'node:fs'; import { join, resolve } from 'node:path';
const file = resolve(process.argv[2]), uids = JSON.parse(readFileSync(process.argv[3], 'utf8')), out = process.argv[4] || '/tmp/portal'; mkdirSync(out, { recursive: true });
const base = '/opt/pw-browsers'; const exe = join(base, readdirSync(base).find((x) => x.startsWith('chromium_headless_shell')), 'chrome-linux/headless_shell');
const b = await chromium.launch({ executablePath: exe, args: ['--disable-gpu', '--no-sandbox', '--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, locale: 'en-US' });
await p.goto('file://' + file); await p.waitForFunction(() => window.__atlasCount > 0, null, { timeout: 90000 });
for (const uid of uids) {
  await p.evaluate((u) => window.__atlasOpen(u), uid);
  await p.waitForFunction(() => !window.__atlasPending, null, { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(700);
  const pt = await p.evaluate((u) => { const st = [...document.querySelectorAll('[data-stage]')].filter((e) => e.getAttribute('data-stage') === u).pop(); const t = st && st.querySelector('button, [role=combobox], [aria-haspopup], [data-slot$="trigger"]'); if (!t) return null; const r = t.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, uid);
  let res = { uid, clicked: false };
  try { if (!pt) throw new Error('sem gatilho'); await p.mouse.click(pt.x, pt.y); res.clicked = true; await p.waitForTimeout(900);
    res = { ...res, ...(await p.evaluate(() => { const h = document.querySelector('[data-atlas-portal]'); const w = h && h.firstElementChild; const inner = h ? [...h.querySelectorAll('*')].filter((e) => e.children.length === 0 || e.getAttribute('role')) : [];
      const c = h ? [...h.querySelectorAll('[role=dialog],[role=menu],[role=listbox],[role=tooltip],[data-slot*=content],[data-radix-popper-content-wrapper]>*')][0] : null;
      const loose = [...document.body.children].filter((e) => !e.matches('[data-atlas-portal],#root,script,style,#boot-error') && e.querySelector?.('[role=dialog],[role=menu],[role=listbox],[data-radix-popper-content-wrapper]'));
      return { portalWrap: !!w, wrapClass: w?.className || '', content: !!c, bg: c ? getComputedStyle(c).backgroundColor : null, color: c ? getComputedStyle(c).color : null, looseInBody: loose.length }; })) }; } catch (e) { res.err = String(e.message).replace(/\u001b\[\d+m/g,'').slice(0, 400); }
  await p.screenshot({ path: join(out, uid.replace(/[:/]/g, '__') + '.png') });
  console.log(JSON.stringify(res));
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
}
await b.close();
