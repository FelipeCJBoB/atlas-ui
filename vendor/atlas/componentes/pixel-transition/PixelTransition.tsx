// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export interface PixelTransitionProps {
  /** Primeiro conteúdo (sempre presente). */
  first: ReactNode;
  /** Segundo conteúdo (revelado após a cobertura). */
  second: ReactNode;
  /** Pixels por lado. */
  gridSize?: number;
  /** Cor dos pixels (padrão: cor atual do texto). */
  pixelColor?: string;
  /** Duração de cada fase, em segundos. */
  duration?: number;
  /** Depois de ativado, não volta ao primeiro conteúdo. */
  once?: boolean;
  /** Altura em % da largura. */
  aspectRatio?: string;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

// Observação: no estado ativo o segundo conteúdo recebe ponteiro normalmente (links e botões
// funcionam), diferente da referência, que o deixava sem captura.

const shuffled = (n: number) => {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export function PixelTransition({
  first,
  second,
  gridSize = 7,
  pixelColor = 'currentColor',
  duration = 0.3,
  once = false,
  aspectRatio = '100%',
  className,
  style,
  'aria-label': ariaLabel,
}: PixelTransitionProps) {
  const G = Math.max(1, Math.round(gridSize));
  const [showSecond, setShowSecond] = useState(false);
  const [touch, setTouch] = useState(false);
  const activeRef = useRef(false);
  const pixelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timersRef = useRef<number[]>([]);
  const onceRef = useRef(once);
  onceRef.current = once;

  // Detecção de toque só depois da montagem (seguro para SSR).
  useEffect(() => {
    const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
    setTouch('ontouchstart' in window || navigator.maxTouchPoints > 0 || coarse);
  }, []);

  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  const hideAll = () => {
    for (const p of pixelsRef.current) if (p) p.style.display = 'none';
  };

  const animate = useCallback(
    (activate: boolean) => {
      clearTimers();
      hideAll();
      activeRef.current = activate;

      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
        setShowSecond(activate);
        return;
      }

      const total = G * G;
      const D = Math.max(0, duration) * 1000;
      const step = D / total;
      const px = pixelsRef.current;

      shuffled(total).forEach((idx, k) => {
        timersRef.current.push(
          window.setTimeout(() => {
            const p = px[idx];
            if (p) p.style.display = 'block';
          }, k * step),
        );
      });
      timersRef.current.push(window.setTimeout(() => setShowSecond(activate), D));
      shuffled(total).forEach((idx, k) => {
        timersRef.current.push(
          window.setTimeout(() => {
            const p = px[idx];
            if (p) p.style.display = 'none';
          }, D + k * step),
        );
      });
    },
    [G, duration],
  );

  useEffect(() => () => clearTimers(), []);

  const activate = () => {
    if (!activeRef.current) animate(true);
  };
  const deactivate = () => {
    if (activeRef.current && !onceRef.current) animate(false);
  };
  const toggle = () => (activeRef.current ? deactivate() : activate());

  const cell = 100 / G;
  const layer: CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };

  return (
    <div
      className={['focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white', className].filter(Boolean).join(' ')}
      tabIndex={0}
      aria-label={ariaLabel}
      style={{
        background: '#222',
        color: 'var(--pixel-transition-fg, #fff)',
        borderRadius: 15,
        border: '2px solid #fff',
        width: 300,
        maxWidth: '100%',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={touch ? undefined : activate}
      onMouseLeave={touch ? undefined : deactivate}
      onFocus={touch ? undefined : activate}
      onBlur={touch ? undefined : deactivate}
      onClick={touch ? toggle : undefined}
    >
      <div style={{ paddingTop: aspectRatio }} />
      <div style={layer} aria-hidden={showSecond ? true : undefined}>
        {first}
      </div>
      <div
        style={{ ...layer, zIndex: 2, display: showSecond ? 'block' : 'none' }}
        aria-hidden={showSecond ? undefined : true}
      >
        {second}
      </div>
      <div style={{ ...layer, zIndex: 3, pointerEvents: 'none' }} aria-hidden>
        {Array.from({ length: G * G }, (_, i) => {
          const r = Math.floor(i / G);
          const c = i % G;
          return (
            <div
              key={`${G}-${i}`}
              ref={(el) => {
                pixelsRef.current[i] = el;
              }}
              style={{
                position: 'absolute',
                display: 'none',
                // Sobreposição de ~0,5 px para evitar frestas de subpixel.
                left: `calc(${c * cell}% - 0.25px)`,
                top: `calc(${r * cell}% - 0.25px)`,
                width: `calc(${cell}% + 0.5px)`,
                height: `calc(${cell}% + 0.5px)`,
                background: pixelColor,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default PixelTransition;
