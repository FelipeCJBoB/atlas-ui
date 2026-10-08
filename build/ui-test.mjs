// Smoke de interface: sidebar, busca, ⌘K, detalhe (preview claro, código, licença), favoritos.
import { chromium } from 'playwright-core';
import { browserExe } from './browser.mjs';
import { readdirSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const ROOT = resolve(import.meta.dirname, '..');
const file = resolve(ROOT, process.argv[2] || 'out/atlas.html'); const out = join(ROOT, 'out/qa/ui'); mkdirSync(out, { recursive: true });
const exe = browserExe();
const b = await chromium.launch({ executablePath: exe, args: ['--enable-unsafe-swiftshader', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 1500, height: 900 } });
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto('file://' + file); await p.waitForFunction(() => window.__atlasCount > 0); await p.waitForTimeout(800);
await p.getByRole('button', { name: 'Por biblioteca' }).click(); await p.waitForTimeout(300);   // vitrine abre em "Por aplicação"
await p.getByRole('button', { name: /^Magic UI/ }).click(); await p.waitForTimeout(500);
await p.getByRole('button', { name: /^Texto/ }).click(); await p.waitForTimeout(1500);
await p.screenshot({ path: join(out, '1-magicui-texto.png') });
await p.keyboard.press('Control+k'); await p.keyboard.type('marquee'); await p.waitForTimeout(500);
await p.screenshot({ path: join(out, '2-palette.png') });
await p.keyboard.press('Enter'); await p.waitForTimeout(1200);
await p.getByRole('button', { name: 'claro' }).click(); await p.waitForTimeout(600);
await p.screenshot({ path: join(out, '3-detail-light.png') });
await p.getByRole('button', { name: 'Código' }).click(); await p.waitForTimeout(600);
await p.screenshot({ path: join(out, '4-code.png') });
await p.getByRole('button', { name: 'Licença' }).click(); await p.waitForTimeout(300);
await p.screenshot({ path: join(out, '5-license.png') });
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
await p.getByRole('button', { name: 'Favoritar' }).first().click();
console.log('hash:', await p.evaluate(() => location.hash), '| favs:', await p.evaluate(() => localStorage.getItem('atlas:favs')), '| erros:', errs.length, errs.slice(0, 3));
await b.close();
