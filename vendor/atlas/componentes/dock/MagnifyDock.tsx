// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useCallback, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react';

export interface MagnifyDockItem {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
}

export interface MagnifyDockSpring {
  mass: number;
  stiffness: number;
  damping: number;
}

export interface MagnifyDockProps {
  /** Itens do dock. */
  items?: MagnifyDockItem[];
  /** Classe extra do painel. */
  className?: string;
  /** Mola usada nos itens e na altura do contêiner. */
  spring?: MagnifyDockSpring;
  /** Tamanho máximo de um item ampliado (px). */
  magnification?: number;
  /** Raio horizontal de influência do ponteiro (px). */
  distance?: number;
  /** Altura do painel (px). */
  panelHeight?: number;
  /** Altura máxima reservada pelo contêiner quando ativo (px). */
  dockHeight?: number;
  /** Tamanho base do item (px). */
  baseItemSize?: number;
}

const DEFAULT_SPRING: MagnifyDockSpring = { mass: 0.1, stiffness: 150, damping: 12 };
// Rótulo: fade + subida de 10 px em 0,2 s. A transição também fica em
// "hidden" para que a saída (exit) mantenha os mesmos 0,2 s.
const labelMotion = {
  hidden: { opacity: 0, y: 0, transition: { duration: 0.2 } },
  shown: { opacity: 1, y: -10, transition: { duration: 0.2 } },
};
const BORDER = '#222';
const SURFACE = '#120F17';

interface TileProps {
  item: MagnifyDockItem;
  index: number;
  pointerX: MotionValue<number>;
  spring: MagnifyDockSpring;
  distance: number;
  magnification: number;
  baseItemSize: number;
  tabbable: boolean;
  onFocusIndex: (i: number) => void;
  registerRef: (i: number, el: HTMLDivElement | null) => void;
}

function DockTile({
  item,
  index,
  pointerX,
  spring,
  distance,
  magnification,
  baseItemSize,
  tabbable,
  onFocusIndex,
  registerRef,
}: TileProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // Triângulo de ampliação: base em ±distance, máximo em 0, saturado fora.
  // Ponteiro e retângulo usam coordenadas de viewport (clientX / getBoundingClientRect).
  const target = useTransform(pointerX, (x) => {
    const el = ref.current;
    if (!Number.isFinite(x) || !el) return baseItemSize;
    const d = x - (el.getBoundingClientRect().left + baseItemSize / 2);
    const t = Math.min(1, Math.abs(d) / Math.max(1, distance));
    return magnification + (baseItemSize - magnification) * t;
  });
  const size = useSpring(target, spring);

  const activate = () => item.onClick?.();

  return (
    <motion.div
      ref={(el: HTMLDivElement | null) => {
        ref.current = el;
        registerRef(index, el);
      }}
      role="button"
      aria-label={item.label}
      tabIndex={tabbable ? 0 : -1}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        border: `1px solid ${BORDER}`,
        backgroundColor: SURFACE,
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
      className={[
        'outline-none shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)]',
        'focus-visible:ring-2 focus-visible:ring-white/80',
        item.className ?? '',
      ].join(' ')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => {
        setFocused(true);
        onFocusIndex(index);
      }}
      onBlur={() => setFocused(false)}
      onClick={activate}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
      <AnimatePresence>
        {(hovered || focused) && (
          <motion.div
            role="tooltip"
            variants={labelMotion}
            initial="hidden"
            animate="shown"
            exit="hidden"
            style={{
              x: '-50%',
              position: 'absolute',
              top: '-1.5rem',
              left: '50%',
              width: 'fit-content',
              whiteSpace: 'pre',
              padding: '0.125rem 0.5rem',
              borderRadius: '0.375rem',
              border: `1px solid ${BORDER}`,
              backgroundColor: SURFACE,
              color: '#fff',
              fontSize: '0.75rem',
              lineHeight: '1rem',
              pointerEvents: 'none',
            }}
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function MagnifyDock({
  items = [],
  className = '',
  spring = DEFAULT_SPRING,
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50,
}: MagnifyDockProps) {
  const reduce = useReducedMotion();
  const pointerX = useMotionValue(Infinity);
  const active = useMotionValue(0);

  const maxHeight = Math.max(dockHeight, magnification * 1.5 + 4);
  const heightTarget = useTransform(active, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightTarget, spring);

  // Roving tabindex da toolbar: só um item entra na ordem do Tab.
  const [current, setCurrent] = useState(0);
  const tabIndexOwner = Math.min(current, Math.max(0, items.length - 1));
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const registerRef = useCallback((i: number, el: HTMLDivElement | null) => {
    tileRefs.current[i] = el;
  }, []);

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // Toque não tem proximidade; com movimento reduzido não há ampliação.
    if (reduce || e.pointerType === 'touch') return;
    active.set(1);
    pointerX.set(e.clientX);
  };
  const handlePointerLeave = () => {
    active.set(0);
    pointerX.set(Infinity);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = items.length;
    if (n === 0) return;
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (tabIndexOwner + 1) % n;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (tabIndexOwner - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    setCurrent(next);
    tileRefs.current[next]?.focus();
  };

  return (
    // Contêiner externo: só reserva altura; é sempre transparente.
    // Layout estrutural vai inline para não depender da compilação do Tailwind.
    <motion.div
      style={{
        height: reduce ? panelHeight : height,
        display: 'flex',
        alignItems: 'center',
        maxWidth: '100%',
        margin: '0 0.5rem',
        background: 'transparent',
        scrollbarWidth: 'none',
      }}
      className="[&::-webkit-scrollbar]:hidden"
    >
      <div
        role="toolbar"
        aria-label="Application dock"
        aria-orientation="horizontal"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onKeyDown={handleKeyDown}
        style={{
          position: 'absolute',
          bottom: '0.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1rem',
          width: 'fit-content',
          height: panelHeight,
          padding: '0 0.5rem 0.5rem',
          borderRadius: '1rem',
          border: `1px solid ${BORDER}`,
          backgroundColor: SURFACE,
          boxSizing: 'border-box',
        }}
        className={className || undefined}
      >
        {items.map((item, i) => (
          <DockTile
            key={`${i}-${item.label}`}
            item={item}
            index={i}
            pointerX={pointerX}
            spring={spring}
            distance={distance}
            magnification={reduce ? baseItemSize : magnification}
            baseItemSize={baseItemSize}
            tabbable={i === tabIndexOwner}
            onFocusIndex={setCurrent}
            registerRef={registerRef}
          />
        ))}
      </div>
    </motion.div>
  );
}

export default MagnifyDock;
