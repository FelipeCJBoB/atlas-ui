// shiki offline: núcleo + engine JS (sem WASM) + só os idiomas/temas mais usados (evita embutir ~9 MB de gramáticas)
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

let hl: Promise<any> | null = null;
const get = () => (hl ||= createHighlighterCore({
  engine: createJavaScriptRegexEngine(),
  themes: [import('@shikijs/themes/github-dark'), import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark-default'), import('@shikijs/themes/github-light-default'), import('@shikijs/themes/vitesse-dark'), import('@shikijs/themes/vitesse-light')],
  langs: [import('@shikijs/langs/typescript'), import('@shikijs/langs/tsx'), import('@shikijs/langs/javascript'), import('@shikijs/langs/jsx'), import('@shikijs/langs/json'), import('@shikijs/langs/css'), import('@shikijs/langs/html'), import('@shikijs/langs/bash')],
}));
const ALIAS: Record<string, string> = { ts: 'typescript', js: 'javascript', sh: 'bash', shell: 'bash', shellscript: 'bash' };
export async function codeToHtml(code: string, opts: any) {
  const h = await get();
  const loaded = h.getLoadedLanguages();
  const lang = ALIAS[opts.lang] || opts.lang;
  return h.codeToHtml(code, { ...opts, lang: loaded.includes(lang) ? lang : 'text' });
}
export const codeToHast = async (code: string, opts: any) => { const h = await get(); return h.codeToHast(code, opts); };
