// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react';
import BlobCursor, { type BlobShape } from '../../componentes/blob-cursor/BlobCursor';

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

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}

// Ao aumentar a quantidade, os arrays herdam o último valor (ou o padrão).
function grow(arr: number[], n: number, fallback: number) {
  const out = arr.slice(0, n);
  while (out.length < n) out.push(out[out.length - 1] ?? fallback);
  return out;
}

export default function BlobCursorDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef);
  const [fill, setFill] = useState('#5227FF');
  const [inner, setInner] = useState('#ffffff');
  const [shadowColor, setShadowColor] = useState('#000000');
  const [shape, setShape] = useState<BlobShape>('circle');
  const [count, setCount] = useState(3);
  const [sizes, setSizes] = useState([60, 125, 75]);
  const [innerSizes, setInnerSizes] = useState([20, 35, 25]);
  const [opacities, setOpacities] = useState([0.6, 0.6, 0.6]);
  const [shadowBlur, setShadowBlur] = useState(5);
  const [sx, setSx] = useState(10);
  const [sy, setSy] = useState(10);
  const [lead, setLead] = useState(0.1);
  const [follow, setFollow] = useState(0.5);
  const [z, setZ] = useState(100);

  const setN = (n: number) => {
    setCount(n);
    setSizes((a) => grow(a, n, 60));
    setInnerSizes((a) => grow(a, n, 20));
    setOpacities((a) => grow(a, n, 0.6));
  };
  const setFirst = (setter: Dispatch<SetStateAction<number[]>>, v: number) =>
    setter((a) => [v, ...a.slice(1)]);

  const fg = dark ? '#e4e4e7' : '#18181b';
  const panelBg = dark ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.9)';
  const border = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  return (
    <div ref={rootRef} className="relative w-full overflow-hidden" style={{ height: 600 }}>
      <BlobCursor
        fillColor={fill}
        innerColor={inner + 'cc'}
        shadowColor={shadowColor + 'bf'}
        shape={shape}
        count={count}
        sizes={sizes}
        innerSizes={innerSizes}
        opacities={opacities}
        shadowBlur={shadowBlur}
        shadowOffsetX={sx}
        shadowOffsetY={sy}
        leaderDuration={lead}
        followerDuration={follow}
        zIndex={z}
      />
      <details
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 2000,
          width: 230,
          maxHeight: 'calc(100% - 24px)',
          overflowY: 'auto',
          background: panelBg,
          color: fg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: '6px 10px',
          fontSize: 12,
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Ajustes</summary>
        <div style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          <Row label="Preenchimento">
            <input type="color" value={fill} onChange={(e) => setFill(e.target.value)} />
          </Row>
          <Row label="Cor interna">
            <input type="color" value={inner} onChange={(e) => setInner(e.target.value)} />
          </Row>
          <Row label="Sombra">
            <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} />
          </Row>
          <Row label="Forma">
            <select value={shape} onChange={(e) => setShape(e.target.value as BlobShape)} style={{ color: '#18181b' }}>
              <option value="circle">Círculo</option>
              <option value="square">Quadrado</option>
            </select>
          </Row>
          <Row label={`Quantidade ${count}`}>
            <input type="range" min={1} max={5} value={count} onChange={(e) => setN(+e.target.value)} />
          </Row>
          <Row label={`Líder ${sizes[0]}px`}>
            <input type="range" min={10} max={200} value={sizes[0]} onChange={(e) => setFirst(setSizes, +e.target.value)} />
          </Row>
          <Row label={`Ponto ${innerSizes[0]}px`}>
            <input type="range" min={1} max={100} value={innerSizes[0]} onChange={(e) => setFirst(setInnerSizes, +e.target.value)} />
          </Row>
          <Row label={`Opacidade ${opacities[0].toFixed(2)}`}>
            <input type="range" min={0.1} max={1} step={0.05} value={opacities[0]} onChange={(e) => setFirst(setOpacities, +e.target.value)} />
          </Row>
          <Row label={`Desfoque ${shadowBlur}`}>
            <input type="range" min={0} max={50} value={shadowBlur} onChange={(e) => setShadowBlur(+e.target.value)} />
          </Row>
          <Row label={`Sombra X ${sx}`}>
            <input type="range" min={-50} max={50} value={sx} onChange={(e) => setSx(+e.target.value)} />
          </Row>
          <Row label={`Sombra Y ${sy}`}>
            <input type="range" min={-50} max={50} value={sy} onChange={(e) => setSy(+e.target.value)} />
          </Row>
          <Row label={`Líder ${lead.toFixed(2)}s`}>
            <input type="range" min={0.01} max={2} step={0.01} value={lead} onChange={(e) => setLead(+e.target.value)} />
          </Row>
          <Row label={`Seguidoras ${follow.toFixed(2)}s`}>
            <input type="range" min={0.01} max={3} step={0.01} value={follow} onChange={(e) => setFollow(+e.target.value)} />
          </Row>
          <Row label={`z-index ${z}`}>
            <input type="range" min={0} max={1000} step={10} value={z} onChange={(e) => setZ(+e.target.value)} />
          </Row>
          <p style={{ opacity: 0.7, lineHeight: 1.4, margin: 0 }}>
            Filtros SVG não são totalmente suportados no Safari; o desempenho pode variar.
          </p>
        </div>
      </details>
    </div>
  );
}
