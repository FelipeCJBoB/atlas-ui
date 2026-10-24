// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

export type BlurEdge = 'top' | 'bottom' | 'left' | 'right';
export type BlurCurve = 'linear' | 'bezier' | 'smoothstep' | 'ease-in' | 'ease-out' | 'ease-in-out';
export type BlurPreset =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'subtle'
  | 'intense'
  | 'smooth'
  | 'sharp'
  | 'header'
  | 'footer'
  | 'sidebar'
  | 'page-header'
  | 'page-footer';

export interface GradualBlurProps {
  position?: BlurEdge;
  strength?: number;
  /** Espessura da faixa (altura; largura nas laterais). */
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  curve?: BlurCurve;
  opacity?: number;
  animated?: boolean | 'scroll';
  duration?: string;
  easing?: string;
  hoverIntensity?: number;
  target?: 'parent' | 'page';
  preset?: BlurPreset;
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  zIndex?: number;
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

type Resolved = Required<
  Pick<
    GradualBlurProps,
    'position' | 'strength' | 'height' | 'divCount' | 'exponential' | 'curve' | 'opacity' | 'animated' | 'duration' | 'easing' | 'target' | 'zIndex' | 'responsive'
  >
> &
  GradualBlurProps;

const DEFAULTS = {
  position: 'bottom',
  strength: 2,
  height: '6rem',
  divCount: 5,
  exponential: false,
  curve: 'linear',
  opacity: 1,
  animated: false,
  duration: '0.3s',
  easing: 'ease-out',
  target: 'parent',
  zIndex: 1000,
  responsive: false,
} as const;

const PRESETS: Record<BlurPreset, Partial<GradualBlurProps>> = {
  top: { position: 'top', height: '6rem' },
  bottom: { position: 'bottom', height: '6rem' },
  left: { position: 'left', height: '6rem' },
  right: { position: 'right', height: '6rem' },
  subtle: { height: '4rem', strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: '10rem', strength: 4, divCount: 8, exponential: true },
  smooth: { height: '8rem', curve: 'smoothstep', divCount: 10 },
  sharp: { height: '5rem', curve: 'linear', divCount: 4 },
  header: { position: 'top', height: '8rem', curve: 'ease-out' },
  footer: { position: 'bottom', height: '8rem', curve: 'ease-out' },
  sidebar: { position: 'left', height: '6rem', strength: 2.5 },
  'page-header': { position: 'top', height: '10rem', target: 'page', strength: 3 },
  'page-footer': { position: 'bottom', height: '10rem', target: 'page', strength: 3 },
};

const CURVES: Record<BlurCurve, (p: number) => number> = {
  linear: (p) => p,
  // "bezier" é, na prática, smoothstep.
  bezier: (p) => p * p * (3 - 2 * p),
  smoothstep: (p) => p * p * (3 - 2 * p),
  'ease-in': (p) => p * p,
  'ease-out': (p) => 1 - (1 - p) * (1 - p),
  'ease-in-out': (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

const GRADIENT_DIR: Record<BlurEdge, string> = {
  bottom: 'to bottom',
  top: 'to top',
  left: 'to left',
  right: 'to right',
};

function supportsBackdrop() {
  if (typeof CSS === 'undefined' || !CSS.supports) return true;
  return CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)');
}

function parseSeconds(t: string) {
  const v = parseFloat(t);
  if (Number.isNaN(v)) return 0.3;
  return /ms\s*$/.test(t) ? v / 1000 : v;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Escolhe a variante de tamanho para a largura atual da janela.
function useResponsiveSize(cfg: Resolved) {
  const pick = () => {
    if (!cfg.responsive || typeof window === 'undefined') return { h: cfg.height, w: cfg.width };
    const vw = window.innerWidth;
    let h = cfg.height;
    let w = cfg.width;
    if (vw <= 480) {
      h = cfg.mobileHeight ?? h;
      w = cfg.mobileWidth ?? w;
    } else if (vw <= 768) {
      h = cfg.tabletHeight ?? h;
      w = cfg.tabletWidth ?? w;
    } else if (vw <= 1024) {
      h = cfg.desktopHeight ?? h;
      w = cfg.desktopWidth ?? w;
    }
    return { h, w };
  };
  const [size, setSize] = useState(pick);
  useEffect(() => {
    setSize(pick());
    if (!cfg.responsive) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setSize(pick()), 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.responsive, cfg.height, cfg.width, cfg.mobileHeight, cfg.tabletHeight, cfg.desktopHeight, cfg.mobileWidth, cfg.tabletWidth, cfg.desktopWidth]);
  return size;
}

export function GradualBlur(props: GradualBlurProps) {
  const cfg = useMemo<Resolved>(() => {
    const explicit = Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined)) as GradualBlurProps;
    const preset = props.preset ? PRESETS[props.preset] : {};
    return { ...DEFAULTS, ...preset, ...explicit } as Resolved;
  }, [props]);

  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [inView, setInView] = useState(cfg.animated !== 'scroll');
  const [backdropOk, setBackdropOk] = useState(true);
  const size = useResponsiveSize(cfg);
  const completeRef = useRef(cfg.onAnimationComplete);
  completeRef.current = cfg.onAnimationComplete;

  useEffect(() => setBackdropOk(supportsBackdrop()), []);

  // Modo "ao rolar": aparece quando >= 10% entra na viewport.
  useEffect(() => {
    if (cfg.animated !== 'scroll') {
      setInView(true);
      return;
    }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [cfg.animated]);

  useEffect(() => {
    if (cfg.animated !== 'scroll' || !inView || !completeRef.current) return;
    const ms = prefersReducedMotion() ? 0 : parseSeconds(cfg.duration) * 1000;
    const t = setTimeout(() => completeRef.current?.(), ms);
    return () => clearTimeout(t);
  }, [inView, cfg.animated, cfg.duration]);

  const isVertical = cfg.position === 'top' || cfg.position === 'bottom';
  const isPage = cfg.target === 'page';
  const hoverable = typeof cfg.hoverIntensity === 'number' && cfg.hoverIntensity > 0;
  const strength = hovered && hoverable ? cfg.strength * (cfg.hoverIntensity as number) : cfg.strength;
  const reduced = prefersReducedMotion();
  const transition =
    cfg.animated && !(cfg.animated === 'scroll' && reduced)
      ? `opacity ${cfg.duration} ${cfg.easing}, backdrop-filter ${cfg.duration} ${cfg.easing}, -webkit-backdrop-filter ${cfg.duration} ${cfg.easing}`
      : undefined;

  const layers = useMemo(() => {
    const n = Math.max(1, Math.round(cfg.divCount));
    const inc = 100 / n;
    const curveFn = CURVES[cfg.curve] ?? CURVES.linear;
    const dir = GRADIENT_DIR[cfg.position];
    const out: CSSProperties[] = [];
    for (let i = 1; i <= n; i++) {
      const p = curveFn(i / n);
      const blur = cfg.exponential ? Math.pow(2, 4 * p) * 0.0625 * strength : 0.0625 * (p * n + 1) * strength;
      const r = (v: number) => Math.round(v * 10) / 10;
      const stops = [`transparent ${r((i - 1) * inc)}%`, `black ${r(i * inc)}%`];
      if ((i + 1) * inc <= 100.0001) stops.push(`black ${r((i + 1) * inc)}%`);
      if ((i + 2) * inc <= 100.0001) stops.push(`transparent ${r((i + 2) * inc)}%`);
      const mask = `linear-gradient(${dir}, ${stops.join(', ')})`;
      const filter = `blur(${blur.toFixed(3)}rem)`;
      out.push(
        backdropOk
          ? {
              position: 'absolute',
              inset: 0,
              maskImage: mask,
              WebkitMaskImage: mask,
              backdropFilter: filter,
              WebkitBackdropFilter: filter,
              opacity: cfg.opacity,
              transition,
            }
          : {
              position: 'absolute',
              inset: 0,
              maskImage: mask,
              WebkitMaskImage: mask,
              background: 'rgba(0,0,0,0.3)',
              opacity: 0.5,
              transition,
            },
      );
    }
    return out;
  }, [cfg.divCount, cfg.curve, cfg.position, cfg.exponential, cfg.opacity, strength, backdropOk, transition]);

  const thickness = size.h;
  const containerStyle: CSSProperties = {
    position: isPage ? 'fixed' : 'absolute',
    pointerEvents: hoverable ? 'auto' : 'none',
    zIndex: isPage ? cfg.zIndex + 100 : cfg.zIndex,
    isolation: 'isolate',
    overflow: isPage ? undefined : 'hidden',
    opacity: cfg.animated === 'scroll' ? (inView ? 1 : 0) : 1,
    transition,
    ...(isVertical
      ? { [cfg.position]: 0, left: 0, right: 0, width: size.w ?? '100%', height: thickness }
      : { [cfg.position]: 0, top: 0, bottom: 0, height: '100%', width: size.w ?? thickness }),
    ...cfg.style,
  };

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cfg.className}
      style={containerStyle}
      onMouseEnter={hoverable ? () => setHovered(true) : undefined}
      onMouseLeave={hoverable ? () => setHovered(false) : undefined}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {layers.map((s, i) => (
          <div key={i} style={s} />
        ))}
      </div>
    </div>
  );
}

export default GradualBlur;
