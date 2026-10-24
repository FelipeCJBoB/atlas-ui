// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react';

export interface RubberBandSliderProps {
  /** Valor inicial (pode estar fora do intervalo até a primeira interação). */
  defaultValue?: number;
  /** Início do intervalo. */
  min?: number;
  /** Fim do intervalo. */
  max?: number;
  /** Classe extra do contêiner. */
  className?: string;
  /** Ativa valores em passos discretos. */
  stepped?: boolean;
  /** Tamanho do passo (múltiplos contados a partir de zero). */
  stepSize?: number;
  /** Conteúdo da ponta esquerda. */
  startIcon?: ReactNode;
  /** Conteúdo da ponta direita. */
  endIcon?: ReactNode;
  /** Rótulo acessível da ponta esquerda (sem ele, a ponta é decorativa). */
  startIconLabel?: string;
  /** Rótulo acessível da ponta direita (sem ele, a ponta é decorativa). */
  endIconLabel?: string;
  /** Nome acessível do slider. */
  label?: string;
  /** Chamado quando o usuário muda o valor. */
  onValueChange?: (value: number) => void;
}

type Region = 'left' | 'middle' | 'right';

const MAX_STRETCH = 50; // limite do estiramento elástico (px)
const HOVER_SCALE = 1.2;

// Saturação suave: sigmoide logística remapeada para 0 → 0 e ∞ → 1, vezes o limite.
function softLimit(excess: number, limit: number): number {
  if (limit <= 0) return 0;
  const sig = 1 / (1 + Math.exp(-excess / limit));
  return 2 * (sig - 0.5) * limit;
}

function clampTo(v: number, a: number, b: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return Math.min(hi, Math.max(lo, v));
}

function snap(v: number, step: number): number {
  if (!(step > 0)) return v;
  return Math.round(v / step) * step;
}

function SpeakerLow() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 5.2a1 1 0 0 0-1.6-.8L5.6 7.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2.6l3.8 3.1A1 1 0 0 0 11 18.8V5.2Z" />
      <path d="M14.3 8.6a.9.9 0 0 1 1.3.1 5.1 5.1 0 0 1 0 6.6.9.9 0 1 1-1.4-1.2 3.3 3.3 0 0 0 0-4.2.9.9 0 0 1 .1-1.3Z" />
    </svg>
  );
}

function SpeakerHigh() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 5.2a1 1 0 0 0-1.6-.8L5.6 7.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h2.6l3.8 3.1A1 1 0 0 0 11 18.8V5.2Z" />
      <path d="M14.3 8.6a.9.9 0 0 1 1.3.1 5.1 5.1 0 0 1 0 6.6.9.9 0 1 1-1.4-1.2 3.3 3.3 0 0 0 0-4.2.9.9 0 0 1 .1-1.3Z" />
      <path d="M17.2 5.6a.9.9 0 0 1 1.3 0 9.2 9.2 0 0 1 0 12.8.9.9 0 1 1-1.3-1.3 7.4 7.4 0 0 0 0-10.2.9.9 0 0 1 0-1.3Z" />
    </svg>
  );
}

export function RubberBandSlider({
  defaultValue = 50,
  min = 0,
  max = 100,
  className = '',
  stepped = false,
  stepSize = 1,
  startIcon = <SpeakerLow />,
  endIcon = <SpeakerHigh />,
  startIconLabel,
  endIconLabel,
  label = 'Volume',
  onValueChange,
}: RubberBandSliderProps) {
  const [value, setValue] = useState(defaultValue);
  const [pressed, setPressed] = useState(false);
  const [region, setRegion] = useState<Region>('middle');
  const regionRef = useRef<Region>('middle');
  const captureRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Mudar o valor inicial após a montagem redefine o valor atual.
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  // Valores animados fora do ciclo de render.
  const scale = useMotionValue(1);
  const overflow = useMotionValue(0);
  const pointerX = useMotionValue(0);
  const startPulse = useMotionValue(1);
  const endPulse = useMotionValue(1);

  const rowOpacity = useTransform(scale, [1, HOVER_SCALE], [0.7, 1]);
  const trackHeight = useTransform(scale, [1, HOVER_SCALE], [6, 12]);
  const trackMargin = useTransform(scale, [1, HOVER_SCALE], [0, -3]);

  const trackScaleX = useTransform(overflow, (e) => {
    const w = captureRef.current?.getBoundingClientRect().width || 1;
    return 1 + e / w;
  });
  const trackScaleY = useTransform(overflow, [0, MAX_STRETCH], [1, 0.8]);
  const trackOrigin = useTransform(pointerX, (x) => {
    const rect = captureRef.current?.getBoundingClientRect();
    if (!rect) return 'left center';
    return x < rect.left + rect.width / 2 ? 'right center' : 'left center';
  });

  // O ícone do lado esticado acompanha o estiramento, compensando a escala da linha.
  const startShift = useTransform([overflow, scale], ([e, s]: number[]) =>
    regionRef.current === 'left' ? -e / (s || 1) : 0,
  );
  const endShift = useTransform([overflow, scale], ([e, s]: number[]) =>
    regionRef.current === 'right' ? e / (s || 1) : 0,
  );

  // Pulso do ícone ao entrar em uma região de borda.
  useEffect(() => {
    if (region === 'left' && !reduceMotion) {
      const a = animate(startPulse, [1, 1.4, 1], { duration: 0.25 });
      return () => a.stop();
    }
    if (region === 'right' && !reduceMotion) {
      const a = animate(endPulse, [1, 1.4, 1], { duration: 0.25 });
      return () => a.stop();
    }
    startPulse.set(1);
    endPulse.set(1);
  }, [region, reduceMotion, startPulse, endPulse]);

  const commit = useCallback(
    (next: number) => {
      setValue(next);
      onValueChange?.(next);
    },
    [onValueChange],
  );

  const normalize = useCallback(
    (raw: number) => clampTo(stepped ? snap(raw, stepSize) : raw, min, max),
    [stepped, stepSize, min, max],
  );

  const changeRegion = (next: Region) => {
    regionRef.current = next;
    setRegion(next);
  };

  const enlarge = () => {
    if (reduceMotion) return;
    animate(scale, HOVER_SCALE, { duration: 0.3, ease: 'easeOut' });
  };
  const shrink = () => {
    animate(scale, 1, { duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' });
  };

  const updateFromPointer = (clientX: number) => {
    const el = captureRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    pointerX.set(clientX);

    const frac = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    commit(normalize(min + frac * (max - min)));

    let excess = 0;
    let next: Region = 'middle';
    if (clientX < rect.left) {
      next = 'left';
      excess = rect.left - clientX;
    } else if (clientX > rect.right) {
      next = 'right';
      excess = clientX - rect.right;
    }
    if (next !== regionRef.current) changeRegion(next);
    overflow.set(softLimit(excess, MAX_STRETCH));
  };

  const release = () => {
    setPressed(false);
    if (reduceMotion) {
      overflow.set(0);
    } else {
      animate(overflow, 0, { type: 'spring', bounce: 0.5 });
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPressed(true);
    updateFromPointer(e.clientX);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0) updateFromPointer(e.clientX);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const range = max - min;
    const base = clampTo(value, min, max);
    const small = stepped && stepSize > 0 ? stepSize : Math.abs(range) * 0.01;
    const large =
      stepped && stepSize > 0
        ? Math.max(stepSize, snap(Math.abs(range) * 0.1, stepSize))
        : Math.abs(range) * 0.1;
    const dir = range >= 0 ? 1 : -1;

    let next: number;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = normalize(base + small * dir);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = normalize(base - small * dir);
        break;
      case 'PageUp':
        next = normalize(base + large * dir);
        break;
      case 'PageDown':
        next = normalize(base - large * dir);
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    commit(next);
  };

  const range = max - min;
  const fillPct = range === 0 ? 0 : Math.max(0, ((value - min) / range) * 100);
  const shown = Math.round(value);

  return (
    <div
      className={`relative flex w-48 flex-col items-center justify-center gap-4 ${className}`}
    >
      <motion.div
        className="flex w-full touch-none select-none items-center justify-center gap-4"
        style={{ scale, opacity: rowOpacity }}
        onHoverStart={enlarge}
        onHoverEnd={shrink}
        onTouchStart={enlarge}
        onTouchEnd={shrink}
      >
        <motion.div
          className="flex shrink-0 items-center justify-center"
          style={{ x: startShift, scale: startPulse, color: '#888' }}
          {...(startIconLabel
            ? { role: 'img', 'aria-label': startIconLabel }
            : { 'aria-hidden': true })}
        >
          {startIcon}
        </motion.div>

        <div
          ref={captureRef}
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={Math.min(min, max)}
          aria-valuemax={Math.max(min, max)}
          aria-valuenow={value}
          aria-valuetext={String(shown)}
          aria-orientation="horizontal"
          className={`relative flex w-full max-w-[200px] grow items-center rounded-md py-4 outline-none focus-visible:ring-2 focus-visible:ring-[#888] ${
            pressed ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={release}
          onPointerCancel={release}
          onLostPointerCapture={() => {
            if (pressed) release();
          }}
          onKeyDown={onKeyDown}
        >
          <motion.div
            className="flex grow"
            style={{
              scaleX: trackScaleX,
              scaleY: trackScaleY,
              transformOrigin: trackOrigin,
              height: trackHeight,
              marginTop: trackMargin,
              marginBottom: trackMargin,
            }}
          >
            <div
              className="relative h-full grow overflow-hidden rounded-full"
              style={{ backgroundColor: 'rgba(128,128,128,0.4)' }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${fillPct}%`, backgroundColor: '#888' }}
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          className="flex shrink-0 items-center justify-center"
          style={{ x: endShift, scale: endPulse, color: '#888' }}
          {...(endIconLabel
            ? { role: 'img', 'aria-label': endIconLabel }
            : { 'aria-hidden': true })}
        >
          {endIcon}
        </motion.div>
      </motion.div>

      <p
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full m-0 -translate-x-1/2 -translate-y-4 whitespace-nowrap"
        style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: '#808080',
        }}
      >
        {shown}
      </p>
    </div>
  );
}

export default RubberBandSlider;
