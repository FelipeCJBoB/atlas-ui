// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type RefObject } from 'react';
import ClickBurst from '../../componentes/click-spark/ClickBurst';

const DEFAULT_COLOR = '#fff';

// Detecta o tema do palco (classe `light`/`dark` no ancestral mais próximo; sem ela, preferência do sistema).
function useLightStage(ref: RefObject<HTMLElement | null>): boolean {
  const [light, setLight] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const read = () => {
      const stage = el.closest('.light, .dark');
      setLight(stage ? stage.classList.contains('light') : mq.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return light;
}

// Converte cor curta (#fff) para o formato aceito por <input type="color">.
function toInputHex(c: string): string {
  if (/^#[0-9a-f]{3}$/i.test(c)) return '#' + [...c.slice(1)].map((d) => d + d).join('');
  return /^#[0-9a-f]{6}$/i.test(c) ? c : '#ffffff';
}

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}

function Range({ label, value, min, max, step, onChange, suffix = '' }: RangeProps) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="flex justify-between opacity-70">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-current"
      />
    </label>
  );
}

export default function ClickBurstDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const light = useLightStage(rootRef);

  const [color, setColor] = useState(DEFAULT_COLOR);
  const [length, setLength] = useState(10);
  const [reach, setReach] = useState(15);
  const [count, setCount] = useState(8);
  const [durationMs, setDurationMs] = useState(400);
  const [scale, setScale] = useState(1);

  // No tema claro, o branco padrão perde contraste: troca por quase preto.
  const effectiveColor = light && color === DEFAULT_COLOR ? '#18181b' : color;
  const textColor = light ? '#18181b' : '#fff';
  // Cada mudança de controle remonta o componente.
  const mountKey = [effectiveColor, length, reach, count, durationMs, scale].join('|');

  return (
    <div ref={rootRef} className="w-full h-full min-h-[320px] flex flex-col">
      <div className="relative w-full h-[400px] p-0 overflow-hidden">
        <ClickBurst
          key={mountKey}
          color={effectiveColor}
          length={length}
          reach={reach}
          count={count}
          durationMs={durationMs}
          scale={scale}
        />
        <span
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none whitespace-nowrap"
          style={{ fontSize: '2rem', fontWeight: 600, color: textColor }}
        >
          Click Around!
        </span>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 p-4 border-t"
        style={{ color: textColor, borderColor: light ? '#e4e4e7' : '#27272a' }}
      >
        <label className="flex flex-col gap-1 text-xs">
          <span className="opacity-70">Cor</span>
          <input
            type="color"
            value={toInputHex(color)}
            onChange={(e) => setColor(e.target.value)}
            className="h-7 w-full cursor-pointer bg-transparent"
          />
        </label>
        <Range label="Tamanho" value={length} min={5} max={60} step={1} onChange={setLength} suffix="px" />
        <Range label="Alcance" value={reach} min={10} max={200} step={5} onChange={setReach} suffix="px" />
        <Range label="Quantidade" value={count} min={1} max={20} step={1} onChange={setCount} />
        <Range label="Duração" value={durationMs} min={200} max={2000} step={100} onChange={setDurationMs} suffix="ms" />
        <Range label="Escala extra" value={scale} min={0.5} max={2} step={0.1} onChange={setScale} suffix="×" />
      </div>
    </div>
  );
}
