// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import PixelTransition from '../../componentes/pixel-transition/PixelTransition';

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

// Gato estilizado próprio (SVG) sobre gradiente quente.
const CAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7e6cb"/><stop offset="1" stop-color="#ee8435"/></linearGradient>
<radialGradient id="fur" cx=".5" cy=".4" r=".65"><stop offset="0" stop-color="#5a4639"/><stop offset="1" stop-color="#2b211b"/></radialGradient>
</defs>
<rect width="300" height="300" fill="url(#bg)"/>
<circle cx="150" cy="330" r="125" fill="#2b211b"/>
<path d="M76 128 L90 46 L140 98 Z" fill="#2b211b"/>
<path d="M224 128 L210 46 L160 98 Z" fill="#2b211b"/>
<path d="M88 108 L96 68 L122 96 Z" fill="#e7998a"/>
<path d="M212 108 L204 68 L178 96 Z" fill="#e7998a"/>
<circle cx="150" cy="162" r="82" fill="url(#fur)"/>
<path d="M98 152 Q119 130 140 152 Q119 170 98 152 Z" fill="#cde86b"/>
<path d="M160 152 Q181 130 202 152 Q181 170 160 152 Z" fill="#cde86b"/>
<ellipse cx="119" cy="152" rx="4.5" ry="12" fill="#111"/>
<ellipse cx="181" cy="152" rx="4.5" ry="12" fill="#111"/>
<circle cx="123" cy="146" r="2.5" fill="#fff"/>
<circle cx="185" cy="146" r="2.5" fill="#fff"/>
<path d="M142 184 L158 184 L150 194 Z" fill="#e7998a"/>
<path d="M150 194 Q144 205 133 200 M150 194 Q156 205 167 200" stroke="#e9dccd" stroke-width="2.5" fill="none" stroke-linecap="round"/>
<g stroke="#e9dccd" stroke-width="1.6" stroke-linecap="round" opacity=".85">
<path d="M126 190 L82 182 M126 196 L80 198 M126 202 L84 214"/>
<path d="M174 190 L218 182 M174 196 L220 198 M174 202 L216 214"/>
</g>
</svg>`;
const CAT_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CAT_SVG)}`;

export default function PixelTransitionDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useDarkTheme(ref);
  const [grid, setGrid] = useState(8);
  const [duration, setDuration] = useState(0.4);
  const [color, setColor] = useState('#ffffff');
  const [once, setOnce] = useState(false);

  const text = dark ? '#f4f4f6' : '#16151a';
  const muted = dark ? 'rgba(244,244,246,0.5)' : 'rgba(22,21,26,0.55)';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const ctl: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 6, fontSize: 11 };

  return (
    <div ref={ref} className="relative w-full flex flex-col items-center justify-center overflow-hidden" style={{ height: 400, color: text }}>
      <PixelTransition
        key={`${grid}-${duration}-${color}`}
        aria-label="Cartão: foto de gato, revela mensagem"
        gridSize={grid}
        pixelColor={color}
        duration={duration}
        once={once}
        first={<img src={CAT_URL} alt="Ilustração de um gato" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
        second={
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#111' }}>
            <p style={{ fontWeight: 900, fontSize: '3rem', color: '#ffffff', margin: 0 }}>Meow!</p>
          </div>
        }
      />
      <p style={{ marginTop: '0.5rem', color: muted, fontSize: 14 }}>Psst, hover the card!</p>

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
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
        <label style={ctl}>
          <span>Grade</span>
          <span>{grid}</span>
          <input type="range" min={2} max={50} value={grid} onChange={(e) => setGrid(Number(e.target.value))} style={{ gridColumn: '1 / -1' }} />
        </label>
        <label style={ctl}>
          <span>Duração (s)</span>
          <span>{duration.toFixed(1)}</span>
          <input type="range" min={0.1} max={2} step={0.1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={{ gridColumn: '1 / -1' }} />
        </label>
        <label style={ctl}>
          <span>Cor</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 32, height: 20, padding: 0, border: 'none', background: 'none' }} />
        </label>
        <label style={{ ...ctl, gridTemplateColumns: 'auto 1fr' }}>
          <input type="checkbox" checked={once} onChange={(e) => setOnce(e.target.checked)} />
          <span>Uma vez só</span>
        </label>
      </div>
    </div>
  );
}
