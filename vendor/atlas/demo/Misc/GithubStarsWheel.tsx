// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useLayoutEffect, useRef, useState } from 'react';
import GithubStarsWheel, { type WheelDirection } from '../../componentes/github-stars-wheel/GithubStarsWheel';

export default function GithubStarsWheelDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [dark, setDark] = useState(false);
  const [direction, setDirection] = useState<WheelDirection>('down');

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest('.dark, .light');
    setDark(host ? host.classList.contains('dark') : window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const muted = dark ? '#a1a1a1' : '#737373';

  return (
    <div ref={ref} className="relative w-full h-full min-h-[360px] flex items-center justify-center">
      {/* key remonta o componente a cada troca de direção */}
      <GithubStarsWheel key={direction} stars={3200} step={100} direction={direction} delay={0} />
      <button
        type="button"
        onClick={() => setDirection((d) => (d === 'down' ? 'up' : 'down'))}
        className="absolute top-3 right-3 text-xs px-2 py-1 rounded-md"
        style={{ color: muted, border: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : '#e5e5e5'}`, background: 'transparent' }}
      >
        {direction === 'down' ? 'Descendo ↓' : 'Subindo ↑'}
      </button>
    </div>
  );
}
