// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import ElectricBorder from '../../componentes/electric-border/ElectricBorder';

type Scene = 'card' | 'button' | 'circle';
interface SceneValues { color: string; speed: number; chaos: number; radius: number }

const INITIAL: Record<Scene, SceneValues> = {
  card: { color: '#7df9ff', speed: 1, chaos: 0.12, radius: 16 },
  button: { color: '#B497CF', speed: 1, chaos: 0.12, radius: 999 },
  circle: { color: '#7df9ff', speed: 1, chaos: 0.12, radius: 999 },
};

function useStageDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const host = el.closest('.dark, .light');
    const read = () => {
      if (host) setDark(host.classList.contains('dark'));
      else setDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    read();
    if (!host) return;
    const mo = new MutationObserver(read);
    mo.observe(host, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [ref]);
  return dark;
}

const pill: CSSProperties = {
  fontSize: 12,
  padding: '3px 10px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.18)',
  color: 'rgba(255,255,255,0.85)',
};

export default function ElectricBorderDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useStageDark(rootRef);
  const [scene, setScene] = useState<Scene>('card');
  const [values, setValues] = useState(INITIAL);
  const v = values[scene];
  const set = (patch: Partial<SceneValues>) => setValues((all) => ({ ...all, [scene]: { ...all[scene], ...patch } }));

  const fg = dark ? '#e7e7ef' : '#18181b';
  const panel: CSSProperties = {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    fontSize: 11,
    color: fg,
    background: dark ? 'rgba(20,20,28,0.72)' : 'rgba(255,255,255,0.8)',
    border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
    backdropFilter: 'blur(6px)',
    width: 180,
  };
  const row: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 };

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full flex items-center justify-center"
      style={{ minHeight: 500, height: 500, overflow: 'hidden' }}
    >
      <div style={panel}>
        <label style={row}>
          Exemplo
          <select value={scene} onChange={(e) => setScene(e.target.value as Scene)} style={{ fontSize: 11, color: '#111' }}>
            <option value="card">Cartão</option>
            <option value="button">Botão</option>
            <option value="circle">Círculo</option>
          </select>
        </label>
        <label style={row}>
          Cor
          <input type="color" value={v.color} onChange={(e) => set({ color: e.target.value })} />
        </label>
        <label style={row}>
          Velocidade {v.speed.toFixed(1)}
          <input type="range" min={0.1} max={3} step={0.1} value={v.speed} onChange={(e) => set({ speed: +e.target.value })} style={{ width: 70 }} />
        </label>
        <label style={row}>
          Caos {v.chaos.toFixed(2)}
          <input type="range" min={0.01} max={0.3} step={0.01} value={v.chaos} onChange={(e) => set({ chaos: +e.target.value })} style={{ width: 70 }} />
        </label>
        <label style={row}>
          Raio {v.radius > 100 ? 100 : v.radius}
          <input type="range" min={0} max={100} step={1} value={Math.min(v.radius, 100)} onChange={(e) => set({ radius: +e.target.value })} style={{ width: 70 }} />
        </label>
      </div>

      {scene === 'card' && (
        <ElectricBorder color={v.color} speed={v.speed} chaos={v.chaos} radius={v.radius}>
          <div
            style={{
              width: 300,
              height: 360,
              borderRadius: 16,
              padding: 24,
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              background: 'rgba(12,12,20,0.82)',
              color: '#fff',
            }}
          >
            <span style={{ alignSelf: 'flex-start', fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.1)' }}>
              Featured
            </span>
            <div style={{ fontSize: 22, fontWeight: 600 }}>Electric Card</div>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              An electric border for shocking your users, the right way.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={pill}>Live</span>
              <span style={pill}>v1.0</span>
            </div>
            <button
              type="button"
              style={{
                marginTop: 'auto',
                width: '100%',
                padding: '10px 0',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Get Started
            </button>
          </div>
        </ElectricBorder>
      )}

      {scene === 'button' && (
        <ElectricBorder color={v.color} speed={v.speed} chaos={v.chaos} radius={v.radius}>
          <button
            type="button"
            style={{
              display: 'block',
              fontSize: 16,
              padding: '14px 28px',
              borderRadius: 999,
              background: '#121218',
              color: '#f2f2f7',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Learn More
          </button>
        </ElectricBorder>
      )}

      {scene === 'circle' && (
        <ElectricBorder color={v.color} speed={v.speed} chaos={v.chaos} radius={v.radius}>
          <div style={{ width: 200, height: 200, borderRadius: '50%' }} />
        </ElectricBorder>
      )}
    </div>
  );
}
