// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type CSSProperties } from 'react';

export type EaseFn = (t: number) => number;
export const easeOutCubic: EaseFn = (t) => 1 - Math.pow(1 - t, 3);

export interface TiltCubesProps {
  /** Células por lado. */
  gridSize?: number;
  /** Lado fixo de cada cubo em px (opcional). */
  cubeSize?: number;
  /** Ângulo máximo de inclinação (graus). */
  maxAngle?: number;
  /** Raio de influência (células). */
  radius?: number;
  easing?: EaseFn;
  /** Durações (s) de entrada e de retorno. */
  durations?: { enter: number; leave: number };
  /** Espaçamento em px (único ou por eixo). Padrão: 5%. */
  gap?: number | { col: number; row: number };
  faceBorder?: string;
  faceColor?: string;
  /** true = sombra padrão; string = sombra CSS livre. */
  shadow?: boolean | string;
  autoAnimate?: boolean;
  rippleOnClick?: boolean;
  rippleColor?: string;
  rippleSpeed?: number;
  className?: string;
}

interface CubeState {
  rx: number;
  ry: number;
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  t0: number;
  dur: number;
  active: boolean;
}

const FACES: { key: string; transform: string }[] = [
  { key: 'top', transform: 'translateY(-50%) rotateX(90deg)' },
  { key: 'bottom', transform: 'translateY(50%) rotateX(-90deg)' },
  { key: 'left', transform: 'translateX(-50%) rotateY(-90deg)' },
  { key: 'right', transform: 'translateX(50%) rotateY(90deg)' },
  { key: 'front', transform: 'translateZ(var(--tc-half, 0px))' },
  // Face traseira real, meia aresta para trás.
  { key: 'back', transform: 'rotateY(180deg) translateZ(var(--tc-half, 0px))' },
];

export function TiltCubes({
  gridSize = 10,
  cubeSize,
  maxAngle = 45,
  radius = 3,
  easing = easeOutCubic,
  durations = { enter: 0.3, leave: 0.6 },
  gap,
  faceBorder = '1px solid #fff',
  faceColor = '#120F17',
  shadow = false,
  autoAnimate = true,
  rippleOnClick = true,
  rippleColor = '#fff',
  rippleSpeed = 2,
  className,
}: TiltCubesProps) {
  const N = Math.max(1, Math.round(gridSize));
  const sceneRef = useRef<HTMLDivElement>(null);
  const cubeEls = useRef<(HTMLDivElement | null)[]>([]);
  const cubes = useRef<CubeState[]>([]);
  const timers = useRef<number[]>([]);

  const opts = useRef({ N, maxAngle, radius, easing, durations, autoAnimate, rippleOnClick, rippleColor, rippleSpeed });
  opts.current = { N, maxAngle, radius, easing, durations, autoAnimate, rippleOnClick, rippleColor, rippleSpeed };

  // Controle do laço exposto entre efeitos.
  const kick = useRef<() => void>(() => {});

  // Meia aresta em px para as faces frontal/traseira (fallback 0 mantém a face frontal visível).
  useEffect(() => {
    const scene = sceneRef.current;
    const first = cubeEls.current[0];
    if (!scene || !first) return;
    const update = () => scene.style.setProperty('--tc-half', `${first.offsetWidth / 2}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(first);
    return () => ro.disconnect();
  }, [N, cubeSize]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const n = N;
    cubes.current = Array.from({ length: n * n }, () => ({
      rx: 0, ry: 0, fx: 0, fy: 0, tx: 0, ty: 0, t0: 0, dur: 0, active: false,
    }));

    let raf = 0;
    let userActive = false;
    let idleTimer = 0;
    let visible = true;
    let pending: { row: number; col: number } | null = null;
    const sim = { row: n / 2, col: n / 2 };
    const simTarget = { row: Math.random() * n, col: Math.random() * n };

    const tweenTo = (c: CubeState, tx: number, ty: number, dur: number, now: number) => {
      c.fx = c.rx;
      c.fy = c.ry;
      c.tx = tx;
      c.ty = ty;
      c.t0 = now;
      c.dur = dur;
      c.active = true;
    };

    const tiltAt = (row: number, col: number, now: number) => {
      const o = opts.current;
      const angleMax = reduced ? o.maxAngle * 0.4 : o.maxAngle;
      for (let r = 0; r < n; r++) {
        for (let cIdx = 0; cIdx < n; cIdx++) {
          const c = cubes.current[r * n + cIdx];
          // Distância a partir do centro da célula.
          const d = Math.hypot(r + 0.5 - row, cIdx + 0.5 - col);
          if (d <= o.radius) {
            const a = (1 - d / o.radius) * angleMax;
            tweenTo(c, -a, a, o.durations.enter, now);
          } else if (c.tx !== 0 || c.ty !== 0) {
            tweenTo(c, 0, 0, o.durations.leave, now);
          }
        }
      }
    };

    const resetAll = () => {
      const now = performance.now();
      for (const c of cubes.current) if (c.tx !== 0 || c.ty !== 0 || c.rx !== 0 || c.ry !== 0) tweenTo(c, 0, 0, opts.current.durations.leave, now);
      start();
    };

    const autoOn = () => opts.current.autoAnimate && !reduced && !userActive && visible;

    const frame = (now: number) => {
      raf = 0;
      const o = opts.current;
      if (pending) {
        tiltAt(pending.row, pending.col, now);
        pending = null;
      } else if (autoOn()) {
        sim.row += (simTarget.row - sim.row) * 0.02;
        sim.col += (simTarget.col - sim.col) * 0.02;
        if (Math.hypot(simTarget.row - sim.row, simTarget.col - sim.col) < 0.1) {
          simTarget.row = Math.random() * n;
          simTarget.col = Math.random() * n;
        }
        tiltAt(sim.row, sim.col, now);
      }
      let busy = false;
      cubes.current.forEach((c, i) => {
        if (!c.active) return;
        const p = c.dur <= 0 ? 1 : Math.min(1, (now - c.t0) / (c.dur * 1000));
        const e = o.easing(p);
        c.rx = c.fx + (c.tx - c.fx) * e;
        c.ry = c.fy + (c.ty - c.fy) * e;
        if (p >= 1) c.active = false;
        else busy = true;
        const el = cubeEls.current[i];
        if (el) el.style.transform = `rotateX(${c.rx}deg) rotateY(${c.ry}deg)`;
      });
      if (busy || autoOn()) raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    kick.current = start;

    const toCells = (clientX: number, clientY: number) => {
      const rect = scene.getBoundingClientRect();
      const w = rect.width || 1;
      const h = rect.height || 1;
      return { col: (clientX - rect.left) / (w / n), row: (clientY - rect.top) / (h / n) };
    };

    const onMove = (e: PointerEvent) => {
      pending = toCells(e.clientX, e.clientY);
      userActive = true;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        userActive = false;
        start();
      }, 3000);
      start();
    };

    const onLeave = () => {
      pending = null;
      resetAll();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') onLeave();
    };

    const onClick = (e: MouseEvent) => {
      const o = opts.current;
      if (!o.rippleOnClick) return;
      const p = toCells(e.clientX, e.clientY);
      const col0 = Math.min(n - 1, Math.max(0, Math.floor(p.col)));
      const row0 = Math.min(n - 1, Math.max(0, Math.floor(p.row)));
      const v = o.rippleSpeed > 0 ? o.rippleSpeed : 2;
      const delay = 0.15 / v;
      const dur = 0.3 / v;
      const hold = 0.6 / v;
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const ring = Math.round(Math.hypot(r - row0, c - col0));
          const el = cubeEls.current[r * n + c];
          if (!el) continue;
          const t0 = ring * delay * 1000;
          timers.current.push(
            window.setTimeout(() => {
              el.style.setProperty('--tc-dur', `${dur}s`);
              el.style.setProperty('--tc-bg', o.rippleColor);
            }, t0),
            window.setTimeout(() => el.style.removeProperty('--tc-bg'), t0 + (dur + hold) * 1000),
          );
        }
      }
      // Evita acúmulo indefinido de ids já disparados.
      if (timers.current.length > 4000) timers.current = timers.current.slice(-2000);
    };

    // Pausa o laço automático fora da tela ou com a aba oculta.
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible && !document.hidden) start();
    });
    io.observe(scene);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start();
    };
    document.addEventListener('visibilitychange', onVis);

    scene.addEventListener('pointermove', onMove);
    scene.addEventListener('pointerleave', onLeave);
    scene.addEventListener('pointerup', onUp);
    scene.addEventListener('pointercancel', onLeave);
    scene.addEventListener('click', onClick);
    start();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      scene.removeEventListener('pointermove', onMove);
      scene.removeEventListener('pointerleave', onLeave);
      scene.removeEventListener('pointerup', onUp);
      scene.removeEventListener('pointercancel', onLeave);
      scene.removeEventListener('click', onClick);
      kick.current = () => {};
    };
  }, [N]);

  // Religar o movimento automático quando a opção mudar.
  useEffect(() => {
    kick.current();
  }, [autoAnimate]);

  const colGap = gap === undefined ? '5%' : typeof gap === 'number' ? `${gap}px` : `${gap.col}px`;
  const rowGap = gap === undefined ? '5%' : typeof gap === 'number' ? `${gap}px` : `${gap.row}px`;
  const track = cubeSize ? `repeat(${N}, ${cubeSize}px)` : `repeat(${N}, minmax(0, 1fr))`;
  const shadowValue = shadow === true ? '0 0 6px rgba(0,0,0,.5)' : typeof shadow === 'string' ? shadow : 'none';

  const wrapperStyle: CSSProperties = cubeSize
    ? { position: 'relative', width: N * cubeSize, height: N * cubeSize }
    : { position: 'relative', aspectRatio: '1 / 1', height: 'auto' };

  const faceStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: `var(--tc-bg, ${faceColor})`,
    border: faceBorder,
    boxShadow: shadowValue,
    opacity: 1,
    boxSizing: 'border-box',
    transition: 'background-color var(--tc-dur, 0.15s) cubic-bezier(0.215, 0.61, 0.355, 1)',
  };

  return (
    <div
      className={[cubeSize ? '' : 'w-[90%] md:w-1/2', className ?? ''].join(' ').trim()}
      style={wrapperStyle}
      aria-hidden="true"
    >
      <div
        ref={sceneRef}
        style={{
          display: 'grid',
          width: '100%',
          height: '100%',
          gridTemplateColumns: track,
          gridTemplateRows: track,
          columnGap: colGap,
          rowGap,
          // Perspectiva enorme ≈ projeção ortográfica.
          perspective: '99999999px',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
      >
        {Array.from({ length: N * N }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cubeEls.current[i] = el;
            }}
            style={{ position: 'relative', width: '100%', height: '100%', aspectRatio: '1 / 1', transformStyle: 'preserve-3d' }}
          >
            {/* Área sensível estendida 36 px além do cubo. */}
            <div style={{ position: 'absolute', inset: -36 }} />
            {FACES.map((f) => (
              <div key={f.key} style={{ ...faceStyle, transform: f.transform }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TiltCubes;
