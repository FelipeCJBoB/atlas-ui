// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';

export type RadialNavIcon = ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;

export interface RadialNavItem {
  id: number;
  icon: RadialNavIcon;
  label: string;
  /** Graus: 0 = topo (12 h), positivo no sentido horário. */
  angle: number;
}

export interface RadialNavButtonOptions {
  iconSize?: number;
  collapsedSize?: number;
  padding?: number;
}

export interface RadialNavProps {
  items: RadialNavItem[];
  size?: number;
  button?: RadialNavButtonOptions;
  defaultActiveId?: number;
  onActiveChange?: (id: number) => void;
  /** Nome acessível da navegação. */
  label?: string;
  theme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
}

const LARGURA_ATIVA = 140;
const MOLA_EXPANDE: Transition = { type: 'spring', stiffness: 200, damping: 35, delay: 0.05 };
const MOLA_RECOLHE: Transition = { type: 'spring', stiffness: 200, damping: 25 };
const MOLA_ROTULO: Transition = { type: 'spring', stiffness: 200, damping: 25 };
const MOLA_PONTEIRO: Transition = { type: 'spring', stiffness: 220, damping: 26 };

function useTemaEscuro(ref: RefObject<HTMLElement | null>, forcado?: 'light' | 'dark') {
  const [escuro, setEscuro] = useState(forcado === 'dark');
  useLayoutEffect(() => {
    if (forcado) {
      setEscuro(forcado === 'dark');
      return;
    }
    const el = ref.current;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const avaliar = () => {
      const anc = el?.closest('.dark, .light');
      setEscuro(anc ? anc.classList.contains('dark') : mq.matches);
    };
    avaliar();
    mq.addEventListener('change', avaliar);
    const obs = new MutationObserver(avaliar);
    for (let n = el?.parentElement; n; n = n.parentElement) {
      obs.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    return () => {
      mq.removeEventListener('change', avaliar);
      obs.disconnect();
    };
  }, [ref, forcado]);
  return escuro;
}

// Seta de cursor simétrica: aponta 45° à esquerda do "para cima".
function Ponteiro({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      fillOpacity={0.15}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M4 4 20 10.4 13.4 13.4 10.4 20z" />
    </svg>
  );
}

// Ângulo equivalente ao alvo que fica mais perto do anterior (rotação mais curta).
function maisProximo(anterior: number, alvo: number) {
  const norm = ((alvo % 360) + 360) % 360;
  return norm + 360 * Math.round((anterior - norm) / 360);
}

export function RadialNav({
  items,
  size = 180,
  button,
  defaultActiveId,
  onActiveChange,
  label = 'Navegação',
  theme,
  className,
  style,
}: RadialNavProps) {
  const raizRef = useRef<HTMLElement>(null);
  const escuro = useTemaEscuro(raizRef, theme);
  const reduzir = !!useReducedMotion();
  const iconSize = button?.iconSize ?? 20;
  const recolhido = button?.collapsedSize ?? 40;
  const padding = button?.padding ?? 8;

  const [ativo, setAtivo] = useState<number | undefined>(defaultActiveId);
  const botoesRef = useRef<(HTMLButtonElement | null)[]>([]);

  const itemAtivo = items.find((i) => i.id === ativo);
  const alvo = (itemAtivo?.angle ?? 0) + 45;
  const anguloRef = useRef<number | null>(null);
  // Idempotente: repetir o cálculo com o mesmo alvo devolve o mesmo valor.
  const angulo = anguloRef.current === null ? alvo : maisProximo(anguloRef.current, alvo);
  anguloRef.current = angulo;

  const escolher = (id: number) => {
    if (id !== ativo) {
      setAtivo(id);
      onActiveChange?.(id);
    }
  };

  const aoTeclar = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!passo || items.length === 0) return;
    e.preventDefault();
    botoesRef.current[(idx + passo + items.length) % items.length]?.focus();
  };

  const c = escuro
    ? { borda: '#e5e5e5', pagina: '#0a0a0a', texto: '#fafafa' }
    : { borda: '#262626', pagina: '#ffffff', texto: '#0a0a0a' };
  const raio = size / 2 - 0.5;
  const instant: Transition = { duration: 0 };

  return (
    <nav
      ref={raizRef}
      aria-label={label}
      className={['relative flex shrink-0 items-center justify-center rounded-full', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size, border: `1px solid ${c.borda}`, boxSizing: 'border-box', color: c.texto, ...style }}
    >
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{ rotate: angulo }}
        transition={reduzir ? instant : MOLA_PONTEIRO}
        style={{ width: 20, height: 20, color: c.texto }}
      >
        <Ponteiro size={20} />
      </motion.div>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map((item, idx) => {
          const rad = (item.angle * Math.PI) / 180;
          const eAtivo = item.id === ativo;
          const Icone = item.icon;
          return (
            <li
              key={item.id}
              className="absolute"
              style={{
                left: `calc(50% + ${Math.sin(rad) * raio}px)`,
                top: `calc(50% - ${Math.cos(rad) * raio}px)`,
                transform: 'translate(-50%, -50%)',
                width: 'max-content',
                zIndex: eAtivo ? 2 : 1,
              }}
            >
              <motion.button
                ref={(el) => {
                  botoesRef.current[idx] = el;
                }}
                type="button"
                aria-label={item.label}
                aria-current={eAtivo ? 'page' : undefined}
                onClick={() => escolher(item.id)}
                onKeyDown={(e) => aoTeclar(e, idx)}
                initial={false}
                animate={{ maxWidth: eAtivo ? LARGURA_ATIVA : recolhido }}
                transition={reduzir ? instant : eAtivo ? MOLA_EXPANDE : MOLA_RECOLHE}
                whileTap={reduzir ? undefined : { scale: 0.95 }}
                className="flex cursor-pointer items-center overflow-hidden whitespace-nowrap rounded-full outline-none focus-visible:[outline:2px_solid_currentColor] focus-visible:[outline-offset:2px]"
                style={{
                  height: recolhido,
                  minWidth: recolhido,
                  padding,
                  gap: 4,
                  border: `1px solid ${c.borda}`,
                  background: c.pagina,
                  color: c.texto,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              >
                <span className="flex shrink-0" style={{ transform: 'translateX(1px)' }}>
                  <Icone size={iconSize} style={{ width: iconSize, height: iconSize }} />
                </span>
                <motion.span
                  aria-hidden="true"
                  initial={false}
                  animate={eAtivo ? { opacity: 1, x: 0, width: 'auto' } : { opacity: 0, x: 4, width: 0 }}
                  transition={reduzir ? instant : MOLA_ROTULO}
                  style={{ fontSize: 14, fontWeight: 500, display: 'inline-block', overflow: 'hidden' }}
                >
                  {item.label}
                </motion.span>
              </motion.button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default RadialNav;
