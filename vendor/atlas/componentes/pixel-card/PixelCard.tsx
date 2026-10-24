// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type ReactNode,
} from 'react';
import { twMerge } from 'tailwind-merge';

export type PixelCardVariant = 'default' | 'blue' | 'yellow' | 'pink';

interface VariantPreset {
  gap: number;
  speed: number;
  colors: string[];
  /** Cor de destaque aplicada ao halo (null = halo neutro #09090b). */
  accent: string | null;
  noFocus: boolean;
}

export const PIXEL_CARD_VARIANTS: Record<PixelCardVariant, VariantPreset> = {
  default: { gap: 5, speed: 35, colors: ['#f8fafc', '#f1f5f9', '#cbd5e1'], accent: null, noFocus: false },
  blue: { gap: 10, speed: 25, colors: ['#e0f2fe', '#7dd3fc', '#0ea5e9'], accent: '#e0f2fe', noFocus: false },
  yellow: { gap: 3, speed: 20, colors: ['#fef08a', '#fde047', '#eab308'], accent: '#fef08a', noFocus: false },
  pink: { gap: 6, speed: 80, colors: ['#fecdd3', '#fda4af', '#e11d48'], accent: '#fecdd3', noFocus: true },
};

const NEUTRAL_HALO = '#09090b';
const EASE = 'cubic-bezier(0.5, 1, 0.89, 1)';
const FRAME_MS = 1000 / 60;

export interface PixelCardProps {
  variant?: PixelCardVariant;
  /** Espaçamento da grade, em px. */
  gap?: number;
  /** Velocidade da cintilação, 0 a 100. */
  speed?: number;
  /** Paleta dos quadrados. */
  colors?: string[];
  /** Desativa a reação ao foco (o cartão deixa de ser focável). */
  noFocus?: boolean;
  /** Cor do centro do halo. Padrão: destaque da variante (translúcido) ou #09090b. */
  haloColor?: string;
  /** Cor da borda. */
  borderColor?: string;
  /** Fundo do cartão. */
  background?: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Pixel {
  x: number;
  y: number;
  color: string;
  size: number;
  maxSize: number;
  sizeStep: number;
  shimmerSpeed: number;
  delay: number;
  counter: number;
  counterStep: number;
  reverse: boolean;
  shimmer: boolean;
  idle: boolean;
}

const MIN_SIZE = 0.5;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// Converte #rgb/#rrggbb em rgba(); outras cores são devolvidas sem alteração.
function withAlpha(color: string, alpha: number) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return color;
  let hex = m[1];
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function drawPixel(ctx: CanvasRenderingContext2D, p: Pixel) {
  // Quadrado centralizado numa célula virtual de 2 × 2 px.
  const offset = 1 - p.size * 0.5;
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x + offset, p.y + offset, p.size, p.size);
}

function stepAppear(ctx: CanvasRenderingContext2D, p: Pixel) {
  p.idle = false;
  if (p.counter <= p.delay) {
    p.counter += p.counterStep;
    return;
  }
  if (p.size >= p.maxSize) p.shimmer = true;
  if (p.shimmer) {
    if (p.size >= p.maxSize) p.reverse = true;
    else if (p.size <= MIN_SIZE) p.reverse = false;
    p.size += p.reverse ? -p.shimmerSpeed : p.shimmerSpeed;
  } else {
    p.size += p.sizeStep;
  }
  drawPixel(ctx, p);
}

function stepDisappear(ctx: CanvasRenderingContext2D, p: Pixel) {
  p.shimmer = false;
  p.counter = 0;
  if (p.size <= 0) {
    p.idle = true;
    return;
  }
  p.size -= 0.1;
  drawPixel(ctx, p);
}

export function PixelCard({
  variant = 'default',
  gap,
  speed,
  colors,
  noFocus,
  haloColor,
  borderColor = '#27272a',
  background = 'transparent',
  className = '',
  style,
  children,
}: PixelCardProps) {
  const preset = PIXEL_CARD_VARIANTS[variant] ?? PIXEL_CARD_VARIANTS.default;
  const finalGap = Math.max(1, Math.round(gap ?? preset.gap));
  const finalSpeed = speed ?? preset.speed;
  const finalColors = colors && colors.length > 0 ? colors : preset.colors;
  const colorsKey = finalColors.join('|');
  const finalNoFocus = noFocus ?? preset.noFocus;
  // Correção: a cor de destaque da variante é aplicada ao halo (translúcida, para manter o conteúdo legível).
  const finalHalo = haloColor ?? (preset.accent ? withAlpha(preset.accent, 0.28) : NEUTRAL_HALO);

  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef<Pixel[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [focusInside, setFocusInside] = useState(false);

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const run = useCallback(
    (mode: 'appear' | 'disappear') => {
      stop();
      lastRef.current = performance.now();
      const tick = () => {
        rafRef.current = requestAnimationFrame(tick);
        const now = performance.now();
        const elapsed = now - lastRef.current;
        if (elapsed < FRAME_MS) return; // limita a ~60 atualizações/s
        lastRef.current = now - (elapsed % FRAME_MS);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) {
          stop();
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const step = mode === 'appear' ? stepAppear : stepDisappear;
        let allIdle = true;
        for (const p of pixelsRef.current) {
          step(ctx, p);
          if (!p.idle) allIdle = false;
        }
        if (allIdle) stop();
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [stop],
  );

  // (Re)constrói a grade ao montar, ao redimensionar e ao mudar parâmetros.
  useEffect(() => {
    const card = cardRef.current;
    const canvas = canvasRef.current;
    if (!card || !canvas) return;
    const palette = colorsKey.split('|');

    const build = () => {
      const rect = card.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext('2d')?.clearRect(0, 0, width, height);

      const reduced = prefersReducedMotion();
      const clamped = Math.min(100, Math.max(0, finalSpeed));
      const baseShimmer = reduced || clamped <= 0 ? 0 : clamped * 0.001;
      const counterBase = (width + height) * 0.01;
      const cx = width / 2;
      const cy = height / 2;
      const pixels: Pixel[] = [];
      for (let x = 0; x < width; x += finalGap) {
        for (let y = 0; y < height; y += finalGap) {
          pixels.push({
            x,
            y,
            color: palette[Math.floor(Math.random() * palette.length)],
            size: 0,
            maxSize: rand(0.5, 2),
            sizeStep: Math.random() * 0.4,
            shimmerSpeed: baseShimmer * rand(0.1, 0.9),
            delay: reduced ? 0 : Math.hypot(x - cx, y - cy),
            counter: 0,
            counterStep: Math.random() * 4 + counterBase,
            reverse: false,
            shimmer: false,
            idle: false,
          });
        }
      }
      pixelsRef.current = pixels;
    };

    build();
    const ro = new ResizeObserver(() => {
      stop();
      build();
    });
    ro.observe(card);
    return () => {
      ro.disconnect();
      stop();
    };
  }, [finalGap, finalSpeed, colorsKey, stop]);

  useEffect(() => stop, [stop]);

  const isOutside = (e: FocusEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null;
    return !related || !e.currentTarget.contains(related);
  };

  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    if (!isOutside(e)) return;
    setFocusInside(true);
    if (!finalNoFocus) run('appear');
  };

  const onBlur = (e: FocusEvent<HTMLDivElement>) => {
    if (!isOutside(e)) return;
    setFocusInside(false);
    if (!finalNoFocus) run('disappear');
  };

  const haloOn = hovered || focusInside;

  return (
    <div
      ref={cardRef}
      tabIndex={finalNoFocus ? undefined : 0}
      onMouseEnter={() => {
        setHovered(true);
        run('appear');
      }}
      onMouseLeave={() => {
        setHovered(false);
        run('disappear');
      }}
      onFocus={onFocus}
      onBlur={onBlur}
      className={twMerge(
        'relative isolate grid h-[400px] w-[300px] select-none place-items-center overflow-hidden rounded-[25px] border border-solid outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a1a1aa]',
        className,
      )}
      style={{
        // Estrutura também inline, para não depender da compilação do Tailwind.
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        userSelect: 'none',
        flexShrink: 0,
        borderRadius: 25,
        borderWidth: 1,
        borderStyle: 'solid',
        // Tamanho padrão só quando a classe extra não define largura/altura.
        ...(/(^|\s)(w|size|min-w|max-w)-/.test(className) ? null : { width: 300 }),
        ...(/(^|\s)(h|size|min-h|max-h)-/.test(className) ? null : { height: 400 }),
        borderColor,
        background,
        transition: `border-color 200ms ${EASE}`,
        ...style,
      }}
    >
      {/* Halo radial: quadrado com lado = largura do cartão, centralizado na vertical. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          opacity: haloOn ? 1 : 0,
          transition: `opacity 800ms ${EASE}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            width: '100%',
            aspectRatio: '1 / 1',
            transform: 'translateY(-50%)',
            background: `radial-gradient(circle, ${finalHalo} 0%, transparent 85%)`,
          }}
        />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, display: 'block', pointerEvents: 'none' }}
      />
      {children}
    </div>
  );
}

export default PixelCard;
