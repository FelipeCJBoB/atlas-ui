// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

export interface BubbleColors {
  first: string;
  second: string;
  third: string;
  fourth: string;
  fifth: string;
  sixth: string;
}

export interface BubbleBackgroundProps {
  /** Triplas RGB "r,g,b". */
  colors?: Partial<BubbleColors>;
  interactive?: boolean;
  transition?: { stiffness: number; damping: number };
  /** Devolve a mancha interativa ao centro ao sair do contêiner. */
  returnOnLeave?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

const DEFAULT_COLORS: BubbleColors = {
  first: '18,113,255',
  second: '221,74,255',
  third: '0,220,255',
  fourth: '200,50,50',
  fifth: '180,180,50',
  sixth: '140,100,255',
};

const blobBg = (v: string) => `radial-gradient(circle closest-side at center, rgba(var(${v}), 0.8) 0, rgba(var(${v}), 0) 50%) no-repeat`;

const blobBase: CSSProperties = {
  position: 'absolute',
  borderRadius: '50%',
  mixBlendMode: 'hard-light',
  willChange: 'transform', // promove a camada de GPU
};

const layerBase: CSSProperties = { position: 'absolute', inset: 0, willChange: 'transform' };

export function BubbleBackground({
  colors,
  interactive = false,
  transition = { stiffness: 100, damping: 20 },
  returnOnLeave = false,
  gradientFrom = '#4c1d95',
  gradientTo = '#1e3a8a',
  className,
  style,
  children,
}: BubbleBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = !!useReducedMotion();
  // Id de filtro único por instância.
  const filterId = `atlas-bubble-goo-${useId().replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const c = { ...DEFAULT_COLORS, ...colors };

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, transition);
  const sy = useSpring(my, transition);

  useEffect(() => {
    const el = rootRef.current;
    if (!interactive || reduced || !el) return;
    let rect = el.getBoundingClientRect();
    let raf = 0;
    let px = 0;
    let py = 0;
    const measure = () => { rect = el.getBoundingClientRect(); };
    // Agrupa as atualizações do ponteiro por quadro.
    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        mx.set(px - rect.left - rect.width / 2);
        my.set(py - rect.top - rect.height / 2);
      });
    };
    const onLeave = () => {
      if (!returnOnLeave) return;
      cancelAnimationFrame(raf);
      raf = 0;
      mx.set(0);
      my.set(0);
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [interactive, reduced, returnOnLeave, mx, my]);

  const vars = {
    '--bubble-c1': c.first,
    '--bubble-c2': c.second,
    '--bubble-c3': c.third,
    '--bubble-c4': c.fourth,
    '--bubble-c5': c.fifth,
    '--bubble-c6': c.sixth,
  } as CSSProperties;

  const loop = (duration: number, ease: 'linear' | 'easeInOut') => ({ duration, ease, repeat: Infinity });

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        isolation: 'isolate',
        background: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
        ...vars,
        ...style,
      }}
    >
      <svg aria-hidden="true" focusable="false" style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* z-index −1 dentro do contêiner isolado: o conteúdo filho fica sempre acima. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: -1, pointerEvents: 'none', filter: `url(#${filterId}) blur(40px)` }}>
        {/* 1: oscila na vertical */}
        <motion.div
          style={{ ...blobBase, width: '80%', height: '80%', top: '10%', left: '10%', background: blobBg('--bubble-c1') }}
          animate={reduced ? undefined : { y: [-50, 50, -50] }}
          transition={loop(30, 'easeInOut')}
        />
        {/* 2: órbita em torno de (centro − 400 px, centro) */}
        <motion.div
          style={{ ...layerBase, transformOrigin: 'calc(50% - 400px) 50%' }}
          animate={reduced ? undefined : { rotate: [0, 360] }}
          transition={loop(20, 'linear')}
        >
          <div style={{ ...blobBase, width: '80%', height: '80%', top: '10%', left: '10%', background: blobBg('--bubble-c2') }} />
        </motion.div>
        {/* 3: órbita em torno de (centro + 400 px, centro) */}
        <motion.div
          style={{ ...layerBase, transformOrigin: 'calc(50% + 400px) 50%' }}
          animate={reduced ? undefined : { rotate: [0, 360] }}
          transition={loop(40, 'linear')}
        >
          <div
            style={{ ...blobBase, width: '80%', height: '80%', top: 'calc(50% + 200px)', left: 'calc(50% - 500px)', background: blobBg('--bubble-c3') }}
          />
        </motion.div>
        {/* 4: oscila na horizontal */}
        <motion.div
          style={{ ...blobBase, width: '80%', height: '80%', top: '10%', left: '10%', opacity: 0.7, background: blobBg('--bubble-c4') }}
          animate={reduced ? undefined : { x: [-50, 50, -50] }}
          transition={loop(40, 'easeInOut')}
        />
        {/* 5: grande, órbita em torno de (centro − 800 px, centro + 200 px) */}
        <motion.div
          style={{ ...layerBase, transformOrigin: 'calc(50% - 800px) calc(50% + 200px)' }}
          animate={reduced ? undefined : { rotate: [0, 360] }}
          transition={loop(20, 'linear')}
        >
          <div style={{ ...blobBase, width: '160%', height: '160%', top: '-30%', left: '-30%', background: blobBg('--bubble-c5') }} />
        </motion.div>
        {/* 6: segue o ponteiro */}
        {interactive && (
          <motion.div
            style={{ ...blobBase, width: '100%', height: '100%', top: 0, left: 0, opacity: 0.7, x: sx, y: sy, background: blobBg('--bubble-c6') }}
          />
        )}
      </div>

      {children}
    </div>
  );
}

export default BubbleBackground;
