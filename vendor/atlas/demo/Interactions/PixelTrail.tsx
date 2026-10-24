// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import PixelTrail from '../../componentes/pixel-trail/PixelTrail';

function useDarkTheme(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const anc = el.closest('.dark, .light');
      setDark(anc ? anc.classList.contains('dark') : mq.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let a = el.parentElement; a; a = a.parentElement) mo.observe(a, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return dark;
}

export default function PixelTrailDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useDarkTheme(ref);
  const [gridSize, setGridSize] = useState(50);
  const [trailSize, setTrailSize] = useState(0.1);
  const [maxAge, setMaxAge] = useState(250);
  const [interpolate, setInterpolate] = useState(5);
  const [color, setColor] = useState('#5227FF');
  const [goo, setGoo] = useState(true);
  const [gooStrength, setGooStrength] = useState(2);
  const [reload, setReload] = useState(0);

  const text = dark ? '#f4f4f6' : '#16151a';
  const muted = dark ? 'rgba(244,244,246,0.35)' : 'rgba(22,21,26,0.4)';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const ctl: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 6, fontSize: 11 };
  const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step = 1) => (
    <label style={ctl}>
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} style={{ gridColumn: '1 / -1', width: '100%' }} />
    </label>
  );

  return (
    <div ref={ref} className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 400, color: text }}>
      <p style={{ fontSize: 'clamp(2rem, 6vw, 6rem)', fontWeight: 600, color: muted, margin: 0, userSelect: 'none' }}>Move Cursor.</p>
      <PixelTrail
        key={`${reload}-${gridSize}-${trailSize}-${maxAge}-${interpolate}-${color}-${goo}-${gooStrength}`}
        gridSize={gridSize}
        trailSize={trailSize}
        maxAge={maxAge}
        interpolate={interpolate}
        color={color}
        gooeyFilter={goo ? { id: 'atlas-pixel-goo', strength: gooStrength } : undefined}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 5,
          width: 170,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '8px 10px',
          fontSize: 11,
          borderRadius: 10,
          border: `1px solid ${border}`,
          background: dark ? 'rgba(20,20,26,0.85)' : 'rgba(255,255,255,0.9)',
        }}
      >
        <button
          type="button"
          onClick={() => setReload((r) => r + 1)}
          style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer' }}
        >
          Recarregar
        </button>
        {slider('Células', gridSize, setGridSize, 10, 100)}
        {slider('Pincel', trailSize, setTrailSize, 0.05, 0.5, 0.01)}
        {slider('Vida (ms)', maxAge, setMaxAge, 100, 1000, 50)}
        {slider('Interpolação', interpolate, setInterpolate, 0, 10, 0.1)}
        <label style={ctl}>
          <span>Cor</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 20, padding: 0, border: 'none', background: 'none' }} />
        </label>
        <label style={{ ...ctl, gridTemplateColumns: 'auto 1fr' }}>
          <input type="checkbox" checked={goo} onChange={(e) => setGoo(e.target.checked)} />
          <span>Filtro gosmento</span>
        </label>
        {goo && slider('Intensidade', gooStrength, setGooStrength, 1, 20)}
      </div>
    </div>
  );
}
