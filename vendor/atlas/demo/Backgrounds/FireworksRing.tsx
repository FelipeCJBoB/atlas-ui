// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useRef, useState } from 'react';
import FireworksRing from '../../componentes/fireworks-circle/FireworksRing';
import { useTemaAncestral } from '../../componentes/fireworks/Fireworks';

type Chave = 'density' | 'rocketSpeed' | 'rocketSize' | 'particleSpeed' | 'particleSize';

const CONTROLES: { chave: Chave; rotulo: string; min: number; max: number }[] = [
  { chave: 'density', rotulo: 'Densidade', min: 1, max: 10 },
  { chave: 'rocketSpeed', rotulo: 'Vel. foguete', min: 2, max: 12 },
  { chave: 'rocketSize', rotulo: 'Espessura', min: 1, max: 8 },
  { chave: 'particleSpeed', rotulo: 'Vel. partículas', min: 1, max: 10 },
  { chave: 'particleSize', rotulo: 'Raio partículas', min: 1, max: 6 },
];

export default function FireworksRingDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const tema = useTemaAncestral(ref);
  const [v, setV] = useState<Record<Chave, number>>({
    density: 2,
    rocketSpeed: 6,
    rocketSize: 3,
    particleSpeed: 4,
    particleSize: 2,
  });
  const texto = tema === 'dark' ? '#e5e5e5' : '#262626';

  return (
    <div ref={ref} className="relative w-full h-full min-h-[360px]">
      <FireworksRing {...v} style={{ position: 'absolute', inset: 0, borderRadius: 14 }} />
      <div
        className="absolute top-3 right-3 z-10 flex flex-col gap-1 text-[11px] select-none opacity-80"
        style={{ color: texto }}
      >
        {CONTROLES.map((c) => (
          <label key={c.chave} className="flex items-center justify-end gap-2">
            <span>
              {c.rotulo} {v[c.chave]}
            </span>
            <input
              type="range"
              min={c.min}
              max={c.max}
              step={1}
              value={v[c.chave]}
              onChange={(e) => setV((s) => ({ ...s, [c.chave]: Number(e.target.value) }))}
              className="w-20"
              style={{ accentColor: texto }}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
