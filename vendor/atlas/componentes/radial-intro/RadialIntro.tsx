// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type AnimationPlaybackControls,
} from 'motion/react';

export interface RadialIntroItem {
  id: string | number;
  /** Texto alternativo e origem das iniciais do avatar procedural. */
  name: string;
  /** Imagem opcional; sem ela, usa-se um avatar de gradiente com iniciais. */
  src?: string;
}

export interface RadialIntroProps {
  items: RadialIntroItem[];
  stageSize?: number;
  avatarSize?: number;
  /** Duração (s) de uma volta completa da órbita. */
  orbitDuration?: number;
  direction?: 'clockwise' | 'counterclockwise';
  /** Instantes (ms) da subida, do leque e do início da órbita. */
  delays?: { rise?: number; fan?: number; orbit?: number };
  /** Nome acessível do grupo. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const MOLA = { type: 'spring', stiffness: 300, damping: 35, mass: 1, restDelta: 0.01, restSpeed: 0.01 } as const;

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  return partes
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function AvatarProcedural({ nome, indice, total }: { nome: string; indice: number; total: number }) {
  const gid = useId().replace(/:/g, '');
  const h = (200 + indice * (360 / Math.max(total, 1))) % 360;
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" role="img" aria-label={nome} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${h} 78% 62%)`} />
          <stop offset="1" stopColor={`hsl(${(h + 38) % 360} 70% 40%)`} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={`url(#g${gid})`} />
      <text
        x="50"
        y="50"
        dy="0.35em"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="40"
        fontWeight={600}
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
      >
        {iniciais(nome)}
      </text>
    </svg>
  );
}

interface BracoProps {
  item: RadialIntroItem;
  indice: number;
  total: number;
  fase: number;
  ativo: boolean;
  reduzir: boolean;
  stageSize: number;
  avatarSize: number;
  orbitDuration: number;
  sentido: 1 | -1;
}

function Braco({ item, indice, total, fase, ativo, reduzir, stageSize, avatarSize, orbitDuration, sentido }: BracoProps) {
  const alvo = indice * (360 / total);
  const yInicial = stageSize / 2; // topo do avatar no centro do palco

  const rot = useMotionValue(reduzir ? alvo : 0);
  const contra = useTransform(rot, (r) => -r);
  const yPx = useMotionValue(reduzir ? 0 : yInicial);
  // Deslocamento em % da própria altura do avatar: escala junto com o palco.
  const y = useTransform(yPx, (v) => `${(v / avatarSize) * 100}%`);
  const opacidade = useMotionValue(reduzir || indice === 0 ? 1 : 0);

  const orbitaRef = useRef<AnimationPlaybackControls | null>(null);
  const ativoRef = useRef(ativo);
  ativoRef.current = ativo;

  useEffect(() => {
    if (reduzir) {
      rot.set(alvo);
      yPx.set(0);
      opacidade.set(1);
      return;
    }
    const ctrls: AnimationPlaybackControls[] = [];
    if (fase === 1) {
      ctrls.push(animate(yPx, 0, MOLA));
    } else if (fase === 2) {
      ctrls.push(animate(yPx, 0, MOLA), animate(rot, alvo, MOLA), animate(opacidade, 1, MOLA));
    } else if (fase === 3) {
      yPx.set(0);
      opacidade.set(1);
      const orbita = animate(rot, [alvo, alvo + 360 * sentido], {
        duration: orbitDuration,
        ease: 'linear',
        repeat: Infinity,
      });
      if (!ativoRef.current) orbita.pause();
      orbitaRef.current = orbita;
      ctrls.push(orbita);
    }
    return () => {
      ctrls.forEach((c) => c.stop());
      orbitaRef.current = null;
    };
  }, [fase, reduzir, alvo, sentido, orbitDuration, rot, yPx, opacidade]);

  // Pausa a órbita fora da tela ou com a aba oculta.
  useEffect(() => {
    const o = orbitaRef.current;
    if (!o) return;
    if (ativo) o.play();
    else o.pause();
  }, [ativo]);

  const pctAvatar = (avatarSize / stageSize) * 100;

  return (
    <motion.div
      className="absolute inset-0"
      style={{ rotate: rot, zIndex: total - indice, willChange: 'transform', pointerEvents: 'none' }}
    >
      <motion.div
        className="absolute overflow-hidden rounded-full"
        style={{
          top: 0,
          left: `${50 - pctAvatar / 2}%`,
          width: `${pctAvatar}%`,
          aspectRatio: '1 / 1',
          y,
          rotate: contra,
          opacity: opacidade,
        }}
      >
        {item.src ? (
          <img
            src={item.src}
            alt={item.name}
            draggable={false}
            className="block h-full w-full select-none"
            style={{ objectFit: 'fill' }}
          />
        ) : (
          <AvatarProcedural nome={item.name} indice={indice} total={total} />
        )}
      </motion.div>
    </motion.div>
  );
}

export function RadialIntro({
  items,
  stageSize = 320,
  avatarSize = 60,
  orbitDuration = 30,
  direction = 'clockwise',
  delays,
  label = 'Comunidade',
  className,
  style,
}: RadialIntroProps) {
  const reduzir = !!useReducedMotion();
  const total = items.length;
  const tSubida = delays?.rise ?? 250;
  const tLeque = delays?.fan ?? 700;
  const tOrbita = delays?.orbit ?? 1300;

  // A fase pertence a uma "rodada" (quantidade de itens); mudar a quantidade reinicia.
  const [seq, setSeq] = useState({ n: total, fase: 0 });
  const fase = reduzir ? 2 : seq.n === total ? seq.fase : 0;

  useEffect(() => {
    if (reduzir) return;
    setSeq({ n: total, fase: 0 });
    const ts = [
      setTimeout(() => setSeq({ n: total, fase: 1 }), tSubida),
      setTimeout(() => setSeq({ n: total, fase: 2 }), tLeque),
      setTimeout(() => setSeq({ n: total, fase: 3 }), tOrbita),
    ];
    return () => ts.forEach(clearTimeout);
  }, [total, reduzir, tSubida, tLeque, tOrbita]);

  const palcoRef = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(true);
  const [abaVisivel, setAbaVisivel] = useState(true);
  useEffect(() => {
    const el = palcoRef.current;
    let io: IntersectionObserver | undefined;
    if (el && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting));
      io.observe(el);
    }
    const onVis = () => setAbaVisivel(document.visibilityState !== 'hidden');
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return (
    <div
      ref={palcoRef}
      role="group"
      aria-label={label}
      className={['relative', className].filter(Boolean).join(' ')}
      style={{ width: stageSize, maxWidth: '100%', aspectRatio: '1 / 1', overflow: 'visible', ...style }}
    >
      {items.map((item, i) => (
        <Braco
          key={`${total}-${item.id}`}
          item={item}
          indice={i}
          total={total}
          fase={fase}
          ativo={visivel && abaVisivel}
          reduzir={reduzir}
          stageSize={stageSize}
          avatarSize={avatarSize}
          orbitDuration={orbitDuration}
          sentido={direction === 'clockwise' ? 1 : -1}
        />
      ))}
    </div>
  );
}

export default RadialIntro;
