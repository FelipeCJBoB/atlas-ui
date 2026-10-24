// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type GlowAnimation = 'instant' | 'ease' | 'spring';
export type PointerMode = 'attract' | 'repel';
export type InteractionType = 'bounce' | 'merge';

export interface GravityStarsProps extends HTMLAttributes<HTMLDivElement> {
  /** Quantidade de estrelas. */
  count?: number;
  /** Variação de tamanho: raio = 1 + aleatório × este valor (px). */
  sizeRange?: number;
  /** Opacidade base (0–1). */
  baseOpacity?: number;
  /** Escala do desfoque da sombra (brilho). */
  glowIntensity?: number;
  /** Transição do brilho: instantâneo, suave ou mola. */
  glowAnimation?: GlowAnimation;
  /** Velocidade de deriva inicial (px/quadro). */
  driftSpeed?: number;
  /** Raio de influência do ponteiro (px). */
  influenceRadius?: number;
  /** Sentido da força do ponteiro. */
  pointerMode?: PointerMode;
  /** Intensidade da gravidade do ponteiro (dividida por 1000). */
  gravityStrength?: number;
  /** Liga a interação entre estrelas (custo quadrático). */
  interaction?: boolean;
  /** Tipo de interação entre estrelas. */
  interactionType?: InteractionType;
}

interface Star {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
  mass: number;
  glow: number;
  glowV: number;
}

interface Params {
  baseOpacity: number;
  glowIntensity: number;
  glowAnimation: GlowAnimation;
  influenceRadius: number;
  pointerMode: PointerMode;
  gravityStrength: number;
  interaction: boolean;
  interactionType: InteractionType;
}

const cn = (...v: Parameters<typeof clsx>) => twMerge(clsx(...v));

function createStars(n: number, sizeRange: number, speed: number, opacity: number, w: number, h: number): Star[] {
  const out: Star[] = [];
  const total = Math.max(0, Math.floor(n));
  for (let i = 0; i < total; i++) {
    const angle = Math.random() * Math.PI * 2;
    const s = speed * (0.5 + Math.random() * 0.5);
    out.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: Math.cos(angle) * s,
      vy: Math.sin(angle) * s,
      r: 1 + Math.random() * sizeRange,
      opacity,
      mass: 0.5 + Math.random() * 0.5,
      glow: 1,
      glowV: 0,
    });
  }
  return out;
}

function animateGlow(s: Star, target: number, mode: GlowAnimation) {
  if (mode === 'instant') {
    s.glow = target;
    s.glowV = 0;
    return;
  }
  const rising = target > s.glow;
  if (mode === 'ease') {
    s.glow += (target - s.glow) * (rising ? 0.15 : 0.08);
    if (!rising && s.glow < 1) s.glow = 1;
    return;
  }
  // mola: velocidade própria com amortecimento (ultrapassa e assenta)
  if (rising) {
    s.glowV += 0.2 * (target - s.glow);
    s.glowV *= 0.85;
  } else {
    s.glowV += 0.15 * (target - s.glow);
    s.glowV *= 0.9;
  }
  s.glow += s.glowV;
  if (!rising && s.glow < 1) {
    s.glow = 1;
    s.glowV = 0;
  }
}

function interact(stars: Star[], type: InteractionType) {
  for (let i = 0; i < stars.length; i++) {
    const a = stars[i];
    for (let j = i + 1; j < stars.length; j++) {
      const b = stars[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const minDist = a.r + b.r + 5;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minDist * minDist) continue;
      const d = Math.sqrt(d2);
      if (type === 'bounce') {
        if (d === 0) continue;
        const nx = dx / d;
        const ny = dy / d;
        // velocidade relativa ao longo da normal (< 0 = aproximando)
        const vrel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (vrel >= 0) continue;
        const total = a.mass + b.mass;
        const ka = (2 * b.mass) / total;
        const kb = (2 * a.mass) / total;
        a.vx += ka * vrel * nx;
        a.vy += ka * vrel * ny;
        b.vx -= kb * vrel * nx;
        b.vy -= kb * vrel * ny;
        const half = (minDist - d) / 2;
        a.x -= nx * half;
        a.y -= ny * half;
        b.x += nx * half;
        b.y += ny * half;
      } else {
        const frac = (minDist - d) / minDist;
        a.glow += 0.5 * frac;
        b.glow += 0.5 * frac;
        const f = frac * 0.01;
        a.vx += dx * f;
        a.vy += dy * f;
        b.vx -= dx * f;
        b.vy -= dy * f;
      }
    }
  }
}

export function GravityStars({
  count = 75,
  sizeRange = 2,
  baseOpacity = 0.75,
  glowIntensity = 15,
  glowAnimation = 'ease',
  driftSpeed = 0.3,
  influenceRadius = 100,
  pointerMode = 'attract',
  gravityStrength = 75,
  interaction = false,
  interactionType = 'bounce',
  className,
  ...rest
}: GravityStarsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const paramsRef = useRef<Params>({
    baseOpacity,
    glowIntensity,
    glowAnimation,
    influenceRadius,
    pointerMode,
    gravityStrength,
    interaction,
    interactionType,
  });
  const prevOpacityRef = useRef(baseOpacity);
  const prevSpeedRef = useRef(driftSpeed);

  useEffect(() => {
    paramsRef.current = {
      baseOpacity,
      glowIntensity,
      glowAnimation,
      influenceRadius,
      pointerMode,
      gravityStrength,
      interaction,
      interactionType,
    };
  });

  // Laço, tamanho, ponteiro e pausas — vive enquanto o componente estiver montado.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(container); // objeto vivo: relido a cada quadro
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    let onScreen = true;
    let pageVisible = document.visibilityState !== 'hidden';
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduced = mq.matches;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
      const prev = sizeRef.current;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      if ((w !== prev.w || h !== prev.h) && starsRef.current.length) {
        // redistribui as estrelas na nova área; velocidades mantidas
        for (const s of starsRef.current) {
          s.x = Math.random() * w;
          s.y = Math.random() * h;
        }
      }
      sizeRef.current = { w, h, dpr };
      draw();
    };

    const draw = () => {
      const { w, h, dpr } = sizeRef.current;
      const p = paramsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const color = style.color || '#ffffff';
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      for (const s of starsRef.current) {
        ctx.globalAlpha = Math.max(0, Math.min(1, s.opacity));
        // shadowBlur não segue a transformação: escala pela densidade para manter px CSS
        ctx.shadowBlur = p.glowIntensity * s.glow * 2 * dpr;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    };

    const step = () => {
      const p = paramsRef.current;
      const stars = starsRef.current;
      const { w, h } = sizeRef.current;
      const ptr = reduced ? null : pointer;
      const floor = p.baseOpacity * 0.3;
      const sign = p.pointerMode === 'repel' ? -1 : 1;

      for (const s of stars) {
        let target = 1;
        let influenced = false;
        if (ptr) {
          const dx = ptr.x - s.x;
          const dy = ptr.y - s.y;
          const d = Math.hypot(dx, dy);
          if (d > 0 && d < p.influenceRadius) {
            const k = 1 - d / p.influenceRadius;
            const a = ((k * p.gravityStrength) / 1000) * sign;
            s.vx += (dx / d) * a;
            s.vy += (dy / d) * a;
            s.opacity = Math.min(1, p.baseOpacity + 0.4 * k);
            target = 1 + 2 * k;
            influenced = true;
          }
        }
        if (!influenced) s.opacity = Math.max(floor, s.opacity - 0.02);
        animateGlow(s, target, p.glowAnimation);
      }

      // movimento reduzido: sem deriva, sem colisões; só o esmaecimento até o repouso
      if (reduced) return;

      if (p.interaction) interact(stars, p.interactionType);

      for (const s of stars) {
        s.x += s.vx;
        s.y += s.vy;
        s.vx = (s.vx + (Math.random() - 0.5) * 0.001) * 0.999;
        s.vy = (s.vy + (Math.random() - 0.5) * 0.001) * 0.999;
        if (w > 0) {
          if (s.x < 0) s.x += w;
          else if (s.x > w) s.x -= w;
        }
        if (h > 0) {
          if (s.y < 0) s.y += h;
          else if (s.y > h) s.y -= h;
        }
      }
    };

    const tick = () => {
      raf = 0;
      step();
      draw();
      start();
    };
    const start = () => {
      if (!raf && onScreen && pageVisible) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // ponteiro em coordenadas locais; sair da área desliga a influência
    const setLocal = (cx: number, cy: number) => {
      const rect = container.getBoundingClientRect();
      pointer = { x: cx - rect.left, y: cy - rect.top };
    };
    const onMouseMove = (e: MouseEvent) => setLocal(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) setLocal(t.clientX, t.clientY);
    };
    const clearPointer = () => {
      pointer = null;
    };
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseleave', clearPointer);
    container.addEventListener('touchstart', onTouch, { passive: true });
    container.addEventListener('touchmove', onTouch, { passive: true });
    container.addEventListener('touchend', clearPointer);
    container.addEventListener('touchcancel', clearPointer);

    const onMotionPref = () => {
      reduced = mq.matches;
    };
    mq.addEventListener('change', onMotionPref);

    const onVisibility = () => {
      pageVisible = document.visibilityState !== 'hidden';
      if (pageVisible) start();
      else stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver((entries) => {
            onScreen = entries.some((e) => e.isIntersecting);
            if (onScreen) start();
            else stop();
          })
        : null;
    io?.observe(container);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(container);
    window.addEventListener('resize', resize);

    resize();
    if (!starsRef.current.length) {
      const { w, h } = sizeRef.current;
      starsRef.current = createStars(count, sizeRange, driftSpeed, baseOpacity, w, h);
    }
    start();

    return () => {
      stop();
      ro?.disconnect();
      io?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      mq.removeEventListener('change', onMotionPref);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseleave', clearPointer);
      container.removeEventListener('touchstart', onTouch);
      container.removeEventListener('touchmove', onTouch);
      container.removeEventListener('touchend', clearPointer);
      container.removeEventListener('touchcancel', clearPointer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mudar quantidade ou variação de tamanho recria o conjunto (correção da referência).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return; // a criação inicial acontece no efeito principal, já com tamanho conhecido
    }
    const { w, h } = sizeRef.current;
    starsRef.current = createStars(count, sizeRange, driftSpeed, baseOpacity, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, sizeRange]);

  // Mudar a opacidade base reinicia a opacidade de todas as estrelas.
  useEffect(() => {
    if (prevOpacityRef.current === baseOpacity) return;
    prevOpacityRef.current = baseOpacity;
    for (const s of starsRef.current) s.opacity = baseOpacity;
  }, [baseOpacity]);

  // Mudar a velocidade reescala cada estrela para exatamente esse valor, mantendo a direção.
  useEffect(() => {
    if (prevSpeedRef.current === driftSpeed) return;
    prevSpeedRef.current = driftSpeed;
    for (const s of starsRef.current) {
      const v = Math.hypot(s.vx, s.vy);
      if (v > 0) {
        s.vx = (s.vx / v) * driftSpeed;
        s.vy = (s.vy / v) * driftSpeed;
      } else {
        const a = Math.random() * Math.PI * 2;
        s.vx = Math.cos(a) * driftSpeed;
        s.vy = Math.sin(a) * driftSpeed;
      }
    }
  }, [driftSpeed]);

  return (
    <div ref={containerRef} className={cn('relative h-full w-full overflow-hidden', className)} {...rest}>
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}

export default GravityStars;
