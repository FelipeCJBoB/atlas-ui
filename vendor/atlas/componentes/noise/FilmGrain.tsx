// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef } from 'react';

export interface FilmGrainProps {
  /** Lado do ladrilho de ruído em px CSS (antes das escalas). */
  patternSize?: number;
  /** Escala horizontal do grão (1 = grão de 1 px CSS). */
  patternScaleX?: number;
  /** Escala vertical do grão. */
  patternScaleY?: number;
  /** Troca de quadro de ruído a cada N quadros. */
  patternRefreshInterval?: number;
  /** Opacidade do grão (0–255). */
  patternAlpha?: number;
  className?: string;
}

// Quantidade de quadros de ruído pré-gerados (alternados com deslocamento aleatório).
const FRAMES = 6;

function makeTile(size: number, alpha: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const img = ctx.createImageData(size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 256) | 0;
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = alpha;
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Sobreposição de granulação de filme. Ocupa 100% × 100% do ancestral posicionado
 * e não captura o ponteiro.
 */
export function FilmGrain({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
  className = '',
}: FilmGrainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Trocar qualquer parâmetro reinicia o laço.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tileSize = Math.max(8, Math.round(patternSize));
    const sx = Math.max(0.05, patternScaleX);
    const sy = Math.max(0.05, patternScaleY);
    const alpha = Math.max(0, Math.min(255, Math.round(patternAlpha)));
    const tiles = Array.from({ length: FRAMES }, () => makeTile(tileSize, alpha));
    const patterns = tiles.map((t) => ctx.createPattern(t, 'repeat'));

    // Resolução = tamanho CSS do contêiner (1 pixel do ladrilho = 1 px CSS × escala).
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth || canvas.parentElement?.clientWidth || 300));
      const h = Math.max(1, Math.round(canvas.clientHeight || canvas.parentElement?.clientHeight || 300));
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      draw();
    };

    let idx = 0;
    const draw = () => {
      const p = patterns[idx % FRAMES];
      if (!p) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;
      // Deslocamento aleatório evita que a repetição dos quadros fique perceptível.
      const ox = Math.floor(Math.random() * tileSize) * sx;
      const oy = Math.floor(Math.random() * tileSize) * sy;
      p.setTransform(new DOMMatrix([sx, 0, 0, sy, ox, oy]));
      ctx.fillStyle = p;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener('resize', resize);
    resize();

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    let raf = 0;
    let frame = 0;
    let visible = true;
    const every = Math.max(1, Math.round(patternRefreshInterval));
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (++frame % every === 0) {
        idx++;
        draw();
      }
    };
    if (!reduced) raf = requestAnimationFrame(loop);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting;
          })
        : null;
    io?.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        imageRendering: 'pixelated',
      }}
    />
  );
}

export default FilmGrain;
