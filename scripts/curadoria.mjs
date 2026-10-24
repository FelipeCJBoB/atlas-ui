#!/usr/bin/env node
// Curadoria do Atlas: decide o que fica na biblioteca (difícil de fazer sem instrução) e o que sai (a IA já faz).
//   node scripts/curadoria.mjs            → curadoria/proposta.json (automático) + resumo no console
// Decisão final = curadoria/decisoes.json (triagem manual: { uid: "keep" | "drop" }) por cima da proposta.
// Nada é apagado: vendor/ fica intacto; build e índice só filtram (build/curadoria.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
// entrada: catálogo completo ANTES da curadoria (out/catalog.todos.json, gravado pelo build full); na 1ª vez, o índice
const TODOS = join(ROOT, 'out/catalog.todos.json');
const rows = existsSync(TODOS) ? JSON.parse(readFileSync(TODOS, 'utf8'))
  : readFileSync(join(ROOT, 'catalogo/catalog.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));

const LIBS_HTML_GENERICAS = ['daisyui', 'flowbite', 'hyperui', 'materialtailwind'];
const ICONES = { manter: 'lucideanimated', sair: ['itshover'] };
// primitivos shadcn (kibo/reui): variações de botão, input, diálogo… que a IA monta sem instrução
const PRIMITIVOS = new Set(['Button', 'Button Group', 'Input Group', 'Input', 'Avatar', 'Badge', 'Checkbox', 'Radio Group', 'Switch', 'Toggle', 'Toggle Group', 'Label', 'Separator', 'Textarea', 'Kbd', 'Field', 'Form', 'Alert', 'Alert Dialog', 'Dialog', 'Sheet', 'Drawer', 'Popover', 'Tooltip', 'Hover Card', 'Dropdown Menu', 'Context Menu', 'Menubar', 'Navigation Menu', 'Breadcrumb', 'Pagination', 'Accordion', 'Collapsible', 'Tabs', 'Skeleton', 'Spinner', 'Progress', 'Slider', 'Scroll Area', 'Aspect Ratio', 'Card', 'Item', 'Empty', 'Select', 'Native Select', 'Combobox', 'Command', 'Sonner', 'Table', 'Calendar', 'Date Picker', 'Input Otp', 'Chart', 'Icon Tile', 'Icon Stack', 'Frame', 'Sidebar', 'Carousel', 'Number Field', 'Phone Input', 'Autocomplete', 'Date Selector', 'Scrollspy', 'Marker', 'Rating', 'Botões', 'Texto']);
// blocos de landing do kibo (seções de marketing comuns)
const KIBO_BLOCOS = /^(About|Announcement|Awards|Banner|Blog|Blogpost|Careers|Case Stud|Changelog|Community|Compliance|Contact|Download|Experience|Faq|Feature|Form|Pricing|Stats|Team|Testimonial|Typography|Table|List|Codebase|Code$)/;

const TECH = {
  raf: /requestAnimationFrame|useAnimationFrame/, canvas: /getContext\(|<canvas/i,
  gl: /WebGL|THREE\.|from ['"]three|shader|gl_FragColor|from ['"]ogl|@react-three/,
  motion: /useSpring|useMotionValue|useTransform|useScroll|useInView|useAnimate|AnimatePresence|layoutId|variants/,
  gesto: /drag|onPointerMove|onMouseMove|gesture|touchmove/i, observer: /IntersectionObserver|ResizeObserver|MutationObserver/,
  keyframes: /@keyframes|keyframes\s*:/, '3d': /perspective|preserve-3d|rotateX|rotateY|rotate3d/,
  mascara: /clip-path|mask-image|-webkit-mask|mix-blend|backdrop-filter|feTurbulence|feDisplacement|filter:\s*url/,
  svg: /stroke-dash|strokeDash|pathLength|<animate|offset-path/, dnd: /@dnd-kit|react-dnd|Sortable/,
};
const read = (r, f) => { const p = f.startsWith('@gen/') ? join(ROOT, 'src/gen', f.slice(5)) : join(ROOT, 'vendor', r.lib, f); return existsSync(p) ? readFileSync(p, 'utf8') : ''; };
const medir = (r) => {
  // só os arquivos do próprio componente (o 1º), não os primitivos/utilitários que ele importa
  const src = (r.files || []).filter((f) => !/\.stories\.|\.md$|LICENSE|lib\/utils|components\/ui\/|\/ui\//.test(f)).slice(0, 2).map((f) => read(r, f)).join('\n');
  const t = Object.entries(TECH).filter(([, re]) => re.test(src)).map(([k]) => k);
  return { loc: src.split('\n').filter((x) => x.trim()).length, t, kf: (src.match(/@keyframes/g) || []).length };
};

const out = {};
const P = (r, d, why, m) => { out[r.uid] = { d, why, lib: r.lib, fn: r.fn, cat: r.category, name: r.name, ...(m ? { loc: m.loc, t: m.t } : {}) }; };
for (const r of rows) {
  if (LIBS_HTML_GENERICAS.includes(r.lib)) { P(r, 'drop', 'biblioteca HTML genérica (template)'); continue; }
  if (ICONES.sair.includes(r.lib)) { P(r, 'drop', `pacote de ícones duplicado (fica ${ICONES.manter})`); continue; }
  if (r.lib === ICONES.manter) { P(r, 'keep', 'pacote de ícones animados escolhido'); continue; }
  const m = medir(r);
  if (r.lib === 'kibo' || r.lib === 'reui') {
    const base = r.category.split(' · ')[0];
    if (PRIMITIVOS.has(base)) { P(r, 'drop', `primitivo shadcn (${base})`, m); continue; }
    if (r.lib === 'kibo' && KIBO_BLOCOS.test(r.name)) { P(r, 'drop', 'bloco de landing comum', m); continue; }
    P(r, 'triage', `componente composto (${base === 'Outros' ? r.name.split(' ')[0] : base})`, m); continue;
  }
  if (r.lib === 'uiverse') {
    const forte = m.t.filter((k) => ['3d', 'mascara', 'svg', 'canvas', 'raf'].includes(k)).length;
    if ((m.kf >= 2 && forte >= 1) || (m.kf >= 1 && m.loc >= 200) || m.kf >= 4) { P(r, 'keep', `CSS animado (${m.kf} keyframes${forte ? ', ' + m.t.join('/') : ''})`, m); continue; }
    if (m.kf === 0 && forte === 0) { P(r, 'drop', 'CSS estático/hover simples', m); continue; }
    P(r, 'triage', `CSS com ${m.kf} keyframes`, m); continue;
  }
  // bibliotecas de efeito/animação (React): ficam, salvo as triviais
  if (m.t.length >= 1 || m.loc >= 80) { P(r, 'keep', m.t.length ? `técnica: ${m.t.join('/')}` : `${m.loc} linhas`, m); continue; }
  P(r, 'triage', `simples (${m.loc} linhas, sem técnica detectada)`, m);
}

mkdirSync(join(ROOT, 'curadoria'), { recursive: true });
writeFileSync(join(ROOT, 'curadoria/proposta.json'), JSON.stringify(out, null, 0).replace(/\},"/g, '},\n"'));
const tab = {};
for (const v of Object.values(out)) { const t = (tab[v.lib] ||= { keep: 0, triage: 0, drop: 0 }); t[v.d]++; }
const tot = { keep: 0, triage: 0, drop: 0 };
console.log('lib'.padEnd(18), 'fica'.padStart(6), 'triagem'.padStart(8), 'sai'.padStart(6));
for (const [k, t] of Object.entries(tab).sort((a, b) => b[1].keep + b[1].triage - a[1].keep - a[1].triage)) { console.log(k.padEnd(18), String(t.keep).padStart(6), String(t.triage).padStart(8), String(t.drop).padStart(6)); for (const d in tot) tot[d] += t[d]; }
console.log('TOTAL'.padEnd(18), String(tot.keep).padStart(6), String(tot.triage).padStart(8), String(tot.drop).padStart(6));
