// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Theme = 'light' | 'dark';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export interface SpringCarouselProps {
  /** Identificadores dos slides; o conteúdo exibido é a posição + 1. */
  slides: number[];
  loop?: boolean;
  /** Classes da casca do slide (largura-base, espaçamento e alturas). O espaçamento real é medido. */
  slideClassName?: string;
  spring?: SpringConfig;
  /** Rótulo acessível da região. */
  label?: string;
  theme?: Theme | 'auto';
  className?: string;
}

const DEFAULT_SPRING: SpringConfig = { stiffness: 240, damping: 24, mass: 1 };
const DEFAULT_SLIDE_CLASS = 'basis-[55%] mr-6 h-36 sm:h-52 md:h-72';
const FAST_SPRING = { type: 'spring' as const, stiffness: 550, damping: 30 };
const DRAG_THRESHOLD = 4;
// Projeção da inércia: quanto do movimento atual "continua" após soltar (s).
const PROJECTION_TIME = 0.3;

const TOKENS: Record<Theme, Record<string, string>> = {
  light: {
    '--mc-fg': '#0a0a0a',
    '--mc-primary': '#0a0a0a',
    '--mc-primary-90': 'rgba(10,10,10,0.9)',
    '--mc-on-primary': '#fafafa',
    '--mc-border': '#e5e5e5',
    '--mc-ring': 'rgba(161,161,161,0.5)',
  },
  dark: {
    '--mc-fg': '#fafafa',
    '--mc-primary': '#fafafa',
    '--mc-primary-90': 'rgba(250,250,250,0.9)',
    '--mc-on-primary': '#0a0a0a',
    '--mc-border': 'rgba(255,255,255,0.10)',
    '--mc-ring': 'rgba(115,115,115,0.5)',
  },
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useStageTheme(ref: RefObject<HTMLElement | null>, forced: Theme | 'auto'): Theme {
  const [theme, setTheme] = useState<Theme>(forced === 'auto' ? 'dark' : forced);
  useIsoLayoutEffect(() => {
    if (forced !== 'auto') {
      setTheme(forced);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const stage = el.closest('.light, .dark');
      setTheme(stage ? (stage.classList.contains('dark') ? 'dark' : 'light') : mq.matches ? 'dark' : 'light');
    };
    read();
    const mo = new MutationObserver(read);
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref, forced]);
  return theme;
}

// Rótulo do ponto: opacidade/escala/desfoque pela mesma mola; desfoque limitado a >= 0 (a mola ultrapassa o alvo).
function DotLabel({
  active,
  spring,
  reduced,
  children,
}: {
  active: boolean;
  spring: SpringConfig;
  reduced: boolean;
  children: ReactNode;
}) {
  const t = useSpring(active ? 1 : 0, spring);
  useEffect(() => {
    if (reduced) t.jump(active ? 1 : 0);
    else t.set(active ? 1 : 0);
  }, [active, reduced, t]);
  const opacity = useTransform(t, (v) => Math.min(Math.max(v, 0), 1));
  const scale = useTransform(t, (v) => Math.max(v, 0));
  const filter = useTransform(t, (v) => `blur(${Math.max(0, (1 - v) * 4).toFixed(2)}px)`);
  return (
    <motion.span className="block shrink-0 whitespace-nowrap px-3 py-1" style={{ opacity, scale, filter }} aria-hidden="true">
      {children}
    </motion.span>
  );
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

interface Geometry {
  W: number; // largura da janela
  s: number; // largura do slide
  step: number; // slide + espaçamento
}

export function SpringCarousel({
  slides,
  loop = true,
  slideClassName = DEFAULT_SLIDE_CLASS,
  spring = DEFAULT_SPRING,
  label = 'Carrossel',
  theme = 'auto',
  className,
}: SpringCarouselProps) {
  const N = slides.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideEls = useRef<(HTMLDivElement | null)[]>([]);
  const resolved = useStageTheme(rootRef, theme);
  const reduced = !!useReducedMotion();

  const x = useMotionValue(0);
  // Valores de reserva antes da medição.
  const geo = useRef<Geometry>({ W: 640, s: 352, step: 376 });
  const targetIdx = useRef(0); // índice "desenrolado" do destino (pode passar de N no laço)
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const [selected, setSelected] = useState(0);
  const [loopOn, setLoopOn] = useState(loop);
  const loopRef = useRef(loop);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const snapX = useCallback((j: number) => {
    const { W, s, step } = geo.current;
    return (W - s) / 2 - j * step;
  }, []);
  const indexFromX = useCallback((xv: number) => {
    const { W, s, step } = geo.current;
    return Math.round(((W - s) / 2 - xv) / step);
  }, []);
  const clampIdx = useCallback((j: number) => (loopRef.current ? j : Math.min(Math.max(j, 0), N - 1)), [N]);

  // Aplica a posição: trilho translada; no laço, cada slide é reposicionado por múltiplos da volta.
  const render = useCallback(
    (xv: number) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transform = `translate3d(${xv}px,0,0)`;
      const { W, s, step } = geo.current;
      const L = N * step;
      for (let i = 0; i < N; i++) {
        const el = slideEls.current[i];
        if (!el) continue;
        let shift = 0;
        if (loopRef.current) {
          const center = i * step + s / 2 + xv;
          const lo = W / 2 - L / 2;
          shift = mod(center - lo, L) + lo - center;
        }
        el.style.transform = shift ? `translate3d(${shift}px,0,0)` : '';
      }
      if (N > 0) setSelected(mod(indexFromX(xv), N));
    },
    [N, indexFromX],
  );

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const a = slideEls.current[0];
    const b = slideEls.current[1];
    const W = vp?.clientWidth || 640;
    const s = a?.offsetWidth || W * 0.55;
    const step = (a && b ? b.offsetLeft - a.offsetLeft : 0) || s + 24;
    geo.current = { W, s, step };
    // Laço só quando há slides suficientes para cobrir a janela com vizinhos dos dois lados.
    const canLoop = loop && N > 1 && N * step >= W + step;
    loopRef.current = canLoop;
    setLoopOn(canLoop);
    if (!canLoop) targetIdx.current = Math.min(Math.max(targetIdx.current, 0), Math.max(N - 1, 0));
  }, [loop, N]);

  const normalize = useCallback(() => {
    if (!loopRef.current || N === 0) return;
    const k = Math.floor(targetIdx.current / N);
    if (k === 0) return;
    targetIdx.current -= k * N;
    x.set(x.get() + k * N * geo.current.step);
  }, [N, x]);

  const slideTo = useCallback(
    (j: number, velocity?: number) => {
      const t = clampIdx(j);
      targetIdx.current = t;
      anim.current?.stop();
      if (reducedRef.current) {
        x.set(snapX(t));
        normalize();
        return;
      }
      // Desaceleração suave (~0,5 s), herdando a velocidade atual.
      anim.current = animate(x, snapX(t), {
        type: 'spring',
        bounce: 0,
        visualDuration: 0.5,
        velocity: velocity ?? x.getVelocity(),
        onComplete: normalize,
      });
    },
    [clampIdx, normalize, snapX, x],
  );

  // Medição inicial antes da pintura + reação a redimensionamento.
  useIsoLayoutEffect(() => {
    measure();
    x.set(snapX(targetIdx.current));
    render(x.get());
    const unsub = x.on('change', render);
    const vp = viewportRef.current;
    let ro: ResizeObserver | undefined;
    if (vp && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        anim.current?.stop();
        measure();
        x.set(snapX(targetIdx.current));
        render(x.get());
      });
      ro.observe(vp);
    }
    return () => {
      unsub();
      ro?.disconnect();
      anim.current?.stop();
    };
  }, [measure, render, snapX, x]);

  /* ---------- Arrasto ---------- */
  const drag = useRef<{
    id: number;
    startX: number;
    startY: number;
    x0: number;
    active: boolean;
    samples: { t: number; x: number }[];
  } | null>(null);
  const suppressClick = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || N === 0) return;
    if (e.pointerType === 'mouse') e.preventDefault();
    anim.current?.stop();
    suppressClick.current = false;
    drag.current = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      x0: x.get(),
      active: false,
      samples: [{ t: performance.now(), x: x.get() }],
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
      d.active = true;
      suppressClick.current = true;
    }
    let next = d.x0 + dx;
    if (!loopRef.current) {
      // Resistência elástica além das pontas.
      const max = snapX(0);
      const min = snapX(N - 1);
      if (next > max) next = max + (next - max) * 0.35;
      else if (next < min) next = min + (next - min) * 0.35;
    }
    x.set(next);
    const now = performance.now();
    d.samples.push({ t: now, x: next });
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift();
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    let v = 0;
    const now = performance.now();
    const first = d.samples[0];
    const last = d.samples[d.samples.length - 1];
    if (d.active && last && first && last.t > first.t && now - last.t < 80) {
      v = ((last.x - first.x) / (last.t - first.t)) * 1000;
    }
    const projected = x.get() + v * PROJECTION_TIME;
    slideTo(indexFromX(projected), v);
  };

  const prev = () => slideTo(targetIdx.current - 1);
  const next = () => slideTo(targetIdx.current + 1);
  const goToSlide = (k: number) => {
    const base = targetIdx.current;
    if (!loopRef.current) return slideTo(k);
    let diff = mod(k - mod(base, N), N);
    if (diff > N / 2) diff -= N;
    slideTo(base + diff);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  const atStart = !loopOn && selected <= 0;
  const atEnd = !loopOn && selected >= N - 1;
  const cardTransition = reduced ? { duration: 0 } : { type: 'spring' as const, ...spring };
  const navCls =
    'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-[var(--mc-primary)] text-[var(--mc-on-primary)] shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-colors hover:bg-[var(--mc-primary-90)] disabled:cursor-default disabled:opacity-50 outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mc-ring)]';

  return (
    <div
      ref={rootRef}
      className={'flex w-full flex-col gap-4 ' + (className ?? '')}
      style={{ ...(TOKENS[resolved] as CSSProperties), color: 'var(--mc-fg)' }}
      role="region"
      aria-roledescription="carrossel"
      aria-label={label}
    >
      <div
        ref={viewportRef}
        tabIndex={0}
        className="w-full cursor-grab overflow-hidden outline-none select-none focus-visible:ring-[3px] focus-visible:ring-[var(--mc-ring)] active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onKeyDown}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <div ref={trackRef} className="relative flex will-change-transform" style={{ touchAction: 'pan-y' }}>
          {slides.map((id, i) => {
            const isSel = i === selected; // comparação pela posição, não pelo valor
            return (
              <div
                key={`${id}-${i}`}
                ref={(el) => {
                  slideEls.current[i] = el;
                }}
                className={'min-w-0 shrink-0 grow-0 ' + slideClassName}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} de ${N}`}
              >
                <motion.div
                  className="flex size-full items-center justify-center rounded-[14px] border-4 border-solid border-[var(--mc-border)] select-none"
                  initial={false}
                  animate={{ scale: isSel || reduced ? 1 : 0.9 }}
                  transition={cardTransition}
                >
                  <span className="text-3xl font-semibold md:text-5xl" style={{ color: 'var(--mc-fg)' }}>
                    {i + 1}
                  </span>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          aria-label="Slide anterior"
          className={navCls}
          onClick={prev}
          disabled={atStart}
          whileHover={atStart ? undefined : { scale: 1.05 }}
          whileTap={atStart ? undefined : { scale: 0.95 }}
          transition={FAST_SPRING}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </motion.button>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {slides.map((id, i) => {
            const active = i === selected;
            return (
              <motion.button
                key={`dot-${id}-${i}`}
                type="button"
                aria-label={`Slide ${i + 1}`}
                aria-current={active ? 'true' : undefined}
                onClick={() => goToSlide(i)}
                className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full border-0 bg-[var(--mc-primary)] p-0 text-[14px] text-[var(--mc-on-primary)] select-none outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--mc-ring)]"
                initial={false}
                animate={{ width: active ? 68 : 12, height: active ? 28 : 12 }}
                transition={cardTransition}
                style={{ width: active ? 68 : 12, height: active ? 28 : 12 }}
              >
                <DotLabel active={active} spring={spring} reduced={reduced}>
                  Slide {i + 1}
                </DotLabel>
              </motion.button>
            );
          })}
        </div>

        <motion.button
          type="button"
          aria-label="Próximo slide"
          className={navCls}
          onClick={next}
          disabled={atEnd}
          whileHover={atEnd ? undefined : { scale: 1.05 }}
          whileTap={atEnd ? undefined : { scale: 0.95 }}
          transition={FAST_SPRING}
        >
          <ChevronRight size={20} aria-hidden="true" />
        </motion.button>
      </div>
    </div>
  );
}

export default SpringCarousel;
