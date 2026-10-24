// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

export interface ElectricBorderProps {
  /** Cor do traço e do brilho (qualquer cor CSS). */
  color?: string;
  /** Multiplicador de velocidade. */
  speed?: number;
  /** Intensidade da distorção. */
  chaos?: number;
  /** Raio dos cantos em px (999 = pílula/círculo). */
  radius?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const OVERFLOW = 60; // quanto o canvas extrapola cada lado
const DISPLACE = 60; // px por unidade de ruído

// Hash inteiro -> [-1, 1]
function hash(x: number, y: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return ((h & 0xffff) / 0xffff) * 2 - 1;
}

// Ruído de valor 2D, periódico em x (período inteiro), smoothstep
function valueNoise(x: number, y: number, period: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % period) + period) % period;
  const x1 = (x0 + 1) % period;
  const a = hash(x0, iy, seed);
  const b = hash(x1, iy, seed);
  const c = hash(x0, iy + 1, seed);
  const d = hash(x1, iy + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

// fBm periódico ao longo do perímetro (s em [0,1)) — fecha sem emenda
function fbm(s: number, t: number, chaos: number, seed: number): number {
  let freq = 10;
  let amp = chaos;
  let sum = 0;
  for (let o = 0; o < 10; o++) {
    if (o > 0) {
      const period = Math.max(1, Math.round(8 * freq));
      sum += amp * valueNoise(s * period, t * freq * 0.3, period, seed + o * 31);
    }
    freq *= 1.6;
    amp *= 0.7;
  }
  return sum;
}

// Ponto no contorno do retângulo arredondado, por comprimento de arco (horário, início da aresta superior)
function perimeterPoint(d: number, w: number, h: number, r: number): [number, number] {
  const sw = w - 2 * r;
  const sh = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  const segs: Array<[number, (u: number) => [number, number]]> = [
    [sw, (u) => [r + u, 0]],
    [arc, (u) => { const a = -Math.PI / 2 + u / Math.max(r, 1e-6); return [w - r + r * Math.cos(a), r + r * Math.sin(a)]; }],
    [sh, (u) => [w, r + u]],
    [arc, (u) => { const a = u / Math.max(r, 1e-6); return [w - r + r * Math.cos(a), h - r + r * Math.sin(a)]; }],
    [sw, (u) => [w - r - u, h]],
    [arc, (u) => { const a = Math.PI / 2 + u / Math.max(r, 1e-6); return [r + r * Math.cos(a), h - r + r * Math.sin(a)]; }],
    [sh, (u) => [0, h - r - u]],
    [arc, (u) => { const a = Math.PI + u / Math.max(r, 1e-6); return [r + r * Math.cos(a), r + r * Math.sin(a)]; }],
  ];
  let rem = d;
  for (const [len, fn] of segs) {
    if (rem <= len || len === 0 && rem <= 0) return fn(Math.max(0, rem));
    rem -= len;
  }
  return [r, 0];
}

export function ElectricBorder({
  color = '#5227FF',
  speed = 1,
  chaos = 0.12,
  radius = 24,
  className,
  style,
  children,
}: ElectricBorderProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const params = useRef({ color, speed, chaos, radius });
  params.current = { color, speed, chaos, radius };
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = wrap.offsetWidth || 0;
    let h = wrap.offsetHeight || 0;
    let dpr = 0;
    let raf = 0;
    let last: number | null = null;
    let time = 0; // tempo acumulado preservado entre mudanças de parâmetros
    let visible = true;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;

    const fit = () => {
      const nd = Math.min(window.devicePixelRatio || 1, 2);
      const cw = w + OVERFLOW * 2;
      const ch = h + OVERFLOW * 2;
      if (nd !== dpr || canvas.width !== Math.round(cw * nd) || canvas.height !== Math.round(ch * nd)) {
        dpr = nd;
        canvas.width = Math.round(cw * nd);
        canvas.height = Math.round(ch * nd);
        canvas.style.width = `${cw}px`;
        canvas.style.height = `${ch}px`;
      }
    };

    const draw = () => {
      fit();
      const { color: col, chaos: ch, radius: rad } = params.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (w <= 0 || h <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, OVERFLOW * dpr, OVERFLOW * dpr);
      const r = Math.max(0, Math.min(rad, w / 2, h / 2));
      const perim = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;
      const n = Math.max(8, Math.round(perim / 2));
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const s = i / n;
        const [px, py] = perimeterPoint(s * perim, w, h, r);
        const dx = fbm(s, time, ch, 11) * DISPLACE;
        const dy = fbm(s, time + 17.3, ch, 97) * DISPLACE;
        if (i === 0) ctx.moveTo(px + dx, py + dy);
        else ctx.lineTo(px + dx, py + dy);
      }
      ctx.closePath();
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const frame = (ts: number) => {
      raf = 0;
      // primeira moldura: relógio começa no instante do primeiro quadro (sem salto)
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.1);
      last = ts;
      if (!reduced) time += dt * params.current.speed;
      draw();
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) { last = null; raf = requestAnimationFrame(frame); }
    };
    kick.current = () => { if (reduced || !visible) draw(); else start(); };

    const ro = new ResizeObserver(() => {
      w = wrap.offsetWidth;
      h = wrap.offsetHeight;
      draw();
    });
    ro.observe(wrap);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) start();
    });
    io.observe(wrap);

    const onMq = () => { reduced = mq.matches; kick.current(); };
    mq.addEventListener('change', onMq);

    start();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      mq.removeEventListener('change', onMq);
      kick.current = () => {};
    };
  }, []);

  // troca de parâmetros: redesenha sem reiniciar o relógio
  useEffect(() => { kick.current(); }, [color, speed, chaos, radius]);

  const layer: CSSProperties = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    pointerEvents: 'none',
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'visible',
        borderRadius: radius,
        ['--eb-color' as string]: color,
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          ...layer,
          zIndex: -1,
          transform: 'scale(1.1)',
          filter: 'blur(32px)',
          opacity: 0.3,
          background: 'linear-gradient(-30deg, var(--eb-color), transparent, var(--eb-color))',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          ...layer,
          border: '2px solid color-mix(in srgb, var(--eb-color) 60%, transparent)',
          filter: 'blur(1px)',
        }}
      />
      <div aria-hidden="true" style={{ ...layer, border: '2px solid var(--eb-color)', filter: 'blur(4px)' }} />
      <div style={{ position: 'relative', borderRadius: 'inherit' }}>{children}</div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: -OVERFLOW,
          top: -OVERFLOW,
          pointerEvents: 'none',
          display: 'block',
          zIndex: 2,
        }}
      />
    </div>
  );
}

export default ElectricBorder;
