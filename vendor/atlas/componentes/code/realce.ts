// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
// Tokenizador leve por expressões regulares (TS/TSX/JS, JSON, bash). Gera tokens, nunca HTML.

export type Linguagem = 'tsx' | 'ts' | 'jsx' | 'js' | 'json' | 'bash' | 'sh' | 'text';
export type TipoToken =
  | 'plain'
  | 'comment'
  | 'string'
  | 'keyword'
  | 'function'
  | 'constant'
  | 'tag';

export interface Token {
  t: string;
  k: TipoToken;
}

export interface Paleta {
  plain: string;
  comment: string;
  string: string;
  keyword: string;
  function: string;
  constant: string;
  tag: string;
}

// Paleta de inspiração "GitHub".
export const PALETA_CLARA: Paleta = {
  plain: '#24292e',
  comment: '#6a737d',
  string: '#032f62',
  keyword: '#d73a49',
  function: '#6f42c1',
  constant: '#005cc5',
  tag: '#22863a',
};
export const PALETA_ESCURA: Paleta = {
  plain: '#e1e4e8',
  comment: '#6a737d',
  string: '#9ecbff',
  keyword: '#f97583',
  function: '#b392f0',
  constant: '#79b8ff',
  tag: '#85e89d',
};

const PALAVRAS = new Set(
  (
    'import from as export default function return const let var type interface if else for while do ' +
    'switch case break continue new class extends implements typeof instanceof in of async await try ' +
    'catch finally throw yield enum keyof readonly declare namespace void delete static public private ' +
    'protected satisfies abstract infer is'
  ).split(' '),
);
const CONSTANTES = new Set(
  'true false null undefined this super NaN Infinity string number boolean any unknown never object symbol bigint'.split(
    ' ',
  ),
);
// Palavras após as quais o identificador seguinte é nome de função/tipo.
const DECLARADORES = new Set(['function', 'type', 'interface', 'class', 'enum', 'extends', 'implements', 'new']);

type Regra = [RegExp, TipoToken | ((m: string, src: string, fim: number, ant: Token | undefined) => TipoToken)];

const R_COMENTARIO_LINHA: Regra = [/\/\/[^\n]*/y, 'comment'];
const R_COMENTARIO_BLOCO: Regra = [/\/\*[\s\S]*?(?:\*\/|$)/y, 'comment'];
const R_STRINGS: Regra = [/'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?|`(?:\\[\s\S]|[^`\\])*`?/y, 'string'];
const R_NUMERO: Regra = [/(?:0[xX][\da-fA-F_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)n?(?![\w$])/y, 'constant'];

function anteriorSignificativo(src: string, ini: number): string {
  let i = ini - 1;
  while (i >= 0 && (src[i] === ' ' || src[i] === '\t')) i--;
  return i >= 0 ? src[i] : '\n';
}

function proximoSignificativo(src: string, fim: number): string {
  let i = fim;
  while (i < src.length && (src[i] === ' ' || src[i] === '\t')) i++;
  return src[i] ?? '';
}

const REGRAS_TS: Regra[] = [
  R_COMENTARIO_LINHA,
  R_COMENTARIO_BLOCO,
  R_STRINGS,
  // Nome de tag JSX: "<" (ou "</") precedido de início/espaço/abre-parêntese etc.
  [/(?<=(?:^|[\s(>{,=?:&|])<\/?)[A-Za-z][\w.-]*/y, 'tag'],
  // Texto JSX entre "<tag>" e "</tag>" (ou outra tag) na mesma linha: sem realce.
  [/(?<=>)[^<>{}();=\n]+(?=<\/?[A-Za-z])/y, 'plain'],
  // Atributo JSX: nome colado em "=" seguido de { ou aspas.
  [/[A-Za-z_][\w-]*(?==[{"'])/y, 'constant'],
  R_NUMERO,
  [
    /[A-Za-z_$][\w$]*/y,
    (m, src, fim, ant) => {
      if (PALAVRAS.has(m)) return 'keyword';
      if (CONSTANTES.has(m)) return 'constant';
      const ini = fim - m.length;
      const antes = anteriorSignificativo(src, ini);
      const depois = proximoSignificativo(src, fim);
      if (ant && ant.k === 'keyword' && DECLARADORES.has(ant.t)) return 'function';
      if (depois === '(') return 'function';
      if (/^[A-Z]/.test(m) && depois !== '.') return 'function';
      if (antes === '.' && src[ini - 2] !== '.') return 'constant';
      // Chave de objeto/propriedade de tipo: "nome:" ou "nome?:" no início de item.
      if ((depois === ':' || (depois === '?' && src[src.indexOf('?', fim) + 1] === ':')) && /[{,\n(]/.test(antes))
        return 'constant';
      return 'plain';
    },
  ],
];

const REGRAS_JSON: Regra[] = [
  R_COMENTARIO_LINHA,
  R_COMENTARIO_BLOCO,
  [/"(?:\\.|[^"\\\n])*"?/y, (_m, src, fim) => (proximoSignificativo(src, fim) === ':' ? 'constant' : 'string')],
  [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, 'constant'],
  [/\b(?:true|false|null)\b/y, 'constant'],
];

const REGRAS_BASH: Regra[] = [
  // "#" só é comentário no início ou após espaço.
  [/(?<=^|\s)#[^\n]*/y, 'comment'],
  [/'[^']*'?|"(?:\\.|[^"\\])*"?/y, 'string'],
  [/\$\{[^}\n]*\}?|\$[\w@*#?$!-]/y, 'constant'],
  [/(?<=^|\s)--?[\w-]+/y, 'constant'],
  [/\b(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|export|return|local)\b/y, 'keyword'],
  // Primeiro termo de cada comando (início de linha ou após | ; && ||).
  [/(?<=(?:^\s*|[|;&]\s*|\n\s*))[A-Za-z_.\/][\w.\/@:-]*/y, 'function'],
  [/\b\d+\b/y, 'constant'],
];

function regrasDe(lang: Linguagem): Regra[] | null {
  switch (lang) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return REGRAS_TS;
    case 'json':
      return REGRAS_JSON;
    case 'bash':
    case 'sh':
      return REGRAS_BASH;
    default:
      return null;
  }
}

/** Divide o código-fonte em tokens coloríveis. */
export function tokenizar(src: string, lang: Linguagem): Token[] {
  const regras = regrasDe(lang);
  if (!regras) return src ? [{ t: src, k: 'plain' }] : [];
  const saida: Token[] = [];
  let ultimoSignificativo: Token | undefined;
  let i = 0;
  let textoSolto = '';
  const empurrar = (tk: Token) => {
    if (textoSolto) {
      saida.push({ t: textoSolto, k: 'plain' });
      textoSolto = '';
    }
    saida.push(tk);
  };
  while (i < src.length) {
    let casou = false;
    for (const [re, tipo] of regras) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m[0].length > 0) {
        const fim = i + m[0].length;
        const k = typeof tipo === 'function' ? tipo(m[0], src, fim, ultimoSignificativo) : tipo;
        const tk = { t: m[0], k };
        if (k === 'plain') textoSolto += m[0];
        else empurrar(tk);
        ultimoSignificativo = tk;
        i = fim;
        casou = true;
        break;
      }
    }
    if (!casou) {
      const c = src[i];
      textoSolto += c;
      if (!/\s/.test(c)) ultimoSignificativo = { t: c, k: 'plain' };
      i++;
    }
  }
  if (textoSolto) saida.push({ t: textoSolto, k: 'plain' });
  return saida;
}

/** Corta a lista de tokens nos primeiros `n` caracteres (UTF-16) e separa em linhas. */
export function emLinhas(tokens: Token[], n = Infinity): Token[][] {
  const linhas: Token[][] = [[]];
  let restante = n;
  for (const tk of tokens) {
    if (restante <= 0) break;
    const texto = tk.t.length > restante ? tk.t.slice(0, restante) : tk.t;
    restante -= texto.length;
    const partes = texto.split('\n');
    partes.forEach((p, idx) => {
      if (idx > 0) linhas.push([]);
      if (p) linhas[linhas.length - 1].push({ t: p, k: tk.k });
    });
  }
  return linhas;
}
