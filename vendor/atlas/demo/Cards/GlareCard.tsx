// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import GlareCard from '../../componentes/glare-hover/GlareCard';

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

export default function GlareCardDemo() {
  const root = useRef<HTMLDivElement>(null);
  const dark = useStageDark(root);
  const [color, setColor] = useState<string | null>(null); // null = padrão do tema
  const [opacity, setOpacity] = useState(0.3);
  const [size, setSize] = useState(300);
  const [duration, setDuration] = useState(800);
  const [once, setOnce] = useState(false);
  const [open, setOpen] = useState(false);

  const fg = dark ? '#fafafa' : '#18181b';
  const muted = dark ? '#a1a1aa' : '#52525b';
  const card = dark ? '#18181b' : '#ffffff';
  const border = dark ? '#27272a' : '#e4e4e7';
  const panel = dark ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.95)';
  const glare = color ?? (dark ? '#ffffff' : '#18181b');

  return (
    <div ref={root} className="relative w-full h-full min-h-[400px] overflow-hidden flex items-center justify-center">
      <GlareCard
        width="400px"
        height="300px"
        borderRadius="20px"
        background={card}
        borderColor={border}
        glareColor={glare}
        glareOpacity={opacity}
        glareSize={size}
        transitionDuration={duration}
        playOnce={once}
        sweepOnMount
        style={{ maxWidth: 'calc(100% - 32px)' }}
      >
        <h2 style={{ margin: 0, fontSize: '3rem', fontWeight: 600, color: muted }}>Hover Me</h2>
      </GlareCard>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-2" style={{ fontSize: 12, color: fg }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${border}`, background: panel, color: fg }}
        >
          Ajustes
        </button>
        {open && (
          <div className="flex flex-col gap-2" style={{ width: 200, padding: 10, borderRadius: 10, border: `1px solid ${border}`, background: panel }}>
            <label className="flex items-center justify-between gap-2">
              <span style={{ color: muted }}>Cor do reflexo</span>
              <input type="color" value={glare} onChange={(e) => setColor(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1">
              <span style={{ color: muted }}>Opacidade: {opacity.toFixed(1)}</span>
              <input type="range" min={0} max={1} step={0.1} value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1">
              <span style={{ color: muted }}>Tamanho: {size}%</span>
              <input type="range" min={100} max={500} step={25} value={size} onChange={(e) => setSize(Number(e.target.value))} />
            </label>
            <label className="flex flex-col gap-1">
              <span style={{ color: muted }}>Duração: {duration} ms</span>
              <input type="range" min={200} max={2000} step={50} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} />
              <span>Só uma vez</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
