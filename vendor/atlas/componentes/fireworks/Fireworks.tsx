// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from 'react';

/** Número fixo ou faixa sorteada {min, max}. */
export type Faixa = number | { min: number; max: number };

export interface FireworksProps {
  /** Densidade de lançamentos (divide o intervalo de 300–800 ms). */
  density?: number;
  /** Cor única, lista (sorteio por foguete) ou nada (matiz aleatório). */
  color?: string | string[];
  /** Cor dependente do tema do ancestral (usada só quando `color` não é passado). */
  themeColor?: { dark: string; light: string };
  rocketSpeed?: Faixa;
  rocketSize?: Faixa;
  particleSpeed?: Faixa;
  particleSize?: Faixa;
  launchOnClick?: boolean;
  /** Ângulos uniformes com pequeno ruído (anel mais limpo); falso = ângulos totalmente aleatórios. */
  evenRing?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Ponto { x: number; y: number }
interface Foguete {
  x: number; y: number; vx: number; vy: number;
  alvoY: number; tam: number; cor: string;
  rastro: Ponto[]; maxRastro: number;
}
interface Particula {
  x: number; y: number; vx: number; vy: number;
  r: number; cor: string; alfa: number; taxa: number;
}

const QUADRO_MS = 1000 / 60;
const entre = (a: number, b: number) => a + Math.random() * (b - a);
const sortear = (f: Faixa) => (typeof f === 'number' ? f : entre(f.min, f.max));

/** Tema do ancestral mais próximo com classe `dark`/`light`, com fallback para prefers-color-scheme. */
export function useTemaAncestral(ref: RefObject<HTMLElement | null>): 'dark' | 'light' {
  const [tema, setTema] = useState<'dark' | 'light'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const ler = () => {
      const anc = el.closest('.dark, .light');
      setTema(anc ? (anc.classList.contains('dark') ? 'dark' : 'light') : mq.matches ? 'dark' : 'light');
    };
    ler();
    mq.addEventListener('change', ler);
    const mo = new MutationObserver(ler);
    for (let n: HTMLElement | null = el; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    return () => {
      mq.removeEventListener('change', ler);
      mo.disconnect();
    };
  }, [ref]);
  return tema;
}

export function Fireworks({
  density = 1,
  color,
  themeColor,
  rocketSpeed = { min: 4, max: 8 },
  rocketSize = { min: 2, max: 5 },
  particleSpeed = { min: 2, max: 7 },
  particleSize = { min: 1, max: 5 },
  launchOnClick = true,
  evenRing = false,
  className,
  style,
  children,
}: FireworksProps) {
  const contRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tema = useTemaAncestral(contRef);
  const corEfetiva = color ?? (themeColor ? themeColor[tema] : undefined);

  // Configuração lida pelo laço a cada quadro: mudar props não reinicia o efeito (comparação por valor implícita).
  const cfg = useRef({ density, cor: corEfetiva, rocketSpeed, rocketSize, particleSpeed, particleSize, evenRing, launchOnClick });
  cfg.current = { density, cor: corEfetiva, rocketSpeed, rocketSize, particleSpeed, particleSize, evenRing, launchOnClick };

  const lancarRef = useRef<(x: number, alvoY: number) => void>(() => {});
  const acordarRef = useRef<() => void>(() => {});

  useEffect(() => {
    const cont = contRef.current;
    const canvas = canvasRef.current;
    if (!cont || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 300;
    let h = 150;
    const ajustar = () => {
      const r = cont.getBoundingClientRect();
      w = Math.max(1, r.width || cont.clientWidth || 300);
      h = Math.max(1, r.height || cont.clientHeight || 150);
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(cont);

    const mqReduz = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduzido = mqReduz.matches;
    const aoMudarReduz = () => { reduzido = mqReduz.matches; iniciar(); };
    mqReduz.addEventListener('change', aoMudarReduz);

    const foguetes: Foguete[] = [];
    const particulas: Particula[] = [];

    const sortearCor = () => {
      const c = cfg.current.cor;
      if (Array.isArray(c) && c.length) return c[Math.floor(Math.random() * c.length)];
      if (typeof c === 'string') return c;
      return `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`;
    };

    const lancar = (x: number, alvoY: number) => {
      const c = cfg.current;
      const ang = -Math.PI / 2 + entre(-0.3, 0.3);
      const v = sortear(c.rocketSpeed);
      foguetes.push({
        x, y: h,
        vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
        alvoY, tam: sortear(c.rocketSize), cor: sortearCor(),
        rastro: [], maxRastro: 10 + Math.floor(Math.random() * 15),
      });
      iniciar();
    };
    lancarRef.current = lancar;

    const explodir = (f: Foguete) => {
      const c = cfg.current;
      const n = 50 + Math.floor(Math.random() * 100);
      const passo = (Math.PI * 2) / n;
      for (let i = 0; i < n; i++) {
        const ang = c.evenRing ? (i + Math.random() - 0.5) * passo : Math.random() * Math.PI * 2;
        const v = sortear(c.particleSpeed);
        particulas.push({
          x: f.x, y: f.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          r: Math.max(0.1, sortear(c.particleSize)), cor: f.cor, alfa: 1, taxa: entre(0.005, 0.02),
        });
      }
    };

    let raf = 0;
    let ultimo = 0;
    let espera = 0; // ms até o próximo lançamento automático (0 = imediato)
    let visivel = true;

    const autoAtivo = () => !reduzido && cfg.current.density > 0;

    const quadro = (t: number) => {
      raf = 0;
      const dtMs = ultimo ? Math.min(t - ultimo, 100) : QUADRO_MS;
      ultimo = t;
      const k = dtMs / QUADRO_MS;

      if (autoAtivo()) {
        espera -= dtMs;
        let guarda = 4;
        while (espera <= 0 && guarda-- > 0) {
          lancar(entre(0.1, 0.9) * w, entre(0.1, 0.4) * h);
          espera += entre(300, 800) / cfg.current.density;
        }
        if (espera <= 0) espera = entre(300, 800) / cfg.current.density;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = foguetes.length - 1; i >= 0; i--) {
        const f = foguetes[i];
        f.rastro.push({ x: f.x, y: f.y });
        if (f.rastro.length > f.maxRastro) f.rastro.shift();
        f.x += f.vx * k;
        f.y += f.vy * k;
        f.vy += 0.02 * k;
        if (f.vy >= 0 || f.y <= f.alvoY) {
          explodir(f);
          foguetes.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 1;
        if (f.rastro.length) {
          ctx.strokeStyle = f.cor;
          ctx.lineWidth = f.tam;
          ctx.beginPath();
          ctx.moveTo(f.rastro[0].x, f.rastro[0].y);
          for (let j = 1; j < f.rastro.length; j++) ctx.lineTo(f.rastro[j].x, f.rastro[j].y);
          ctx.lineTo(f.x, f.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = f.cor;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.tam / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const atrito = Math.pow(0.98, k);
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.vx *= atrito;
        p.vy *= atrito;
        p.vy += 0.05 * k;
        p.x += p.vx * k;
        p.y += p.vy * k;
        p.alfa -= p.taxa * k;
        if (p.alfa <= 0) {
          particulas.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.alfa;
        ctx.fillStyle = p.cor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Sem nada na tela e sem lançamento automático: dorme até um clique.
      if (!autoAtivo() && !foguetes.length && !particulas.length) return;
      agendar();
    };

    const agendar = () => {
      if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro);
    };
    function iniciar() {
      if (raf) return;
      ultimo = 0;
      agendar();
    }

    const io = new IntersectionObserver((ents) => {
      visivel = ents.some((e) => e.isIntersecting);
      if (visivel) iniciar();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    });
    io.observe(cont);
    const aoVisib = () => {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = 0; } }
      else iniciar();
    };
    document.addEventListener('visibilitychange', aoVisib);

    acordarRef.current = iniciar;
    iniciar();

    return () => {
      acordarRef.current = () => {};
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', aoVisib);
      mqReduz.removeEventListener('change', aoMudarReduz);
      lancarRef.current = () => {};
      foguetes.length = 0;
      particulas.length = 0;
    };
  }, []);

  // Se a densidade passar de 0 para positiva, o laço (que pode estar dormindo) precisa acordar.
  useEffect(() => {
    if (density > 0) acordarRef.current();
  }, [density]);

  const aoClicar = (e: MouseEvent<HTMLDivElement>) => {
    if (!cfg.current.launchOnClick || !contRef.current) return;
    const r = contRef.current.getBoundingClientRect();
    lancarRef.current(e.clientX - r.left, e.clientY - r.top);
  };

  return (
    <div
      ref={contRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
      onClick={aoClicar}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', pointerEvents: 'none' }}
      />
      {children != null && <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>{children}</div>}
    </div>
  );
}

export default Fireworks;
