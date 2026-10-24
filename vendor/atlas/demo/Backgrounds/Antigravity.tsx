// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState } from "react";
import Antigravity, { type AntigravityShape } from "../../componentes/antigravity/Antigravity";

function useStageDark(ref: React.RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const host = ref.current?.closest(".dark, .light");
    setDark(host ? host.classList.contains("dark") : !!window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  }, [ref]);
  return dark;
}

const DEMO = {
  color: "#5227FF",
  particleShape: "capsule" as AntigravityShape,
  magnetRadius: 6,
  ringRadius: 7,
  waveSpeed: 0.4,
  waveAmplitude: 1,
  particleSize: 1.5,
  particleVariance: 1,
  lerpSpeed: 0.05,
  count: 300,
  rotationSpeed: 0,
  depthFactor: 1,
  pulseSpeed: 3,
  fieldStrength: 10,
  autoAnimate: true,
};
type Opts = typeof DEMO;

const SLIDERS: [keyof Opts, string, number, number, number][] = [
  ["magnetRadius", "Raio de captura", 5, 50, 1],
  ["ringRadius", "Raio do anel", 5, 25, 1],
  ["waveSpeed", "Velocidade da onda", 0, 5, 0.1],
  ["waveAmplitude", "Amplitude", 0, 5, 0.1],
  ["particleSize", "Tamanho", 0.1, 2, 0.1],
  ["particleVariance", "Variação", 0, 1, 0.1],
  ["lerpSpeed", "Atração", 0.01, 0.2, 0.01],
  ["count", "Quantidade", 100, 5000, 100],
  ["rotationSpeed", "Rotação", 0, 5, 0.1],
  ["depthFactor", "Profundidade", 0, 5, 0.1],
  ["pulseSpeed", "Pulsação", 0, 10, 0.1],
  ["fieldStrength", "Intensidade", 0.1, 20, 0.1],
];

export default function AntigravityDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const dark = useStageDark(ref);
  const [o, setO] = useState<Opts>(DEMO);
  const [panel, setPanel] = useState(false);
  const set = <K extends keyof Opts>(k: K, v: Opts[K]) => setO((p) => ({ ...p, [k]: v }));

  const text = dark ? "#fafafa" : "#0a0a0a";
  const sub = dark ? "#a3a3a3" : "#525252";
  const line = dark ? "#262626" : "#e5e5e5";
  const btn: React.CSSProperties = {
    fontSize: 12,
    padding: "4px 8px",
    borderRadius: 6,
    border: `1px solid ${line}`,
    background: dark ? "#171717" : "#ffffff",
    color: text,
    cursor: "pointer",
  };

  return (
    <div ref={ref} className="relative w-full overflow-hidden" style={{ height: 500, minHeight: 360 }}>
      <Antigravity key={JSON.stringify(o)} {...o} />

      <div className="absolute right-3 top-3 flex flex-col items-end gap-2" style={{ zIndex: 2 }}>
        <button type="button" style={btn} onClick={() => setPanel((v) => !v)} aria-expanded={panel}>
          ajustes
        </button>
        {panel && (
          <div
            className="flex flex-col gap-1.5 overflow-y-auto"
            style={{
              width: 220,
              maxHeight: 420,
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${line}`,
              background: dark ? "rgba(10,10,10,.92)" : "rgba(255,255,255,.95)",
              color: sub,
              fontSize: 11,
            }}
          >
            <label className="flex items-center justify-between gap-2">
              Cor
              <input type="color" value={o.color} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label className="flex items-center justify-between gap-2">
              Forma
              <select style={btn} value={o.particleShape} onChange={(e) => set("particleShape", e.target.value as AntigravityShape)}>
                <option value="capsule">cápsula</option>
                <option value="sphere">esfera</option>
                <option value="box">cubo</option>
                <option value="tetrahedron">tetraedro</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={o.autoAnimate} onChange={(e) => set("autoAnimate", e.target.checked)} />
              Movimento automático
            </label>
            {SLIDERS.map(([k, label, min, max, step]) => (
              <label key={k} className="flex flex-col">
                <span className="flex justify-between">
                  {label}
                  <span style={{ color: text }}>{o[k] as number}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={o[k] as number}
                  onChange={(e) => set(k, Number(e.target.value) as never)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
