// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import HalftoneReveal, {
  type HalftoneMode,
  type HalftoneShape,
  type HalftoneTrigger,
} from '../../componentes/halftone-reveal/HalftoneReveal';

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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export default function HalftoneRevealDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef);
  const [key, setKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [ink, setInk] = useState('#141414');
  const [paper, setPaper] = useState('#fff7e6');
  const [mode, setMode] = useState<HalftoneMode>('mono');
  const [shape, setShape] = useState<HalftoneShape>('circle');
  const [density, setDensity] = useState(71);
  const [dotSize, setDotSize] = useState(1);
  const [angle, setAngle] = useState(45);
  const [contrast, setContrast] = useState(1.15);
  const [invert, setInvert] = useState(false);
  const [radius, setRadius] = useState(0.4);
  const [sharpness, setSharpness] = useState(0.8);
  const [follow, setFollow] = useState(0.37);
  const [idle, setIdle] = useState(0);
  const [trigger, setTrigger] = useState<HalftoneTrigger>('hover');

  const panelBg = dark ? 'rgba(24,24,27,0.9)' : 'rgba(255,255,255,0.94)';
  const panelFg = dark ? '#e4e4e7' : '#27272a';
  const border = dark ? '#3f3f46' : '#d4d4d8';
  const btn = {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: panelBg,
    color: panelFg,
    cursor: 'pointer',
  } as const;
  const range = { width: 110 } as const;

  return (
    <div ref={rootRef} className="relative w-full overflow-hidden" style={{ position: 'relative', width: '100%', height: 500, minHeight: 360, padding: 0, overflow: 'hidden' }}>
      <HalftoneReveal
        key={key}
        inkColor={ink}
        paperColor={paper}
        mode={mode}
        shape={shape}
        density={density}
        dotSize={dotSize}
        angle={angle}
        contrast={contrast}
        invert={invert}
        radius={radius}
        sharpness={sharpness}
        follow={follow}
        idleReveal={idle}
        trigger={trigger}
        alt="Paisagem ilustrada impressa em retícula"
      />

      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" style={btn} onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Settings'}
          </button>
          <button type="button" style={btn} onClick={() => setKey((k) => k + 1)} aria-label="Reload">
            ↻
          </button>
        </div>
        {open && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              padding: '10px 12px',
              borderRadius: 10,
              fontSize: 12,
              width: 230,
              maxHeight: 420,
              overflowY: 'auto',
              background: panelBg,
              color: panelFg,
              border: `1px solid ${border}`,
            }}
          >
            <Row label="Ink">
              <input type="color" value={ink} onChange={(e) => setInk(e.target.value)} />
            </Row>
            <Row label="Paper">
              <input type="color" value={paper} onChange={(e) => setPaper(e.target.value)} />
            </Row>
            <Row label="Mode">
              <select value={mode} onChange={(e) => setMode(e.target.value as HalftoneMode)}>
                <option value="mono">Mono</option>
                <option value="duotone">Duotone</option>
                <option value="cmyk">CMYK</option>
              </select>
            </Row>
            <Row label="Shape">
              <select value={shape} onChange={(e) => setShape(e.target.value as HalftoneShape)}>
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="diamond">Diamond</option>
                <option value="line">Line</option>
              </select>
            </Row>
            <Row label={`Density ${density}`}>
              <input style={range} type="range" min={30} max={180} step={1} value={density} onChange={(e) => setDensity(+e.target.value)} />
            </Row>
            <Row label={`Size ${dotSize.toFixed(2)}`}>
              <input style={range} type="range" min={0.4} max={1.6} step={0.01} value={dotSize} onChange={(e) => setDotSize(+e.target.value)} />
            </Row>
            <Row label={`Angle ${angle}°`}>
              <input style={range} type="range" min={0} max={90} step={1} value={angle} onChange={(e) => setAngle(+e.target.value)} />
            </Row>
            <Row label={`Contrast ${contrast.toFixed(2)}`}>
              <input style={range} type="range" min={0.6} max={2} step={0.01} value={contrast} onChange={(e) => setContrast(+e.target.value)} />
            </Row>
            <Row label="Invert">
              <input type="checkbox" checked={invert} onChange={(e) => setInvert(e.target.checked)} />
            </Row>
            <Row label={`Radius ${radius.toFixed(2)}`}>
              <input style={range} type="range" min={0.05} max={0.6} step={0.01} value={radius} onChange={(e) => setRadius(+e.target.value)} />
            </Row>
            <Row label={`Edge ${sharpness.toFixed(2)}`}>
              <input style={range} type="range" min={0} max={1} step={0.01} value={sharpness} onChange={(e) => setSharpness(+e.target.value)} />
            </Row>
            <Row label={`Follow ${follow.toFixed(2)}s`}>
              <input style={range} type="range" min={0.02} max={0.4} step={0.01} value={follow} onChange={(e) => setFollow(+e.target.value)} />
            </Row>
            <Row label={`Idle reveal ${idle.toFixed(2)}`}>
              <input style={range} type="range" min={0} max={1} step={0.01} value={idle} onChange={(e) => setIdle(+e.target.value)} />
            </Row>
            <Row label="Trigger">
              <select value={trigger} onChange={(e) => setTrigger(e.target.value as HalftoneTrigger)}>
                <option value="hover">Hover</option>
                <option value="always">Always</option>
                <option value="off">Off</option>
              </select>
            </Row>
          </div>
        )}
      </div>
    </div>
  );
}
