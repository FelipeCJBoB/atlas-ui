#!/usr/bin/env node
// Página de triagem visual dos componentes limítrofes da curadoria:
//   node scripts/triagem.mjs   → curadoria/triagem.html (abrir com duplo clique; usa as capturas de out/qa/shots)
// Pré-marcação = curadoria/sugestao-claude.json ({ uid: { d: "keep"|"drop", why } }); sem ela, tudo começa "sem decisão".
// O botão "Exportar" baixa decisoes.json → salvar em atlas/curadoria/decisoes.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(import.meta.dirname, '..');
const prop = JSON.parse(readFileSync(join(ROOT, 'curadoria/proposta.json'), 'utf8'));
const sugPath = join(ROOT, 'curadoria/sugestao-claude.json');
const sug = existsSync(sugPath) ? JSON.parse(readFileSync(sugPath, 'utf8')) : {};
const shot = (uid, s = '') => uid.replace(/[:/]/g, '__') + s + '.jpg';
const SH = join(ROOT, 'out/qa/shots');
const items = Object.entries(prop).filter(([, v]) => v.d === 'triage').map(([uid, v]) => ({
  uid, lib: v.lib, fam: v.why.replace(/^componente composto \((.*)\)$/, '$1'), name: v.name, fn: v.fn, why: v.why, loc: v.loc, t: v.t || [],
  f: ['', '.f1', '.f2'].filter((s) => existsSync(join(SH, shot(uid, s)))).map((s) => 'miniaturas/' + encodeURIComponent(shot(uid, s))),
  g: v.lib === 'kibo' || v.lib === 'reui' ? v.why.replace(/^componente composto \((.*)\)$/, '$1') : v.fn,
  s: sug[uid]?.d || '', sw: sug[uid]?.why || '',
}));
items.sort((a, b) => a.lib.localeCompare(b.lib) || a.g.localeCompare(b.g) || a.name.localeCompare(b.name));
// miniaturas recortadas (o palco do QA é largo e o componente pequeno): curadoria/miniaturas/
const MIN = join(ROOT, 'curadoria/miniaturas'); mkdirSync(MIN, { recursive: true });
const jobs = items.flatMap((i) => ['', '.f1', '.f2'].map((s) => shot(i.uid, s))).filter((n) => existsSync(join(SH, n)) && !existsSync(join(MIN, n)));
let jx = 0;
await Promise.all(Array.from({ length: 8 }, async () => { while (jx < jobs.length) { const n = jobs[jx++], src = join(SH, n);
  const m = await sharp(src).metadata(); const cut = await sharp(src).extract({ left: 0, top: 0, width: m.width, height: Math.floor(m.height * 0.9) }).toBuffer();
  await sharp(cut).trim({ threshold: 18 }).extend({ top: 10, bottom: 10, left: 10, right: 10, background: '#0a0a0a' }).toBuffer()
    .catch(() => cut).then((b) => sharp(b).resize(360, 225, { fit: 'inside', withoutEnlargement: false }).jpeg({ quality: 76 }).toFile(join(MIN, n))); } }));
const semFoto = items.filter((i) => !i.f.length).length;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Triagem do Atlas</title><style>
:root{--bg:#0b0b0d;--card:#151518;--line:#26262b;--tx:#e7e7ea;--mu:#8b8b94;--keep:#22c55e;--drop:#ef4444;--sug:#a78bfa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--tx);font:13px/1.4 system-ui,sans-serif}
header{position:sticky;top:0;z-index:5;background:#0b0b0dee;backdrop-filter:blur(8px);border-bottom:1px solid var(--line);padding:10px 16px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
header b{font-size:15px}button,select,input{background:#1d1d22;color:var(--tx);border:1px solid var(--line);border-radius:7px;padding:5px 9px;font:inherit;cursor:pointer}
input{cursor:text;width:180px}.st{color:var(--mu)}.st i{font-style:normal;color:var(--tx)}
h2{margin:22px 16px 6px;font-size:14px;display:flex;gap:8px;align-items:center}h2 small{color:var(--mu);font-weight:400}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;padding:0 16px}
.c{background:var(--card);border:2px solid var(--line);border-radius:10px;overflow:hidden;display:flex;flex-direction:column}
.c.keep{border-color:var(--keep)}.c.drop{border-color:var(--drop);opacity:.45}.c.cur{outline:2px solid #fff;outline-offset:2px}
.im{aspect-ratio:16/10;background:#000 center/contain no-repeat;position:relative}.im span{position:absolute;inset:auto 6px 6px auto;font-size:10px;color:var(--mu)}
.b{padding:6px 8px;display:flex;flex-direction:column;gap:3px}.n{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.m{color:var(--mu);font-size:11px}
.sg{font-size:11px;color:var(--sug)}.ac{display:flex;gap:6px;padding:0 8px 8px}.ac button{flex:1}.ac .k.on{background:var(--keep);color:#000}.ac .d.on{background:var(--drop)}
kbd{border:1px solid var(--line);border-radius:4px;padding:0 4px;font-size:11px}
</style></head><body>
<header><b>Triagem do Atlas</b><span class="st" id="st"></span>
<select id="fl"><option value="">todas as bibliotecas</option></select>
<select id="fs"><option value="">todas</option><option value="pend">sem decisão</option><option value="keep">ficam</option><option value="drop">saem</option><option value="dif">eu ≠ Claude</option></select>
<input id="q" placeholder="buscar nome…"><button id="ex">Exportar decisoes.json</button>
<span class="st"><kbd>F</kbd> fica · <kbd>S</kbd> sai · <kbd>←</kbd><kbd>→</kbd> navegar · passe o mouse para animar</span></header>
<main id="m"></main>
<script>
const D=${JSON.stringify(items)};const SEM=${semFoto};
const KEY='atlas-triagem-v1';let dec={};try{dec=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
const val=i=>dec[i.uid]||i.s||'';const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(dec))}catch{}};
const fl=document.getElementById('fl');[...new Set(D.map(i=>i.lib))].forEach(l=>fl.add(new Option(l+' ('+D.filter(i=>i.lib===l).length+')',l)));
let cur=-1,vis=[];
function vista(){const l=fl.value,f=document.getElementById('fs').value,q=document.getElementById('q').value.toLowerCase();
 return D.filter(i=>(!l||i.lib===l)&&(!q||i.name.toLowerCase().includes(q)||i.uid.includes(q))&&(!f||(f==='pend'?!val(i):f==='dif'?(dec[i.uid]&&i.s&&dec[i.uid]!==i.s):val(i)===f)))}
function render(){vis=vista();const m=document.getElementById('m');m.innerHTML='';let g=null,grid;
 vis.forEach((i,ix)=>{const gk=i.lib+' › '+i.g;if(gk!==g){g=gk;const h=document.createElement('h2');const n=vis.filter(x=>x.lib+' › '+x.g===gk).length;
  h.innerHTML=gk+' <small>'+n+'</small> <button data-g="keep">todos ficam</button><button data-g="drop">todos saem</button>';h.dataset.k=gk;m.append(h);grid=document.createElement('div');grid.className='grid';m.append(grid)}
  const v=val(i),c=document.createElement('div');c.className='c '+v+(ix===cur?' cur':'');c.dataset.ix=ix;
  c.innerHTML='<div class="im" style="background-image:url(\\''+(i.f[0]||'')+'\\')">'+(i.f.length?'':'<span>sem captura</span>')+'</div><div class="b"><div class="n" title="'+i.uid+'">'+i.name+'</div><div class="m">'+i.why+(i.t.length?' · '+i.t.join('/'):'')+(i.loc?' · '+i.loc+' linhas':'')+'</div>'+(i.s?'<div class="sg">Claude: '+(i.s==='keep'?'fica':'sai')+(i.sw?' — '+i.sw:'')+'</div>':'')+'</div><div class="ac"><button class="k'+(v==='keep'?' on':'')+'">Fica</button><button class="d'+(v==='drop'?' on':'')+'">Sai</button></div>';
  grid.append(c)});stat()}
function stat(){const k=D.filter(i=>val(i)==='keep').length,d=D.filter(i=>val(i)==='drop').length;
 document.getElementById('st').innerHTML='<i>'+D.length+'</i> limítrofes · fica <i>'+k+'</i> · sai <i>'+d+'</i> · sem decisão <i>'+(D.length-k-d)+'</i>'+(SEM?' · '+SEM+' sem captura':'')}
function set(ix,v){const i=vis[ix];if(!i)return;dec[i.uid]=v;save();const c=document.querySelector('.c[data-ix="'+ix+'"]');if(c){c.className='c '+v+(ix===cur?' cur':'');c.querySelector('.k').classList.toggle('on',v==='keep');c.querySelector('.d').classList.toggle('on',v==='drop')}stat()}
document.getElementById('m').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
 if(b.dataset.g){const k=b.parentElement.dataset.k;vis.forEach((i,ix)=>{if(i.lib+' › '+i.g===k)set(ix,b.dataset.g)});return}
 const c=b.closest('.c');set(+c.dataset.ix,b.classList.contains('k')?'keep':'drop')});
let tm;document.getElementById('m').addEventListener('mouseover',e=>{const c=e.target.closest('.c');if(!c||c._a)return;c._a=1;const i=vis[+c.dataset.ix],im=c.querySelector('.im');let n=0;clearInterval(tm);
 if(i.f.length>1)tm=setInterval(()=>{n=(n+1)%i.f.length;im.style.backgroundImage="url('"+i.f[n]+"')"},450);c.onmouseleave=()=>{clearInterval(tm);c._a=0;im.style.backgroundImage="url('"+i.f[0]+"')"}});
function foco(ix){cur=Math.max(0,Math.min(vis.length-1,ix));document.querySelectorAll('.c.cur').forEach(c=>c.classList.remove('cur'));const c=document.querySelector('.c[data-ix="'+cur+'"]');if(c){c.classList.add('cur');c.scrollIntoView({block:'center'});c.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}))}}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
 if(k==='arrowright')foco(cur+1);else if(k==='arrowleft')foco(cur-1);else if(k==='f'&&cur>=0){set(cur,'keep');foco(cur+1)}else if(k==='s'&&cur>=0){set(cur,'drop');foco(cur+1)}else return;e.preventDefault()});
['fl','fs'].forEach(id=>document.getElementById(id).onchange=()=>{cur=-1;render()});document.getElementById('q').oninput=()=>{cur=-1;render()};
document.getElementById('ex').onclick=()=>{const o={};D.forEach(i=>{const v=val(i);if(v)o[i.uid]=v});const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o,null,1)],{type:'application/json'}));a.download='decisoes.json';a.click()};
render();
</script></body></html>`;
writeFileSync(join(ROOT, 'curadoria/triagem.html'), html);
console.log(`triagem: ${items.length} limítrofes (${semFoto} sem captura), ${Object.keys(sug).length} sugestões do Claude → curadoria/triagem.html`);
