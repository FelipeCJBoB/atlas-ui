// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useRef, useState } from 'react';

export type BlobShape = 'circle' | 'square';
export type EaseFn = (t: number) => number;

export const easeOutCubic: EaseFn = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutQuad: EaseFn = (t) => 1 - Math.pow(1 - t, 2);

export interface BlobCursorProps {
  shape?: BlobShape;
  fillColor?: string;
  count?: number;
  sizes?: number[];
  innerSizes?: number[];
  innerColor?: string;
  opacities?: number[];
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  /** Prefixo do id do filtro; um sufixo único por instância é sempre acrescentado. */
  filterId?: string;
  filterStdDeviation?: number;
  filterColorMatrix?: string;
  useFilter?: boolean;
  leaderDuration?: number;
  followerDuration?: number;
  leaderEase?: EaseFn;
  followerEase?: EaseFn;
  zIndex?: number;
  className?: string;
}

const DEFAULT_MATRIX = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 35 -10';

// Valor por índice com fallback para o último item do array.
function pick(arr: number[] | undefined, i: number, fallback: number): number {
  if (!arr || arr.length === 0) return fallback;
  return arr[i] ?? arr[arr.length - 1] ?? fallback;
}

interface Tween {
  x: number;
  y: number;
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  t0: number;
  dur: number;
  ease: EaseFn;
  done: boolean;
}

export function BlobCursor({
  shape = 'circle',
  fillColor = '#5227FF',
  count = 3,
  sizes = [60, 125, 75],
  innerSizes = [20, 35, 25],
  innerColor = 'rgba(255,255,255,0.8)',
  opacities = [0.6, 0.6, 0.6],
  shadowColor = 'rgba(0,0,0,0.75)',
  shadowBlur = 5,
  shadowOffsetX = 10,
  shadowOffsetY = 10,
  filterId = 'blob',
  filterStdDeviation = 30,
  filterColorMatrix = DEFAULT_MATRIX,
  useFilter = true,
  leaderDuration = 0.1,
  followerDuration = 0.5,
  leaderEase = easeOutCubic,
  followerEase = easeOutQuad,
  zIndex = 100,
  className,
}: BlobCursorProps) {
  const rawId = useId();
  const fid = `${filterId}-${rawId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tweens = useRef<Tween[]>([]);
  const rafRef = useRef(0);
  const [reduced, setReduced] = useState(false);

  // Configuração lida pelo laço sem reassinar listeners.
  const cfg = useRef({ leaderDuration, followerDuration, leaderEase, followerEase });
  cfg.current = { leaderDuration, followerDuration, leaderEase, followerEase };

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const upd = () => setReduced(mq.matches);
    upd();
    mq.addEventListener('change', upd);
    return () => mq.removeEventListener('change', upd);
  }, []);

  const n = Math.max(1, reduced ? 1 : Math.round(count));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Ouve no pai: a camada fica sem captura de ponteiro e não bloqueia cliques.
    const target: HTMLElement = container.parentElement ?? container;

    const apply = (i: number, t: Tween) => {
      const el = blobRefs.current[i];
      if (el) el.style.transform = `translate(${t.x}px, ${t.y}px) translate(-50%, -50%)`;
    };

    const tick = (now: number) => {
      let running = false;
      tweens.current.forEach((t, i) => {
        if (t.done) return;
        const p = t.dur <= 0 ? 1 : Math.min(1, (now - t.t0) / (t.dur * 1000));
        const e = t.ease(p);
        t.x = t.fx + (t.tx - t.fx) * e;
        t.y = t.fy + (t.ty - t.fy) * e;
        if (p >= 1) t.done = true;
        else running = true;
        apply(i, t);
      });
      rafRef.current = running ? requestAnimationFrame(tick) : 0;
    };

    const moveTo = (clientX: number, clientY: number) => {
      // Canto recalculado a cada movimento; coordenadas relativas ao centro (posição base das bolhas).
      const r = container.getBoundingClientRect();
      const x = clientX - r.left - r.width / 2;
      const y = clientY - r.top - r.height / 2;
      const now = performance.now();
      const c = cfg.current;
      for (let i = 0; i < blobRefs.current.length; i++) {
        if (!blobRefs.current[i]) continue;
        const prev = tweens.current[i] ?? { x: 0, y: 0 };
        const lead = i === 0;
        tweens.current[i] = {
          x: prev.x,
          y: prev.y,
          fx: prev.x,
          fy: prev.y,
          tx: x,
          ty: y,
          t0: now,
          dur: lead ? c.leaderDuration : c.followerDuration,
          ease: lead ? c.leaderEase : c.followerEase,
          done: false,
        };
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };

    const onPointer = (e: PointerEvent) => moveTo(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) moveTo(t.clientX, t.clientY);
    };
    target.addEventListener('pointermove', onPointer);
    target.addEventListener('touchmove', onTouch, { passive: true });
    return () => {
      target.removeEventListener('pointermove', onPointer);
      target.removeEventListener('touchmove', onTouch);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, []);

  const radius = shape === 'circle' ? '50%' : '0';
  const shadow = `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`;

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{ position: 'relative', width: '100%', height: '100%', zIndex, pointerEvents: 'none' }}
    >
      {useFilter && (
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} focusable="false">
          <defs>
            <filter id={fid}>
              <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={filterStdDeviation} />
              <feColorMatrix in="blur" values={filterColorMatrix} />
            </filter>
          </defs>
        </svg>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: 'transparent',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: useFilter ? `url(#${fid})` : undefined,
        }}
      >
        {Array.from({ length: n }, (_, i) => {
          const size = pick(sizes, i, 60);
          const inner = pick(innerSizes, i, 20);
          const t = tweens.current[i];
          return (
            <div
              key={i}
              ref={(el) => {
                blobRefs.current[i] = el;
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: size,
                height: size,
                borderRadius: radius,
                background: fillColor,
                opacity: pick(opacities, i, 0.6),
                boxShadow: shadow,
                transform: `translate(${t?.x ?? 0}px, ${t?.y ?? 0}px) translate(-50%, -50%)`,
                willChange: 'transform',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: (size - inner) / 2,
                  top: (size - inner) / 2,
                  width: inner,
                  height: inner,
                  borderRadius: radius,
                  background: innerColor,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BlobCursor;
