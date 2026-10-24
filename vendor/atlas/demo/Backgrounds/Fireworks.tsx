// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useRef, useState } from 'react';
import Fireworks, { useTemaAncestral } from '../../componentes/fireworks/Fireworks';

export default function FireworksDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const tema = useTemaAncestral(ref);
  const [densidade, setDensidade] = useState(1);
  const texto = tema === 'dark' ? '#e5e5e5' : '#262626';

  return (
    <div ref={ref} className="relative w-full h-full min-h-[360px]">
      <Fireworks
        density={densidade}
        themeColor={{ dark: '#ffffff', light: '#000000' }}
        style={{ position: 'absolute', inset: 0, borderRadius: 14 }}
      />
      <label
        className="absolute top-3 right-3 z-10 flex items-center gap-2 text-xs select-none"
        style={{ color: texto }}
      >
        Densidade {densidade}
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={densidade}
          onChange={(e) => setDensidade(Number(e.target.value))}
          className="w-24"
          style={{ accentColor: texto }}
        />
      </label>
    </div>
  );
}
