// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

export interface PaletaColmeia {
  /** Fundo do contêiner (cor das frestas). */
  background: string;
  /** Célula em repouso (anel e miolo). */
  cell: string;
  /** Anel da célula em hover. */
  ringHover: string;
  /** Miolo da célula em hover. */
  coreHover: string;
}

export interface HoneycombGridProps {
  /** Largura L do hexágono em px (altura = 1,1 L; recomendado > 50). */
  cellWidth?: number;
  /** Fresta M entre células, em px (também é a espessura do anel de hover). */
  gap?: number;
  cellClassName?: string;
  cellStyle?: CSSProperties;
  colors?: { light?: Partial<PaletaColmeia>; dark?: Partial<PaletaColmeia> };
  /** Duração do rastro (apagamento do anel) em ms. */
  trailDuration?: number;
  /** Tema; `auto` lê a classe dark/light do ancestral (fallback prefers-color-scheme). */
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const PALETAS: Record<'light' | 'dark', PaletaColmeia> = {
  light: { background: '#f5f5f5', cell: '#ffffff', ringHover: '#e5e5e5', coreHover: '#f5f5f5' },
  dark: { background: '#171717', cell: '#0a0a0a', ringHover: '#262626', coreHover: '#171717' },
};

const HEX = 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)';

function useTema(ref: RefObject<HTMLElement | null>, forcado: 'auto' | 'light' | 'dark'): 'dark' | 'light' {
  const [tema, setTema] = useState<'dark' | 'light'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  useEffect(() => {
    const el = ref.current;
    if (!el || forcado !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const ler = () => {
      const anc = el.closest('.dark, .light');
      setTema(anc ? (anc.classList.contains('dark') ? 'dark' : 'light') : mq.matches ? 'dark' : 'light');
    };
    ler();
    mq.addEventListener('change', ler);
    const mo = new MutationObserver(ler);
    for (let n: HTMLElement | null = el; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener('change', ler);
      mo.disconnect();
    };
  }, [ref, forcado]);
  return forcado === 'auto' ? tema : forcado;
}

export function HoneycombGrid({
  cellWidth = 75,
  gap = 3,
  cellClassName,
  cellStyle,
  colors,
  trailDuration = 1000,
  theme = 'auto',
  className,
  style,
  children,
}: HoneycombGridProps) {
  const contRef = useRef<HTMLDivElement>(null);
  const tema = useTema(contRef, theme);
  const escopo = useId();
  // Tamanho de fallback até a primeira medição (o overflow esconde o excesso).
  const [tam, setTam] = useState({ w: 1280, h: 800 });

  useEffect(() => {
    const el = contRef.current;
    if (!el) return;
    const medir = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setTam((t) => (Math.abs(t.w - r.width) < 1 && Math.abs(t.h - r.height) < 1 ? t : { w: r.width, h: r.height }));
      }
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const L = Math.max(8, cellWidth);
  const M = Math.max(0, gap);
  const H = L * 1.1;
  const passoX = L + M;
  const passoY = H * 0.75 + M;

  const celulas = useMemo(() => {
    // A grade começa fora da borda esquerda/superior para não deixar margem vazia.
    const x0 = -passoX / 2;
    const y0 = -H / 4 - M;
    const linhas = Math.ceil((tam.h - y0) / passoY);
    const colunas = Math.ceil((tam.w - x0) / passoX) + 1;
    const lista: { k: string; x: number; y: number }[] = [];
    for (let r = 0; r < linhas; r++) {
      const desloc = r % 2 === 1 ? passoX / 2 : 0;
      for (let c = 0; c < colunas; c++) {
        lista.push({ k: `${r}-${c}`, x: x0 + desloc + c * passoX, y: y0 + r * passoY });
      }
    }
    return lista;
  }, [tam.w, tam.h, passoX, passoY, H, M]);

  const pal = { ...PALETAS[tema], ...(colors?.[tema] ?? {}) };
  const sel = `[data-colmeia="${escopo}"]`;
  const css = `
${sel} .colmeia-c{position:absolute;width:var(--cm-l);height:var(--cm-h);clip-path:${HEX};background-color:var(--cm-cell);transition:background-color var(--cm-trail) ease;}
${sel} .colmeia-c:hover{background-color:var(--cm-ring);transition-duration:0ms;}
${sel} .colmeia-i{position:absolute;inset:var(--cm-m);clip-path:${HEX};background-color:var(--cm-cell);pointer-events:none;}
${sel} .colmeia-c:hover .colmeia-i{background-color:var(--cm-core);}
@media (prefers-reduced-motion: reduce){${sel} .colmeia-c{transition-duration:150ms;}}
`;

  const vars = {
    '--cm-l': `${L}px`,
    '--cm-h': `${H}px`,
    '--cm-m': `${M}px`,
    '--cm-trail': `${Math.max(0, trailDuration)}ms`,
    '--cm-cell': pal.cell,
    '--cm-ring': pal.ringHover,
    '--cm-core': pal.coreHover,
  } as CSSProperties;

  return (
    <div
      ref={contRef}
      data-colmeia={escopo}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: pal.background, ...vars, ...style }}
    >
      <style>{css}</style>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
        {celulas.map((c) => (
          <div
            key={c.k}
            className={cellClassName ? `colmeia-c ${cellClassName}` : 'colmeia-c'}
            style={{ left: c.x, top: c.y, ...cellStyle }}
          >
            <div className="colmeia-i" />
          </div>
        ))}
      </div>
      {children != null && (
        // A camada do conteúdo não captura o ponteiro (o hover chega à grade); o conteúdo em si sim.
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto' }}>{children}</div>
        </div>
      )}
    </div>
  );
}

export default HoneycombGrid;
