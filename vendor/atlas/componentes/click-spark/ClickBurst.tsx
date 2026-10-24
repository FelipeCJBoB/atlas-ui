// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';

export type ClickBurstEasing = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface ClickBurstProps {
  /** Cor dos traços (qualquer cor CSS). */
  color?: string;
  /** Comprimento inicial de cada traço, em px. */
  length?: number;
  /** Distância máxima percorrida a partir do clique, em px. */
  reach?: number;
  /** Quantidade de traços por clique. */
  count?: number;
  /** Duração da animação, em ms. */
  durationMs?: number;
  /** Curva de easing. Valor não reconhecido cai em ease-out. */
  easing?: ClickBurstEasing;
  /** Multiplicador extra da distância. */
  scale?: number;
  /** Conteúdo envolvido. */
  children?: ReactNode;
}

interface Burst {
  x: number;
  y: number;
  start: number;
}

const LINE_WIDTH = 2;

const EASINGS: Record<ClickBurstEasing, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
};

function applyEasing(name: string, t: number): number {
  // Valor não reconhecido cai em ease-out.
  const fn = Object.prototype.hasOwnProperty.call(EASINGS, name)
    ? EASINGS[name as ClickBurstEasing]
    : EASINGS['ease-out'];
  return fn(t);
}

export function ClickBurst({
  color = '#fff',
  length = 10,
  reach = 15,
  count = 8,
  durationMs = 400,
  easing = 'ease-out',
  scale = 1,
  children,
}: ClickBurstProps) {
  const surfaceRef = useRef<HTMLCanvasElement>(null);
  const burstsRef = useRef<Burst[]>([]);
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  // Configuração mais recente: o laço lê daqui, então mudanças valem no quadro seguinte.
  const configRef = useRef({ color, length, reach, count, durationMs, easing, scale });
  configRef.current = { color, length, reach, count, durationMs, easing, scale };

  // Ajuste da resolução interna ao tamanho do contêiner (imediato + debounce de 100 ms).
  useEffect(() => {
    const canvas = surfaceRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;

    const fit = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(0, Math.round(rect.width));
      const h = Math.max(0, Math.round(rect.height));
      const dpr = window.devicePixelRatio || 1;
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      const ctx = canvas.getContext('2d');
      // Escala pelo DPR para manter 2 px CSS de espessura sem borrar.
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    fit();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(fit, 100);
    });
    observer.observe(host);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  // Cancela o laço no desmonte.
  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
      burstsRef.current = [];
    };
  }, []);

  const tick = (now: number) => {
    const canvas = surfaceRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      frameRef.current = null;
      return;
    }
    const cfg = configRef.current;
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);

    const n = Math.max(0, Math.floor(cfg.count));
    const alive: Burst[] = [];
    for (const burst of burstsRef.current) {
      const elapsed = now - burst.start;
      if (elapsed >= cfg.durationMs) continue;
      alive.push(burst);

      const e = applyEasing(cfg.easing, Math.max(0, elapsed / cfg.durationMs));
      const dist = e * cfg.reach * cfg.scale;
      const len = cfg.length * (1 - e);

      ctx.strokeStyle = cfg.color;
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = 'butt';
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        // Ângulo 0 = direita; positivo gira no sentido horário (Y para baixo).
        const angle = (2 * Math.PI * i) / n;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        ctx.moveTo(burst.x + cos * dist, burst.y + sin * dist);
        ctx.lineTo(burst.x + cos * (dist + len), burst.y + sin * (dist + len));
      }
      ctx.stroke();
    }
    burstsRef.current = alive;

    // Pausa o laço quando não há faíscas vivas.
    frameRef.current = alive.length > 0 ? requestAnimationFrame(tick) : null;
  };

  const onSurfacePointer = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const canvas = surfaceRef.current;
    if (!canvas) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const rect = canvas.getBoundingClientRect();
    burstsRef.current.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      start: performance.now(),
    });
    if (frameRef.current === null) frameRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="relative w-full h-full" onClick={onSurfacePointer}>
      <canvas
        ref={surfaceRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />
      {children}
    </div>
  );
}

export default ClickBurst;
