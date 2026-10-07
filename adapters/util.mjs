import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../build/common.mjs';

const ovPath = join(ROOT, 'adapters/overrides.json');
export const overrides = existsSync(ovPath) ? JSON.parse(readFileSync(ovPath, 'utf8')) : {};
// overrides.json: { "<lib>:<id>": { "flags": [...], "exclude": true, "category": "...", "wide": true, "layout": "..." } }
const autoPath = join(ROOT, 'adapters/flags.auto.json');
export const autoFlags = existsSync(autoPath) ? JSON.parse(readFileSync(autoPath, 'utf8')) : {};   // gerado pelo QA (--learn)
export const applyOverride = (e) => ({ ...e, ...(overrides[e.uid] || {}), flags: [...new Set([...(e.flags || []), ...(autoFlags[e.uid] || []), ...((overrides[e.uid] || {}).flags || [])])] });

// Classificador genérico por palavras-chave (para libs sem categorias próprias)
const CATS = [
  ['Mockups de dispositivo', /android|iphone|safari|mockup|device|macbook/],
  ['IA & Chat', /\bai\b|^ai-|-ai-|chat|prompt|agent|assistant|voice|llm|message|conversation|thinking|orb/],
  ['Gráficos & Dados', /chart|graph|stat|metric|analytic|table|heatmap|gauge|kpi|ticker|counter|number|progress/],
  ['Formulários & Inputs', /input|form|select|slider|switch|checkbox|radio|upload|picker|search|textarea|otp|calendar|date/],
  ['Botões', /button|btn|toggle|cta|\bfab/],
  ['Texto', /text|typing|type-?writer|word|letter|heading|title|hyper|morph|scramble|glitch|marquee-text|reveal|shimmer|gradient-text|counter|headline|font/],
  ['Fundos & padrões', /background|bg-|pattern|grid|meteor|particle|ripple|retro|warp|beam|aurora|noise|gradient|mesh|wave|blob|shader|dither|flow-field|lines|dots|stars|galaxy|silk|plasma|ripple/],
  ['Cards & Bento', /card|bento|tile|spotlight|glare|tilt|flip|stack/],
  ['Navegação & Layout', /nav|menu|tab|sidebar|dock|dropdown|breadcrumb|footer|header|hero|section|accordion|collapsible|toolbar|stepper|pagination|drawer|sheet|dialog|modal|popover|command|carousel|slider-|scroll|sticky|layout|container|grid-layout/],
  ['Feedback & Estado', /toast|alert|notification|loader|loading|spinner|skeleton|badge|status|banner|progress|indicator|empty|error|success/],
  ['Mídia & 3D', /video|image|photo|gallery|lens|3d|three|globe|map|cursor|pointer|confetti|avatar|icon|logo|cloud|orbit|model/],
];
export const categorize = (s) => (CATS.find(([, rx]) => rx.test(s.toLowerCase())) || ['Outros'])[0];
