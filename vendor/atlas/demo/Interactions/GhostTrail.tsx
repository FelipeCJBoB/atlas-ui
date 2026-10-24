// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import GhostTrail from '../../componentes/ghost-cursor/GhostTrail';

function useStageDark(ref: RefObject<HTMLElement | null>) {
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
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return dark;
}

type Num = {
  trailLength: number; inertia: number; grainIntensity: number; bloomStrength: number; bloomRadius: number;
  bloomThreshold: number; brightness: number; fadeDelayMs: number; fadeDurationMs: number;
};

const SLIDERS: { k: keyof Num; l: string; min: number; max: number; step: number }[] = [
  { k: 'trailLength', l: 'Rastro', min: 10, max: 50, step: 5 },
  { k: 'inertia', l: 'Inércia', min: 0, max: 0.99, step: 0.01 },
  { k: 'grainIntensity', l: 'Grão', min: 0, max: 0.5, step: 0.01 },
  { k: 'bloomStrength', l: 'Bloom', min: 0, max: 10, step: 0.05 },
  { k: 'bloomRadius', l: 'Raio do bloom', min: 0, max: 10, step: 0.05 },
  { k: 'bloomThreshold', l: 'Limiar do bloom', min: 0, max: 1, step: 0.01 },
  { k: 'brightness', l: 'Brilho', min: 0, max: 10, step: 0.1 },
  { k: 'fadeDelayMs', l: 'Atraso (ms)', min: 0, max: 3000, step: 100 },
  { k: 'fadeDurationMs', l: 'Desvanecer (ms)', min: 100, max: 5000, step: 100 },
];

export default function GhostTrailDemo() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useStageDark(root);
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState('#B497CF');
  const [n, setN] = useState<Num>({
    trailLength: 50, inertia: 0.5, grainIntensity: 0.05, bloomStrength: 0.1, bloomRadius: 1,
    bloomThreshold: 0.025, brightness: 2, fadeDelayMs: 1000, fadeDurationMs: 1500,
  });

  const fg = dark ? '#fafafa' : '#18181b';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const border = dark ? '#27272a' : '#e4e4e7';
  const panel = dark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.95)';

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={root} className="absolute inset-0 overflow-hidden flex items-center justify-center">
        <GhostTrail color={color} {...n} />
        <span
          style={{
            position: 'relative', zIndex: 11, fontSize: 'clamp(3rem, 8vw, 8rem)', fontWeight: 600,
            userSelect: 'none', color: dark ? '#ffffff' : '#27272a', pointerEvents: 'none',
          }}
        >
          Boo!
        </span>
      </div>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-2" style={{ fontSize: 12, color: fg, zIndex: 20 }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${border}`, background: panel, color: fg }}
        >
          Ajustes
        </button>
        {open && (
          <div
            className="flex flex-col gap-2"
            style={{ width: 210, padding: 10, borderRadius: 10, border: `1px solid ${border}`, background: panel, maxHeight: 420, overflowY: 'auto' }}
          >
            <label className="flex items-center justify-between gap-2">
              <span style={{ color: muted }}>Cor</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
            {SLIDERS.map((s) => (
              <label key={s.k} className="flex flex-col gap-1">
                <span style={{ color: muted }}>{s.l}: {n[s.k]}</span>
                <input
                  type="range" min={s.min} max={s.max} step={s.step} value={n[s.k]}
                  onChange={(e) => setN((p) => ({ ...p, [s.k]: Number(e.target.value) }))}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
