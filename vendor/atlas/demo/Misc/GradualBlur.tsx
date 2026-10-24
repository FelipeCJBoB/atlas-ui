// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import GradualBlur, { type BlurEdge } from '../../componentes/gradual-blur/GradualBlur';

// Tema do palco: classe `dark`/`light` no ancestral mais próximo; senão, preferência do sistema.
function useIsDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.closest('.dark, .light');
      setDark(marked ? marked.classList.contains('dark') : !!mq?.matches);
    };
    read();
    const mo = new MutationObserver(read);
    for (let node = el.parentElement; node; node = node.parentElement) {
      mo.observe(node, { attributes: true, attributeFilter: ['class'] });
    }
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [ref]);
  return dark;
}

// Ilustração própria: farol ao longe sob céu violeta→rosa (tons escuros; a demo aplica brilho 2×).
const LIGHTHOUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#140b2e"/><stop offset="0.45" stop-color="#3a1a5c"/><stop offset="0.8" stop-color="#6e2a63"/><stop offset="1" stop-color="#8a3a62"/>
</linearGradient>
<linearGradient id="m" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#2a1538"/><stop offset="1" stop-color="#07040d"/>
</linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="1" y2="0">
<stop offset="0" stop-color="#ffe6f2" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe6f2" stop-opacity="0"/>
</linearGradient>
<radialGradient id="g" cx="0.5" cy="0.5" r="0.5">
<stop offset="0" stop-color="#ffd9ec" stop-opacity="0.9"/><stop offset="1" stop-color="#ffd9ec" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="600" height="800" fill="url(#s)"/>
<g fill="#f3d8ff" opacity="0.55"><circle cx="80" cy="90" r="1.6"/><circle cx="190" cy="160" r="1.2"/><circle cx="320" cy="70" r="1.4"/><circle cx="470" cy="130" r="1.8"/><circle cx="540" cy="250" r="1.1"/><circle cx="60" cy="300" r="1.2"/><circle cx="250" cy="260" r="1"/><circle cx="420" cy="320" r="1.3"/></g>
<circle cx="430" cy="470" r="70" fill="#c0508a" opacity="0.25"/>
<path d="M0 520 C120 500 220 512 300 506 C400 498 500 512 600 504 L600 800 L0 800 Z" fill="url(#m)"/>
<g stroke="#b05a8f" stroke-opacity="0.25" stroke-width="2"><path d="M60 560 h90"/><path d="M250 600 h140"/><path d="M420 650 h110"/><path d="M120 700 h160"/></g>
<polygon points="352,368 600,300 600,436" fill="url(#b)"/>
<path d="M300 528 L180 528 C200 500 240 488 300 486 C360 488 390 500 410 528 Z" fill="#0b0614"/>
<polygon points="324,370 340,370 346,500 318,500" fill="#0b0614"/>
<rect x="318" y="358" width="28" height="14" fill="#0b0614"/>
<rect x="324" y="342" width="16" height="16" fill="#ffe1f0"/>
<polygon points="320,342 344,342 332,326" fill="#0b0614"/>
<circle cx="332" cy="350" r="40" fill="url(#g)"/>
</svg>`;
const LIGHTHOUSE = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(LIGHTHOUSE_SVG)}`;

function Field({ label, children, color }: { label: string; children: ReactNode; color: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, color }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function GradualBlurDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef);
  const [position, setPosition] = useState<BlurEdge>('bottom');
  const [target, setTarget] = useState<'parent' | 'page'>('parent');
  const [exponential, setExponential] = useState(true);
  const [strength, setStrength] = useState(2);
  const [divCount, setDivCount] = useState(5);
  const [opacity, setOpacity] = useState(1);

  const fg = dark ? '#d4d4d8' : '#3f3f46';
  const dot = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textSize = 'clamp(2rem, 4vw, 5rem)';
  const inputStyle = { accentColor: '#B497CF', width: 90 };

  return (
    <div
      ref={rootRef}
      className="relative w-full overflow-hidden"
      style={{
        position: 'relative',
        width: '100%',
        height: 400,
        minHeight: 360,
        padding: 0,
        overflow: 'hidden',
        backgroundImage: `radial-gradient(${dot} 1px, transparent 1px)`,
        backgroundSize: '18px 18px',
      }}
    >
      <div
        style={{
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          padding: '100px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ fontSize: textSize, fontWeight: 600, color: dark ? '#2f293a' : '#d4d4d8', lineHeight: 1.1 }}>Scroll Down.</div>
        <img
          src={LIGHTHOUSE}
          alt="Ilustração de um farol ao longe sob céu violeta"
          draggable={false}
          style={{
            display: 'block',
            width: '100%',
            maxWidth: 600,
            aspectRatio: '3 / 4',
            objectFit: 'cover',
            borderRadius: 50,
            margin: '100px 0',
            border: `1px solid ${dark ? '#2F293A' : '#e4e4e7'}`,
            filter: 'brightness(2)',
            flexShrink: 0,
          }}
        />
        <div style={{ fontSize: textSize, fontWeight: 600, color: dark ? '#B497CF' : '#27272a', lineHeight: 1.1 }}>Gradual Blur</div>
      </div>

      <GradualBlur
        target={target}
        position={position}
        height="7rem"
        strength={strength}
        divCount={divCount}
        curve="smoothstep"
        exponential={exponential}
        opacity={opacity}
        zIndex={10}
      />

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          padding: '10px 12px',
          borderRadius: 10,
          fontSize: 12,
          minWidth: 180,
          background: dark ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.9)',
          border: `1px solid ${dark ? '#3f3f46' : '#e4e4e7'}`,
        }}
      >
        <Field label="Position" color={fg}>
          <select value={position} onChange={(e) => setPosition(e.target.value as BlurEdge)} style={{ fontSize: 12 }}>
            <option value="bottom">Bottom</option>
            <option value="top">Top</option>
          </select>
        </Field>
        <Field label="Target" color={fg}>
          <select value={target} onChange={(e) => setTarget(e.target.value as 'parent' | 'page')} style={{ fontSize: 12 }}>
            <option value="parent">Parent</option>
            <option value="page">Page</option>
          </select>
        </Field>
        <Field label="Exponential" color={fg}>
          <input type="checkbox" checked={exponential} onChange={(e) => setExponential(e.target.checked)} style={{ accentColor: '#B497CF' }} />
        </Field>
        <Field label={`Strength ${strength}`} color={fg}>
          <input type="range" min={1} max={5} step={0.5} value={strength} onChange={(e) => setStrength(+e.target.value)} style={inputStyle} />
        </Field>
        <Field label={`Layers ${divCount}`} color={fg}>
          <input type="range" min={1} max={10} step={1} value={divCount} onChange={(e) => setDivCount(+e.target.value)} style={inputStyle} />
        </Field>
        <Field label={`Opacity ${opacity.toFixed(1)}`} color={fg}>
          <input type="range" min={0.1} max={1} step={0.1} value={opacity} onChange={(e) => setOpacity(+e.target.value)} style={inputStyle} />
        </Field>
      </div>
    </div>
  );
}
