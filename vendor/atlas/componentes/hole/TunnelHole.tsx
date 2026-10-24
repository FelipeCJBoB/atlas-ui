// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

export interface TunnelHoleProps {
  /** Cor dos traços (elipses e guias). */
  strokeColor?: string;
  /** Quantidade de guias radiais. */
  guideCount?: number;
  /** Quantidade de elipses do túnel (desenha-se 1 a cada 5). */
  ellipseCount?: number;
  /** Cor das partículas (RGB). */
  particleColor?: [number, number, number];
  particleCount?: number;
  /** Incremento do parâmetro p de cada elipse por quadro (60 qps). */
  flowSpeed?: number;
  /** Tema; `auto` lê a classe dark/light do ancestral (fallback prefers-color-scheme). */
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Elipse { cx: number; cy: number; rx: number; ry: number }
interface Particula { x0: number; x1: number; y: number; v: number; s: number; a: number }

const QUADRO_MS = 1000 / 60;
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const expoEntrada = (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * (t - 1)));

function useTema(ref: RefObject<HTMLElement | null>, forcado: 'auto' | 'light' | 'dark'): 'dark' | 'light' {
  const [tema, setTema] = useState<'dark' | 'light'>(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  );
  useEffect(() => {
    const el = ref.current;
    if (!el || forcado !== 'auto') return;
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
  }, [ref, forcado]);
  return forcado === 'auto' ? tema : forcado;
}

function usaMovimentoReduzido() {
  const [r, setR] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(mq.matches);
    mq.addEventListener('change', f);
    return () => mq.removeEventListener('change', f);
  }, []);
  return r;
}

export function TunnelHole({
  strokeColor = '#737373',
  guideCount = 50,
  ellipseCount = 50,
  particleColor = [255, 255, 255],
  particleCount = 100,
  flowSpeed = 0.001,
  theme = 'auto',
  className,
  style,
  children,
}: TunnelHoleProps) {
  const contRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feixeRef = useRef<HTMLDivElement>(null);
  const tema = useTema(contRef, theme);
  const reduzido = usaMovimentoReduzido();
  const escuro = tema === 'dark';

  const [r, g, b] = particleColor;
  const cfg = useRef({ strokeColor, particleColor: `${r},${g},${b}`, flowSpeed });
  cfg.current = { strokeColor, particleColor: `${r},${g},${b}`, flowSpeed };

  // Túnel em canvas 2D.
  useEffect(() => {
    const cont = contRef.current;
    const canvas = canvasRef.current;
    if (!cont || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const guias = document.createElement('canvas');
    const gctx = guias.getContext('2d');
    if (!gctx) return;

    const N = Math.max(1, Math.floor(ellipseCount));
    const G = Math.max(0, Math.floor(guideCount));
    const P = Math.max(0, Math.floor(particleCount));

    let W = 300, H = 150, dpr = 1;
    let abertura: Elipse = { cx: 0, cy: 0, rx: 0, ry: 0 };
    let fuga: Elipse = { cx: 0, cy: 0, rx: 0, ry: 0 };
    let borda: Elipse = abertura;
    let mascara = new Path2D();
    const ps = Array.from({ length: N }, (_, i) => i / N);
    let particulas: Particula[] = [];
    let baseY = 0;

    const elipse = (p: number): Elipse => ({
      cx: lerp(abertura.cx, fuga.cx, p),
      cy: lerp(abertura.cy, fuga.cy, expoEntrada(p)),
      rx: lerp(abertura.rx, fuga.rx, p),
      ry: lerp(abertura.ry, fuga.ry, p),
    });

    const novaParticula = (yAleatorio: boolean): Particula => ({
      x0: W / 2 + (Math.random() - 0.5) * 0.5 * borda.rx,
      x1: W / 2 + (Math.random() - 0.5) * 2 * borda.rx,
      y: yAleatorio ? Math.random() * baseY : baseY,
      v: 0.5 + Math.random(),
      s: 0.5 + Math.random() * 4,
      a: Math.random(),
    });

    const preparar = () => {
      const rc = cont.getBoundingClientRect();
      W = Math.max(1, rc.width || cont.clientWidth || 300);
      H = Math.max(1, rc.height || cont.clientHeight || 150);
      dpr = Math.min(window.devicePixelRatio || 1, 3);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      guias.width = canvas.width;
      guias.height = canvas.height;

      abertura = { cx: 0.5 * W, cy: 0.45 * H, rx: 0.75 * W, ry: 0.7 * H };
      fuga = { cx: 0.5 * W, cy: 0.95 * H, rx: 0, ry: 0 };

      // Posições iniciais (estáticas) — base das guias e da borda.
      const iniciais = Array.from({ length: N }, (_, i) => elipse(i / N));
      iniciais.push(fuga);
      // Borda: última elipse cuja base (cy + ry) ainda sobe em relação à anterior.
      let iBorda = 0;
      for (let i = 1; i < iniciais.length; i++) {
        const e = iniciais[i], a = iniciais[i - 1];
        if (e.cy + e.ry < a.cy + a.ry) iBorda = i;
        else break;
      }
      borda = iniciais[iBorda];
      mascara = new Path2D();
      mascara.ellipse(borda.cx, borda.cy, borda.rx, borda.ry, 0, 0, TAU);
      mascara.rect(borda.cx - borda.rx, 0, borda.rx * 2, borda.cy);

      // Guias pré-renderizadas na resolução física; recorte aplicado uma única vez, a partir da borda.
      gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gctx.clearRect(0, 0, W, H);
      gctx.strokeStyle = cfg.current.strokeColor;
      gctx.lineWidth = 2;
      gctx.lineJoin = 'round';
      const ponto = (e: Elipse, ang: number) => [e.cx + Math.cos(ang) * e.rx, e.cy + Math.sin(ang) * e.ry] as const;
      gctx.beginPath();
      for (let j = 0; j < G; j++) {
        const ang = (j / G) * TAU;
        for (let i = 0; i <= iBorda; i++) {
          const [x, y] = ponto(iniciais[i], ang);
          if (i === 0) gctx.moveTo(x, y); else gctx.lineTo(x, y);
        }
      }
      gctx.stroke();
      gctx.save();
      gctx.clip(mascara);
      gctx.beginPath();
      for (let j = 0; j < G; j++) {
        const ang = (j / G) * TAU;
        for (let i = iBorda; i < iniciais.length; i++) {
          const [x, y] = ponto(iniciais[i], ang);
          if (i === iBorda) gctx.moveTo(x, y); else gctx.lineTo(x, y);
        }
      }
      gctx.stroke();
      gctx.restore();

      baseY = 0.85 * H;
      particulas = Array.from({ length: P }, () => novaParticula(true));
    };

    const desenhar = () => {
      const c = cfg.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(guias, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = c.strokeColor;
      ctx.lineWidth = 2;

      const fora = new Path2D();
      const dentro = new Path2D();
      fora.ellipse(abertura.cx, abertura.cy, abertura.rx, abertura.ry, 0, 0, TAU);
      for (let i = 0; i < N; i += 5) {
        const e = elipse(ps[i]);
        const alvo = e.rx < borda.rx - 5 ? dentro : fora;
        alvo.moveTo(e.cx + e.rx, e.cy);
        alvo.ellipse(e.cx, e.cy, Math.max(0, e.rx), Math.max(0, e.ry), 0, 0, TAU);
      }
      ctx.stroke(fora);

      ctx.save();
      ctx.clip(mascara);
      ctx.stroke(dentro);
      for (const p of particulas) {
        const t = baseY > 0 ? (baseY - p.y) / baseY : 0;
        const x = lerp(p.x0, p.x1, t);
        ctx.fillStyle = `rgba(${c.particleColor},${p.a})`;
        ctx.fillRect(x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      ctx.restore();
    };

    const atualizar = (k: number) => {
      const passo = cfg.current.flowSpeed * k;
      for (let i = 0; i < N; i++) {
        ps[i] += passo;
        if (ps[i] >= 1) ps[i] -= Math.floor(ps[i]);
      }
      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];
        p.y -= p.v * k;
        if (p.y < 0) particulas[i] = novaParticula(false);
      }
    };

    preparar();
    desenhar();

    let raf = 0;
    let ultimo = 0;
    let visivel = true;
    const quadro = (t: number) => {
      raf = 0;
      const k = (ultimo ? Math.min(t - ultimo, 100) : QUADRO_MS) / QUADRO_MS;
      ultimo = t;
      atualizar(k);
      desenhar();
      agendar();
    };
    const agendar = () => {
      if (!reduzido && !raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro);
    };
    const parar = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ultimo = 0;
    };

    const ro = new ResizeObserver(() => {
      preparar();
      desenhar();
    });
    ro.observe(cont);
    const io = new IntersectionObserver((ents) => {
      visivel = ents.some((e) => e.isIntersecting);
      if (visivel) agendar(); else parar();
    });
    io.observe(cont);
    const aoVisib = () => (document.hidden ? parar() : agendar());
    document.addEventListener('visibilitychange', aoVisib);

    agendar();
    return () => {
      parar();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', aoVisib);
    };
    // strokeColor entra na pré-renderização das guias; as demais cores são lidas por quadro.
  }, [ellipseCount, guideCount, particleCount, reduzido, strokeColor]);

  // Deslizamento das cores do feixe (100% → 300% em 5 s, linear, infinito).
  useEffect(() => {
    const el = feixeRef.current;
    if (!el || reduzido || typeof el.animate !== 'function') return;
    const anim = el.animate(
      [{ backgroundPosition: '0% 100%' }, { backgroundPosition: '0% 300%' }],
      { duration: 5000, iterations: Infinity, easing: 'linear' },
    );
    return () => anim.cancel();
  }, [reduzido]);

  const t1 = escuro ? '20' : '40'; // 12,5% / 25%
  const t2 = escuro ? '60' : '80'; // 37,5% / 50%
  const gradFeixe = `linear-gradient(20deg, #00f8f1 0%, #ffbd1e${t1} 16.5%, #fe848f 33%, #fe848f${t1} 49.5%, #00f8f1 66%, #00f8f1${t2} 85.5%, #ffbd1e 100%)`;
  const misturaFeixe = escuro
    ? 'plus-lighter'
    : typeof CSS !== 'undefined' && CSS.supports?.('mix-blend-mode', 'plus-darker')
      ? 'plus-darker'
      : 'multiply';
  const corVinheta = escuro ? '#000000' : '#ffffff';
  const camada: CSSProperties = { position: 'absolute', pointerEvents: 'none' };

  return (
    <div
      ref={contRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {/* 1. Vinheta: centro aberto, bordas na cor do tema. */}
      <div
        aria-hidden="true"
        style={{
          ...camada,
          left: '-20%', top: '-20%', width: '140%', height: '140%',
          background: `radial-gradient(ellipse at 50% 55%, transparent 10%, ${corVinheta} 50%)`,
        }}
      />
      {/* 3. Túnel. */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ ...camada, inset: 0, width: '100%', height: '100%', display: 'block', opacity: escuro ? 0.2 : 0.1 }}
      />
      {/* 4. Feixe de luz desfocado. */}
      <div
        ref={feixeRef}
        aria-hidden="true"
        style={{
          ...camada,
          left: '35%', top: '-71.5%', width: '30%', height: '140%',
          borderRadius: '0 0 9999px 9999px',
          filter: 'blur(64px)',
          opacity: 0.75,
          mixBlendMode: misturaFeixe as CSSProperties['mixBlendMode'],
          backgroundImage: gradFeixe,
          backgroundSize: '100% 200%',
          backgroundPosition: '0% 100%',
        }}
      />
      {/* 5. Brilho violeta. */}
      <div
        aria-hidden="true"
        style={{
          ...camada,
          inset: 0,
          background: 'radial-gradient(ellipse at 50% 75%, #a900ff 20%, transparent 75%)',
          mixBlendMode: 'overlay',
        }}
      />
      {/* 7. Varreduras CRT (só no escuro). */}
      {escuro && (
        <div
          aria-hidden="true"
          style={{
            ...camada,
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, #ffffff 1px, #ffffff 2px)',
            mixBlendMode: 'overlay',
            opacity: 0.5,
          }}
        />
      )}
      {/* Conteúdo elevado acima das camadas decorativas para continuar legível. */}
      {children != null && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>{children}</div>
      )}
    </div>
  );
}

export default TunnelHole;
