// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import MetaBalls from '../../componentes/meta-balls/MetaBalls';

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

export default function MetaBallsDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDark(rootRef);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState<string | null>(null);
  const [count, setCount] = useState(15);
  const [speed, setSpeed] = useState(0.3);
  const [size, setSize] = useState(30);
  const [clump, setClump] = useState(1);
  const [follow, setFollow] = useState(true);
  const [smooth, setSmooth] = useState(0.15);
  const [cursor, setCursor] = useState(2);

  // Enquanto no padrão: branco no escuro, #18181b no claro. O seletor altera as duas cores.
  const color = custom ?? (isDark ? '#ffffff' : '#18181b');
  const fg = isDark ? '#e4e4e7' : '#27272a';
  const panelBg = isDark ? 'rgba(24,24,27,0.88)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? '#3f3f46' : '#d4d4d8';
  const range = { width: 110 } as const;

  return (
    <div
      ref={rootRef}
      className="relative w-full h-[400px] min-h-[360px] overflow-hidden"
      style={{ position: 'relative', width: '100%', height: 400, minHeight: 360, overflow: 'hidden' }}
    >
      <MetaBalls
        color={color}
        cursorBallColor={color}
        speed={speed}
        animationSize={size}
        ballCount={count}
        clumpFactor={clump}
        enableMouseInteraction={follow}
        hoverSmoothness={smooth}
        cursorBallSize={cursor}
        enableTransparency
      />
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, fontSize: 12, color: fg }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ marginLeft: 'auto', display: 'block', padding: '4px 10px', borderRadius: 6, border: `1px solid ${border}`, background: panelBg, color: fg, cursor: 'pointer' }}
        >
          {open ? 'Fechar' : 'Ajustes'}
        </button>
        {open && (
          <div
            style={{ marginTop: 6, padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: panelBg, display: 'flex', flexDirection: 'column', gap: 6, width: 230 }}
          >
            <Row label="Cor">
              <input type="color" value={color} onChange={(e) => setCustom(e.target.value)} />
            </Row>
            <Row label={`Bolhas ${count}`}>
              <input style={range} type="range" min={2} max={30} step={1} value={count} onChange={(e) => setCount(+e.target.value)} />
            </Row>
            <Row label={`Velocidade ${speed.toFixed(1)}`}>
              <input style={range} type="range" min={0.1} max={1} step={0.1} value={speed} onChange={(e) => setSpeed(+e.target.value)} />
            </Row>
            <Row label={`Tamanho ${size}`}>
              <input style={range} type="range" min={10} max={50} step={1} value={size} onChange={(e) => setSize(+e.target.value)} />
            </Row>
            <Row label={`Aglomeração ${clump.toFixed(1)}`}>
              <input style={range} type="range" min={0.1} max={2} step={0.1} value={clump} onChange={(e) => setClump(+e.target.value)} />
            </Row>
            <Row label="Seguir cursor">
              <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
            </Row>
            <Row label={`Suavização ${smooth.toFixed(3)}`}>
              <input style={range} type="range" min={0.001} max={0.25} step={0.001} value={smooth} onChange={(e) => setSmooth(+e.target.value)} />
            </Row>
            <Row label={`Raio do cursor ${cursor}`}>
              <input style={range} type="range" min={1} max={5} step={1} value={cursor} onChange={(e) => setCursor(+e.target.value)} />
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}
