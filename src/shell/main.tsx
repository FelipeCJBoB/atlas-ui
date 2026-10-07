import * as React from 'react';
import * as jsx from 'react/jsx-runtime';
import * as DOM from 'react-dom';
import * as client from 'react-dom/client';
import { createRoot } from 'react-dom/client';
// react é compartilhado com os bundles das libs (carregados sob demanda): uma única cópia, hooks funcionam.
(window as any).__SH = { react: React, 'react/jsx-runtime': jsx, 'react/jsx-dev-runtime': jsx, 'react-dom': DOM, 'react-dom/client': client };
// Portais (Radix/shadcn: dialog, popover, select, dropdown…): por padrão vão para document.body, fora do palco e sem os tokens da lib.
// Cada bundle de lib recebe um react-dom cujo createPortal(…, document.body) cai num nó .lib-<id>.dark|light dentro de uma raiz fixa acima de tudo.
const W = window as any;
W.__atlasPortalTheme = 'dark';
let host: HTMLElement | null = null; const nodes: Record<string, HTMLElement> = {}; const doms: Record<string, any> = {};
const portalNode = (lib: string) => {
  if (!host) { host = document.createElement('div'); host.setAttribute('data-atlas-portal', ''); host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none'; document.body.appendChild(host); }
  const n = (nodes[lib] ||= Object.assign(document.createElement('div'), {}));
  if (!n.parentNode) { n.style.cssText = 'display:contents;pointer-events:auto'; host.appendChild(n); }
  n.className = `lib-${lib} ${W.__atlasPortalTheme}`;
  const wrap = (W.__LIBS || []).find((l: any) => l.id === lib)?.wrap;   // libs cujos estilos exigem um ancestral de classe (ex.: ReUI .style-vega)
  if (!wrap) return n;
  let w = n.firstElementChild as HTMLElement | null;
  if (!w) { w = document.createElement('div'); w.style.display = 'contents'; n.appendChild(w); }
  w.className = wrap; return w;
};
W.__SH_DOM = (lib: string) => (doms[lib] ||= { ...DOM, createPortal: (c: any, node: any, key?: any) => (DOM as any).createPortal(c, node === document.body ? portalNode(lib) : node, key) });
// o tema do portal segue o último palco com que o usuário interagiu
const track = (e: Event) => { const st = (e.target as HTMLElement | null)?.closest?.('[data-stage]'); if (st) W.__atlasPortalTheme = st.classList.contains('light') ? 'light' : 'dark'; };
for (const ev of ['pointerdown', 'keydown', 'focusin']) document.addEventListener(ev, track, true);
import('./app').then(({ App }) => createRoot(document.getElementById('root')!).render(<App />));
