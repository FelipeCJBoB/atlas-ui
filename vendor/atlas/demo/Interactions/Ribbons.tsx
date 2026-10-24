// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import Ribbons from '../../componentes/ribbons/Ribbons';

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

const randomHex = () =>
  `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;

export default function RibbonsDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useDarkTheme(ref);
  const [colors, setColors] = useState<string[]>(['#5227FF']);
  const [thickness, setThickness] = useState(30);
  const [speed, setSpeed] = useState(0.5);
  const [maxAge, setMaxAge] = useState(500);
  const [fade, setFade] = useState(false);
  const [wave, setWave] = useState(false);

  const setCount = (n: number) =>
    setColors((c) => (n > c.length ? [...c, ...Array.from({ length: n - c.length }, randomHex)] : c.slice(0, n)));

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
      <p style={{ fontSize: 'clamp(2rem, 6vw, 6rem)', fontWeight: 600, color: muted, margin: 0, userSelect: 'none' }}>Hover Me.</p>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Ribbons
          colors={colors}
          baseThickness={thickness}
          speedMultiplier={speed}
          maxAge={maxAge}
          enableFade={fade}
          enableShaderEffect={wave}
        />
      </div>

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
        {slider('Fitas', colors.length, setCount, 1, 10)}
        {slider('Largura', thickness, setThickness, 1, 60)}
        {slider('Velocidade', speed, setSpeed, 0.3, 0.7, 0.01)}
        {slider('Idade (ms)', maxAge, setMaxAge, 300, 1000, 100)}
        <label style={{ ...ctl, gridTemplateColumns: 'auto 1fr' }}>
          <input type="checkbox" checked={fade} onChange={(e) => setFade(e.target.checked)} />
          <span>Desbotar</span>
        </label>
        <label style={{ ...ctl, gridTemplateColumns: 'auto 1fr' }}>
          <input type="checkbox" checked={wave} onChange={(e) => setWave(e.target.checked)} />
          <span>Ondulação</span>
        </label>
      </div>
    </div>
  );
}
