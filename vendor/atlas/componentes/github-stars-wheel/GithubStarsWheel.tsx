// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'motion/react';

export type WheelDirection = 'down' | 'up';
export type WheelTheme = 'light' | 'dark' | 'auto';

export interface GithubStarsWheelProps {
  /** Quantidade de estrelas (prioritária sobre `fetchStars`). */
  stars?: number;
  /** Função opcional do usuário que obtém a contagem. */
  fetchStars?: () => Promise<number>;
  step?: number;
  direction?: WheelDirection;
  itemHeight?: number;
  sideItems?: number;
  delay?: number;
  spring?: { stiffness: number; damping: number };
  startOnView?: boolean;
  width?: number;
  theme?: WheelTheme;
  className?: string;
  style?: CSSProperties;
}

const fmt = new Intl.NumberFormat('en-US');

// Ponto de estrela de 5 pontas (viewBox 24); os cantos ficam arredondados pelo stroke-linejoin.
const STAR_POINTS = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 === 0 ? 9.5 : 4;
  const a = -Math.PI / 2 + (i * Math.PI) / 5;
  return `${(12 + r * Math.cos(a)).toFixed(2)},${(12.9 + r * Math.sin(a)).toFixed(2)}`;
}).join(' ');

function StarIcon({ color, style }: { color: string; style?: CSSProperties }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', ...style }}>
      <polygon points={STAR_POINTS} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

function useIsDark(ref: RefObject<HTMLElement | null>, theme: WheelTheme) {
  const [dark, setDark] = useState(theme === 'dark');
  useLayoutEffect(() => {
    if (theme !== 'auto') { setDark(theme === 'dark'); return; }
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const compute = () => {
      const host = el.closest('.dark, .light');
      setDark(host ? host.classList.contains('dark') : mq.matches);
    };
    compute();
    const mo = new MutationObserver(compute);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', compute);
    return () => { mo.disconnect(); mq.removeEventListener('change', compute); };
  }, [ref, theme]);
  return dark;
}

const PARTICLES = 6;
const PARTICLE_RADIUS = 30;

export function GithubStarsWheel({
  stars,
  fetchStars,
  step = 100,
  direction = 'down',
  itemHeight = 35,
  sideItems = 2,
  delay = 0,
  spring = { stiffness: 90, damping: 30 },
  startOnView = false,
  width = 112,
  theme = 'auto',
  className,
  style,
}: GithubStarsWheelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useIsDark(rootRef, theme);
  const reduced = !!useReducedMotion();
  const inView = useInView(rootRef, { once: true });

  // Contagem via função do usuário (só quando o valor não vem por parâmetro).
  const [fetched, setFetched] = useState<number | null>(null);
  useEffect(() => {
    if (stars != null || !fetchStars) return;
    let alive = true;
    fetchStars().then(
      (n) => { if (alive && Number.isFinite(n)) setFetched(n); },
      () => {},
    );
    return () => { alive = false; };
  }, [stars, fetchStars]);

  const raw = stars ?? fetched;
  const loading = raw == null || !Number.isFinite(raw);
  const safeStep = step > 0 ? step : 1;
  const side = Math.max(0, Math.floor(sideItems));
  const target = loading ? 0 : Math.max(0, Math.round((raw as number) / safeStep) * safeStep);
  const steps = Math.round(target / safeStep);
  const visible = 1 + 2 * side;
  const height = itemHeight * visible;

  const values = useMemo(() => {
    const arr: number[] = [];
    for (let i = steps + side; i >= 0; i--) arr.push(i * safeStep);
    return direction === 'down' ? arr : arr.reverse();
  }, [steps, side, safeStep, direction]);

  // Descendo: coluna ancorada na base, 0 começa no centro e o deslocamento cresce.
  // Subindo: coluna ancorada no topo, deslocamento decresce.
  const sign = direction === 'down' ? 1 : -1;
  const initial = -sign * side * itemHeight;
  const final = initial + sign * steps * itemHeight;

  const y = useMotionValue(initial);
  const [row, setRow] = useState(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(false);
  const started = !loading && (!startOnView || inView);
  const { stiffness, damping } = spring;

  useLayoutEffect(() => {
    if (!started) {
      y.jump(initial);
      setRow(0); setDone(false); setBurst(false);
      return;
    }
    if (reduced) {
      y.jump(final);
      setRow(steps); setDone(true); setBurst(false);
      return;
    }
    y.jump(initial);
    setRow(0); setDone(false); setBurst(false);
    // Linha = deslocamento com sinal em relação ao início (não o valor absoluto).
    const unsub = y.on('change', (v) => {
      const r = Math.min(steps, Math.max(0, Math.round((sign * (v - initial)) / itemHeight)));
      setRow((prev) => (prev === r ? prev : r));
    });
    const ctrl = animate(y, final, { type: 'spring', stiffness, damping, mass: 1, delay: delay / 1000 });
    return () => { unsub(); ctrl.stop(); };
  }, [started, reduced, initial, final, steps, sign, itemHeight, stiffness, damping, delay, y]);

  useEffect(() => {
    if (!started || done || row < steps) return;
    setDone(true);
    if (!reduced) setBurst(true);
  }, [row, steps, started, done, reduced]);

  let fill = 0;
  if (started) {
    if (done) fill = 100;
    else fill = Math.max(0, (steps > 0 ? (row / steps) * 100 : 100) - 10);
  }

  const c = dark
    ? { text: '#fafafa', band: 'rgba(38,38,38,0.4)', border: 'rgba(255,255,255,0.10)', starBase: '#404040', bg: '#0a0a0a' }
    : { text: '#0a0a0a', band: 'rgba(245,245,245,0.4)', border: '#e5e5e5', starBase: '#d4d4d4', bg: '#ffffff' };
  const fadeH = itemHeight * side;
  // Borda superior central da estrela: borda 1 + padding 8 + metade da estrela 8.
  const starTopX = 17;
  const starTopY = height / 2 - 8;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={loading ? 'Carregando estrelas' : `${fmt.format(target)} estrelas`}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', width, height, flexShrink: 0, color: c.text, ...style }}
    >
      {/* Faixa de destaque com a estrela */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)', height: itemHeight,
          boxSizing: 'border-box', background: c.band, border: `1px solid ${c.border}`, borderRadius: 8,
          paddingLeft: 8, display: 'flex', alignItems: 'center', zIndex: 0,
        }}
      >
        <span style={{ position: 'relative', width: 16, height: 16, display: 'block' }}>
          <StarIcon color={c.starBase} style={{ position: 'absolute', inset: 0 }} />
          <StarIcon color="#eab308" style={{ position: 'absolute', inset: 0, clipPath: `inset(${100 - fill}% 0 0 0)` }} />
        </span>
      </div>

      {/* Coluna de números */}
      <motion.div
        aria-hidden="true"
        style={{
          position: 'absolute', left: 0, right: 0, [direction === 'down' ? 'bottom' : 'top']: 0,
          display: 'flex', flexDirection: 'column', y, zIndex: 1,
        }}
      >
        {values.map((v) => (
          <div
            key={v}
            style={{ height: itemHeight, flexShrink: 0, display: 'flex', alignItems: 'center', paddingLeft: 32, fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt.format(v)}
          </div>
        ))}
      </motion.div>

      {/* Esmaecimento nas bordas */}
      {fadeH > 0 && (
        <>
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: fadeH, zIndex: 2, pointerEvents: 'none', background: `linear-gradient(to bottom, ${c.bg}, transparent)` }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: fadeH, zIndex: 2, pointerEvents: 'none', background: `linear-gradient(to top, ${c.bg}, transparent)` }} />
        </>
      )}

      {/* Partículas da conclusão (acima dos esmaecimentos) */}
      {burst && (
        <div aria-hidden="true" style={{ position: 'absolute', left: starTopX, top: starTopY, width: 0, height: 0, zIndex: 3, pointerEvents: 'none' }}>
          {Array.from({ length: PARTICLES }, (_, i) => {
            const a = (i * 2 * Math.PI) / PARTICLES; // volta completa: 360° ÷ quantidade
            return (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: [0, Math.cos(a) * PARTICLE_RADIUS],
                  y: [0, Math.sin(a) * PARTICLE_RADIUS],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 + i * 0.05 }}
                style={{ position: 'absolute', left: -2, top: -2, width: 4, height: 4, borderRadius: '50%', background: '#eab308' }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GithubStarsWheel;
