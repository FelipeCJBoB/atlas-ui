// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import TiltCubes from '../../componentes/cubes/TiltCubes';

// Tema do palco: classe dark/light do ancestral mais próximo, com fallback para o sistema.
function useIsDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const host = el?.closest('.dark, .light') ?? null;
    const read = () => setDark(host ? host.classList.contains('dark') : mq.matches);
    read();
    const mo = host ? new MutationObserver(read) : null;
    if (host && mo) mo.observe(host, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', read);
    return () => {
      mo?.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref]);
  return dark;
}

type BorderOpt = 'dotted' | 'dashed' | 'solid';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function TiltCubesDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef);
  const [borderOpt, setBorderOpt] = useState<BorderOpt>('dashed');
  const [grid, setGrid] = useState(8);
  const [angle, setAngle] = useState(45);
  const [radius, setRadius] = useState(3);
  const [auto, setAuto] = useState(true);
  const [ripple, setRipple] = useState(true);

  const border =
    borderOpt === 'dashed'
      ? dark
        ? '2px dashed #B497CF'
        : '2px dashed #a1a1aa'
      : borderOpt === 'dotted'
        ? `2px dotted ${dark ? '#fff' : '#3f3f46'}`
        : `3px solid ${dark ? '#fff' : '#3f3f46'}`;

  const fg = dark ? '#e4e4e7' : '#18181b';
  const panelBg = dark ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.9)';
  const line = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  return (
    <div ref={rootRef} className="relative w-full overflow-hidden flex items-center justify-center" style={{ height: 650 }}>
      {/* Caixa limitada para que 50% da largura caiba na altura da prévia. */}
      <div style={{ width: 'min(100%, 1150px)', display: 'flex', justifyContent: 'center' }}>
        <TiltCubes
          gridSize={grid}
          maxAngle={angle}
          radius={radius}
          autoAnimate={auto}
          rippleOnClick={ripple}
          faceBorder={border}
          faceColor={dark ? '#120F17' : '#ffffff'}
          rippleColor={dark ? '#ffffff' : '#52525b'}
        />
      </div>
      <details
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          width: 210,
          background: panelBg,
          color: fg,
          border: `1px solid ${line}`,
          borderRadius: 10,
          padding: '6px 10px',
          fontSize: 12,
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ajustes</summary>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          <Row label="Borda">
            <select value={borderOpt} onChange={(e) => setBorderOpt(e.target.value as BorderOpt)} style={{ color: '#18181b' }}>
              <option value="dotted">Pontilhada 2px</option>
              <option value="dashed">Tracejada 2px</option>
              <option value="solid">Sólida 3px</option>
            </select>
          </Row>
          <Row label={`Células ${grid}`}>
            <input type="range" min={6} max={12} value={grid} onChange={(e) => setGrid(+e.target.value)} />
          </Row>
          <Row label={`Ângulo ${angle}°`}>
            <input type="range" min={15} max={180} step={5} value={angle} onChange={(e) => setAngle(+e.target.value)} />
          </Row>
          <Row label={`Raio ${radius}`}>
            <input type="range" min={1} max={5} value={radius} onChange={(e) => setRadius(+e.target.value)} />
          </Row>
          <Row label="Movimento automático">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          </Row>
          <Row label="Onda de cor">
            <input type="checkbox" checked={ripple} onChange={(e) => setRipple(e.target.checked)} />
          </Row>
        </div>
      </details>
    </div>
  );
}
