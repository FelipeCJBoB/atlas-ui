// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import FilmGrain from '../../componentes/noise/FilmGrain';

// Tema do palco: classe `dark`/`light` no ancestral mais próximo; senão, preferência do sistema.
function useIsDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.closest('.dark, .light');
      setDark(marked ? marked.classList.contains('dark') : !!mq?.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let n = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [ref]);
  return dark;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function FilmGrainDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDark(rootRef);
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [size, setSize] = useState(250);
  const [sx, setSx] = useState(2);
  const [sy, setSy] = useState(2);
  const [alpha, setAlpha] = useState(15);

  const fg = isDark ? '#fafafa' : '#18181b';
  const muted = isDark ? '#e4e4e7' : '#27272a';
  const panelBg = isDark ? 'rgba(24,24,27,0.88)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? '#3f3f46' : '#d4d4d8';
  const btn = { padding: '4px 10px', borderRadius: 6, border: `1px solid ${border}`, background: panelBg, color: muted, cursor: 'pointer' } as const;
  const range = { width: 110 } as const;

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full min-h-[400px] overflow-hidden flex items-center justify-center"
      style={{ position: 'relative', width: '100%', height: '100%', minHeight: 400, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <h2 style={{ margin: 0, fontSize: '6rem', fontWeight: 600, lineHeight: 1, color: fg, textAlign: 'center' }}>Ooh, edgy!</h2>
      {/* Cada mudança remonta a sobreposição (chave). */}
      <FilmGrain
        key={`${nonce}-${size}-${sx}-${sy}-${alpha}`}
        patternSize={size}
        patternScaleX={sx}
        patternScaleY={sy}
        patternAlpha={alpha}
      />
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, fontSize: 12, color: muted, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={btn} onClick={() => setNonce((n) => n + 1)} aria-label="Recarregar">
            ↻
          </button>
          <button type="button" style={btn} onClick={() => setOpen((o) => !o)}>
            {open ? 'Fechar' : 'Ajustes'}
          </button>
        </div>
        {open && (
          <div style={{ padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, display: 'flex', flexDirection: 'column', gap: 6, width: 220 }}>
            <Row label={`Tamanho ${size}`}>
              <input style={range} type="range" min={50} max={500} step={10} value={size} onChange={(e) => setSize(+e.target.value)} />
            </Row>
            <Row label={`Escala X ${sx.toFixed(1)}`}>
              <input style={range} type="range" min={0.1} max={5} step={0.1} value={sx} onChange={(e) => setSx(+e.target.value)} />
            </Row>
            <Row label={`Escala Y ${sy.toFixed(1)}`}>
              <input style={range} type="range" min={0.1} max={5} step={0.1} value={sy} onChange={(e) => setSy(+e.target.value)} />
            </Row>
            <Row label={`Opacidade ${alpha}`}>
              <input style={range} type="range" min={0} max={25} step={5} value={alpha} onChange={(e) => setAlpha(+e.target.value)} />
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}
