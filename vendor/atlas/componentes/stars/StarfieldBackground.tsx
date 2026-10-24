// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { motion, useReducedMotion, useSpring } from "motion/react";

export interface StarfieldBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /** Quanto o céu se move em relação ao ponteiro. */
  factor?: number;
  /** Duração-base (s) de uma volta da camada 1; camadas 2 e 3 usam 2× e 3×. */
  speed?: number;
  /** Mola da paralaxe. */
  transition?: { stiffness: number; damping: number };
  /** Cor das estrelas. */
  starColor?: string;
  /** Se a camada das estrelas aceita eventos de ponteiro. */
  pointerEvents?: boolean;
  children?: ReactNode;
}

const BAND = 2000; // altura (px) de uma volta / bloco vertical do padrão
const STEP = 500; // granularidade para ampliar a largura sorteada

// Quantidade por bloco de 2000 × 2000 px (densidade visível: 1/8000, 1/20000, 1/40000 px²).
const LAYERS = [
  { size: 1, perBlock: 500, mult: 1 },
  { size: 2, perBlock: 200, mult: 2 },
  { size: 3, perBlock: 100, mult: 3 },
];

const styleSheet = `@layer components{:where(.atlas-starfield){background:radial-gradient(ellipse at bottom,#262626 0%,#000000 100%)}}`;

function makeShadows(count: number, xFrom: number, width: number, color: string) {
  const out: string[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(xFrom + Math.random() * width);
    const y = Math.floor(Math.random() * BAND); // bloco de exatamente 2000 px: laço sem "pulo"
    out[i] = `${x}px ${y}px ${color}`;
  }
  return out.join(",");
}

function StarLayer({
  size,
  perBlock,
  duration,
  color,
  span,
  rows,
  animated,
}: {
  size: number;
  perBlock: number;
  duration: number;
  color: string;
  span: { from: number; width: number };
  rows: number;
  animated: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shadows = useMemo(
    () => makeShadows(Math.round((perBlock * span.width) / BAND), span.from, span.width, color),
    [perBlock, span.from, span.width, color],
  );

  // Subida linear infinita via Web Animations (evita conflito de nomes de keyframes).
  useEffect(() => {
    const el = ref.current;
    if (!el || !animated || typeof el.animate !== "function") return;
    const anim = el.animate(
      [{ transform: "translateY(0px)" }, { transform: `translateY(-${BAND}px)` }],
      { duration: Math.max(0.001, duration) * 1000, iterations: Infinity, easing: "linear" },
    );
    return () => anim.cancel();
  }, [duration, animated]);

  // Cópias do bloco a cada 2000 px, de −2000 px até cobrir a altura visível.
  const copies: number[] = [];
  for (let k = -1; k < rows; k++) copies.push(k * BAND);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: BAND, willChange: "transform" }}
    >
      {copies.map((top) => (
        <div
          key={top}
          style={{
            position: "absolute",
            top,
            left: 0,
            width: size,
            height: size,
            borderRadius: 9999,
            background: "transparent",
            boxShadow: shadows,
          }}
        />
      ))}
    </div>
  );
}

export function StarfieldBackground({
  factor = 0.05,
  speed = 50,
  transition = { stiffness: 50, damping: 20 },
  starColor = "#fff",
  pointerEvents = true,
  className,
  style,
  children,
  onPointerMove,
  ...rest
}: StarfieldBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = !!useReducedMotion();
  const spring = { stiffness: transition.stiffness, damping: transition.damping, mass: 1 };
  const x = useSpring(1, spring);
  const y = useSpring(1, spring);

  // Área coberta: só cresce (evita ressortear a cada redimensionamento). Fallback 2000 × 2000.
  const [area, setArea] = useState({ width: BAND, rows: 2, pad: 120 });
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      // Margem lateral para a paralaxe não revelar bordas vazias.
      const pad = Math.ceil((Math.max(w, h) / 2) * Math.abs(factor)) + 16;
      const width = Math.max(BAND, Math.ceil((w + 2 * pad) / STEP) * STEP);
      const rows = Math.ceil((h + pad) / BAND) + 1;
      setArea((a) =>
        width > a.width || rows > a.rows || pad > a.pad
          ? { width: Math.max(width, a.width), rows: Math.max(rows, a.rows), pad: Math.max(pad, a.pad) }
          : a,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [factor]);

  const span = useMemo(() => ({ from: -area.pad, width: area.width }), [area.pad, area.width]);

  const handleMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    if (reduce) return;
    // Centro do próprio contêiner (correção: a referência usava o centro da janela).
    const r = e.currentTarget.getBoundingClientRect();
    x.set(-(e.clientX - (r.left + r.width / 2)) * factor);
    y.set(-(e.clientY - (r.top + r.height / 2)) * factor);
  };

  return (
    <div
      ref={rootRef}
      className={["atlas-starfield", className].filter(Boolean).join(" ")}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", isolation: "isolate", ...style }}
      onPointerMove={handleMove}
      {...rest}
    >
      <style href="atlas-starfield-styles" precedence="atlas-components">
        {styleSheet}
      </style>
      <motion.div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: -1, // abaixo do conteúdo filho, acima do fundo do contêiner
          pointerEvents: pointerEvents ? "auto" : "none",
          x: reduce ? 0 : x,
          y: reduce ? 0 : y,
        }}
      >
        {LAYERS.map((l) => (
          <StarLayer
            key={l.size}
            size={l.size}
            perBlock={l.perBlock}
            duration={speed * l.mult}
            color={starColor}
            span={span}
            rows={area.rows}
            animated={!reduce}
          />
        ))}
      </motion.div>
      {children}
    </div>
  );
}

export default StarfieldBackground;
