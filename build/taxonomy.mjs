// Taxonomia unificada (independe da biblioteca de origem), por regras de palavras-chave:
//   app = tipo de aplicação onde o componente costuma entrar · fn = função do componente · tags = palavras-chave de busca.
// Usada pelo build (filtros da vitrine) e por scripts/make-index.mjs (índice para o Claude Code).
export const APPS = ['Landing & Marketing', 'Dashboard & Admin', 'E-commerce', 'Login & Conta', 'Blog & Conteúdo', 'IA & Chat', 'Mobile & App', 'Portfólio & Mídia', 'Docs & Dev tools', 'Efeitos & Animação', 'UI base'];
export const FNS = ['Hero', 'Pricing', 'Depoimentos & Avaliações', 'CTA & Banner', 'Footer', 'Equipe & Logos', 'Features & Bento', 'FAQ', 'Navbar & Header', 'Sidebar & Menu', 'Dropdown & Menu', 'Tabs & Accordion', 'Paginação & Breadcrumb', 'Tabela & Data grid', 'Gráfico', 'Stats & KPI', 'Calendário & Data', 'Formulário', 'Input', 'Botão', 'Toggle & Checkbox', 'Modal & Overlay', 'Alerta & Toast', 'Badge & Avatar', 'Card', 'Mídia & Galeria', 'Lista & Timeline', 'Chat & IA', 'Loader & Progresso', 'Texto & Tipografia', 'Fundo & Efeito', 'Interação & Cursor', 'Ícone', 'Mockup', 'Layout', 'Código & Terminal', 'Estado vazio', 'Outros'];

// ordem importa: primeira regra que casar vence
const FN_RULES = [
  ['Código & Terminal', /code[- ]?block|snippet|terminal|\bcode\b|syntax|console|\bdiff\b|\bjson\b|\bcli\b/],
  ['Estado vazio', /\bempty\b|no[- ]results|no[- ]data|zero[- ]state/],
  ['Mockup', /mockup|iphone|android|safari|macbook|device|browser-frame|terminal-window|\bphone\b/],
  ['Chat & IA', /\bchat\b|prompt|assistant|\bagents?\b|llm|conversation|thinking|\bai[- ]|[- ]ai\b|\bai\b|speech|voice|transcript|reasoning|message/],
  ['Hero', /\bhero\b/],
  ['Pricing', /pricing|\bplans?\b|price[- ]?table|subscription/],
  ['Depoimentos & Avaliações', /testimon|review|rating|stars?\b.*(card|list)|feedback|quote/],
  ['FAQ', /\bfaq\b|frequently/],
  ['Footer', /footer/],
  ['CTA & Banner', /\bcta\b|call[- ]to[- ]action|banner|announcement|newsletter|\bpromo\b|waitlist|subscribe/],
  ['Equipe & Logos', /\bteam\b|logo[- ]?(cloud|wall|carousel|showcase)|logos?\b|partners?|clients?|brands?\b|trusted|customers/],
  ['Features & Bento', /\bfeatures?\b|bento|benefits|how[- ]it[- ]works|steps-section|showcase|sections?\b/],
  ['Navbar & Header', /navbar|nav[- ]?bar|\bheader\b|topbar|top[- ]nav|navigation[- ]menu|app[- ]bar|dock\b/],
  ['Sidebar & Menu', /sidebar|side[- ]nav|vertical[- ]menu|file[- ]tree|\btree\b/],
  ['Navbar & Header', /navbar|nav[- ]?bar|\bheader\b|topbar|top[- ]nav|navigation[- ]menu|app[- ]bar|\bdock\b|\bnav\b|navigation/],
  ['Paginação & Breadcrumb', /pagination|breadcrumb|stepper|\bsteps?\b|wizard/],
  ['Tabs & Accordion', /\btabs?\b|tabbed|accordion|collaps|disclosure|segmented/],
  ['Dropdown & Menu', /dropdown|\bmenus?\b|menubar|context[- ]menu|command|cascader|select|combobox|autocomplete|multi-?select|listbox|picker(?!.*date)/],
  ['Calendário & Data', /calendar|date[- ]?picker|datepicker|\bdates?\b|time[- ]?picker|timepicker|scheduler|timeline-calendar/],
  ['Tabela & Data grid', /\btables?\b|data[- ]?grid|datagrid|data[- ]?table|spreadsheet|\bgrid\b.*(data|rows)/],
  ['Gráfico', /chart|\bgraph\b|gauge|radar|sparkline|heat-?map|pie\b|donut|histogram|candlestick|analytics-graph/],
  ['Stats & KPI', /timer|stopwatch|clock|\bstats?\b|statistic|kpi|metric|counter|number[- ]?(ticker|flow)|odometer|countdown|\bscore\b/],
  ['Formulário', /\bforms?\b|fieldset|checkout|login|sign-?in|sign-?up|register|contact[- ]form|wizard-form|\botp\b|verification/],
  ['Input', /\binputs?\b|\bfields?\b|signature|attachment|\bmarker\b|\bpicker\b|textarea|slider|range|upload|file[- ]?(input|upload|dropzone)|dropzone|search|phone[- ]?input|\bcolor[- ]?picker|rating[- ]?input|editor|tags?[- ]input/],
  ['Toggle & Checkbox', /toggle|switch|checkbox|radio|\bchecks?\b/],
  ['Modal & Overlay', /floating[- ]panel|panel\b|popup|dialog|modal|drawer|sheet|popover|tooltip|hover[- ]?card|lightbox|overlay|context[- ]menu|\bdialog\b/],
  ['Botão', /\blinks?\b|speed[- ]dial|button|\bbtn\b|fab\b|cta-button/],
  ['Alerta & Toast', /alert|toast|notification|snackbar|sonner|callout|banner-alert|\bstatus[- ]message/],
  ['Badge & Avatar', /badge|\bchips?\b|\btags?\b|avatar|indicator|label\b|pill\b|kbd\b/],
  ['Loader & Progresso', /loader|loading|spinner|skeleton|progress|shimmer|placeholder-loading|pulse\b/],
  ['Mídia & Galeria', /masonry|stories|\breels?\b|case[- ]study|carousel|gallery|marquee|image|photo|lightbox|video|\bmedia\b|lens\b|globe|\bmap\b|slideshow|parallax-image|polaroid|album|player/],
  ['Lista & Timeline', /todo|\bpolls?\b|\bitems?\b|gantt|\blists?\b|timeline|feed\b|activity|kanban|\bboard\b|stack\b|queue|reorder|sortable|drag/],
  ['Card', /\bcards?\b|tile\b|spotlight|glare|flip|tilt/],
  ['Texto & Tipografia', /\btexts?\b|typing|typewriter|heading|typography|\bwords?\b|letters?\b|scramble|glitch|gradient-text|reveal|headline|\bfont\b|paragraph|\bquote\b|textarea-effect|morph/],
  ['Interação & Cursor', /blur[- ]?fade|in[- ]view|\bfloat|transition|shared[- ]axis|parallax|cursor|pointer|\btrail\b|magnet|confetti|\bscroll|ripple|click|hover-effect|follow|drag|physics/],
  ['Fundo & Efeito', /liquid|holographic|brush|canvas|illustration|hatch|strata|background|\bbg\b|pattern|\bgrid\b|beam|aurora|particle|shader|noise|gradient|mesh|wave|dots?\b|stars?\b|meteor|retro|warp|lines\b|plasma|orbit|blob|filter|dither|silk|galaxy|three\.?js|webgl|css-art|effect/],
  ['Layout', /\bmask\b|\bframe\b|\bgrids?\b|layout|container|divider|separator|aspect|resizable|scroll[- ]?area|\bsection\b|grid-layout|spacer|stack\b/],
];

const APP_OF_FN = {
  Hero: 'Landing & Marketing', Pricing: 'Landing & Marketing', 'Depoimentos & Avaliações': 'Landing & Marketing', 'CTA & Banner': 'Landing & Marketing', Footer: 'Landing & Marketing', 'Equipe & Logos': 'Landing & Marketing', 'Features & Bento': 'Landing & Marketing', FAQ: 'Landing & Marketing',
  'Tabela & Data grid': 'Dashboard & Admin', Gráfico: 'Dashboard & Admin', 'Stats & KPI': 'Dashboard & Admin', 'Sidebar & Menu': 'Dashboard & Admin', 'Calendário & Data': 'Dashboard & Admin',
  'Chat & IA': 'IA & Chat', 'Código & Terminal': 'Docs & Dev tools', Mockup: 'Mobile & App', 'Mídia & Galeria': 'Portfólio & Mídia',
  'Texto & Tipografia': 'Efeitos & Animação', 'Fundo & Efeito': 'Efeitos & Animação', 'Interação & Cursor': 'Efeitos & Animação', 'Loader & Progresso': 'Efeitos & Animação',
};
// pistas de domínio no texto (valem para fn genéricas: Card, Botão, Input, Formulário, Lista, Navbar…)
const APP_HINTS = [
  ['Login & Conta', /login|log-?in|sign-?in|sign-?up|register|\bauth|password|\botp\b|2fa|two-factor|verification|\baccount\b|\bprofile\b|\buser\b|onboarding/],
  ['E-commerce', /product|\bcart\b|checkout|\bshop|\bstore\b|\border|payment|credit[- ]card|price|ecommerce|e-commerce|wishlist|coupon|shipping|invoice|\bbuy\b|purchase|merch/],
  ['Blog & Conteúdo', /\bblog|article|\bpost\b|\bnews|comment|author|reading|\bstory\b|newsletter-post|documentation|\bdocs?\b|changelog|release notes/],
  ['Dashboard & Admin', /dashboard|analytics|\badmin|\bcrm\b|report|overview|inbox|kanban|\bleads?\b|workspace|settings|\bkpi\b|\bmetrics?\b|data[- ]?table|\btable\b|\bgrid\b.*data|\bapp[- ]shell\b/],
  ['IA & Chat', /\bai\b|prompt|assistant|\bagent|llm|conversation|\bchat\b/],
  ['Mobile & App', /mobile|iphone|android|\bios\b|\bapp store\b|\bphone\b|native/],
];
const HEAD_ONLY = new Set(['Botão', 'Toggle & Checkbox', 'Badge & Avatar']);   // fn onde as tags do desc (Uiverse) enganam o domínio
const GENERIC_FN = new Set(['Dropdown & Menu', 'Card', 'Botão', 'Input', 'Formulário', 'Lista & Timeline', 'Navbar & Header', 'Dropdown & Menu', 'Toggle & Checkbox', 'Badge & Avatar', 'Modal & Overlay', 'Alerta & Toast', 'Tabs & Accordion', 'Paginação & Breadcrumb', 'Layout', 'Outros']);

// categorias de bibliotecas com taxonomia própria (Uiverse e ícones) → função direta
const CAT_FN = {
  'Botões': 'Botão', Cards: 'Card', Loaders: 'Loader & Progresso', Toggles: 'Toggle & Checkbox', Inputs: 'Input', 'Formulários': 'Formulário', Checkboxes: 'Toggle & Checkbox', 'Padrões': 'Fundo & Efeito', 'Radio buttons': 'Toggle & Checkbox', Tooltips: 'Modal & Overlay', 'Notificações': 'Alerta & Toast', 'Ícones animados': 'Ícone', Texto: 'Texto & Tipografia', 'Fundos & padrões': 'Fundo & Efeito', 'Mockups de dispositivo': 'Mockup', 'Formulários & Inputs': 'Input', TextAnimations: 'Texto & Tipografia', Animations: 'Fundo & Efeito', Backgrounds: 'Fundo & Efeito', Micro: 'Interação & Cursor',
};
const STOP = new Set('the and for with from this that your you are can use used using into over under more most each when where which will have has had not but all any one two set get new default demo example examples component components simple basic custom with without small large light dark style styles variant variants type types base item items section sections page pages app apps web ui ux css html tailwind react text button card cards input from'.split(' '));

// categorias genéricas geradas pelo classificador antigo (adapters/util.mjs): não servem de pista de função, só de apoio
const GENERIC_CATS = new Set(['Mockups de dispositivo', 'IA & Chat', 'Gráficos & Dados', 'Formulários & Inputs', 'Botões', 'Texto', 'Fundos & padrões', 'Cards & Bento', 'Navegação & Layout', 'Feedback & Estado', 'Mídia & 3D', 'Listas, Dock & Marquee', 'Outros', 'Geral', 'Catalog', 'Componentes']);
const clean = (s) => (s || '').toLowerCase().replace(/[_/·]+/g, ' ').replace(/\s+/g, ' ');

export function classify(e) {
  const cat = e.category || '';
  const idTail = (e.id || '').split('/').slice(-2).join(' ').replace(/-/g, ' ');
  const camel = (x) => (x || '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  const text = clean(`${cat} ${camel(e.name)} ${camel(idTail)} ${e.desc || ''}`);
  const head = clean(`${GENERIC_CATS.has(cat) ? '' : cat} ${camel(e.name)} ${camel(idTail)}`);          // sem a descrição (mais confiável)
  let fn = CAT_FN[cat];
  if (!fn) for (const [f, re] of FN_RULES) if (re.test(head)) { fn = f; break; }
  if (!fn) for (const [f, re] of FN_RULES) if (re.test(text)) { fn = f; break; }
  fn ||= 'Outros';
  let app = APP_OF_FN[fn];
  if (!app || GENERIC_FN.has(fn)) {
    const hint = APP_HINTS.find(([, re]) => re.test(head)) || (HEAD_ONLY.has(fn) ? null : APP_HINTS.find(([, re]) => re.test(text)));
    app = hint ? hint[0] : (APP_OF_FN[fn] || 'UI base');
  }
  if (app === 'UI base' && /^marketing/i.test(cat)) app = 'Landing & Marketing';
  if (app === 'UI base' && /^application/i.test(cat) && ['Sidebar & Menu', 'Tabela & Data grid'].includes(fn)) app = 'Dashboard & Admin';
  const tags = new Set([fn.toLowerCase(), app.toLowerCase()]);
  for (const w of clean(`${e.name} ${idTail} ${e.desc || ''}`).split(/[^a-zà-ú0-9]+/)) if (w.length > 2 && !STOP.has(w) && !/^\d+$/.test(w)) { tags.add(w); if (tags.size >= 12) break; }
  return { app, fn, tags: [...tags] };
}
