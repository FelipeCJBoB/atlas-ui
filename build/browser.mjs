// Localiza um Chromium para o QA: $ATLAS_CHROMIUM, Chrome/Edge do Windows ou o headless_shell do Playwright (Linux).
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function browserExe() {
  if (process.env.ATLAS_CHROMIUM) return process.env.ATLAS_CHROMIUM;
  if (process.platform === 'win32') {
    const roots = [process.env['PROGRAMFILES'], process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    const rel = ['Google/Chrome/Application/chrome.exe', 'Microsoft/Edge/Application/msedge.exe'];
    for (const r of rel) for (const root of roots) { const p = join(root, r); if (existsSync(p)) return p; }
    return undefined;
  }
  const base = '/opt/pw-browsers';
  if (!existsSync(base)) return undefined;
  const d = readdirSync(base).find((x) => x.startsWith('chromium_headless_shell'));
  return d ? join(base, d, 'chrome-linux/headless_shell') : undefined;
}
