// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

export interface RadialMenuItem {
  /** Identificador único. */
  id: string;
  /** Texto acessível (não há texto visível). */
  label: string;
  /** Componente de ícone (ex.: lucide-react). */
  icon: ComponentType<{ size?: number | string; strokeWidth?: number | string; 'aria-hidden'?: boolean }>;
}

export interface RadialMenuProps {
  items: RadialMenuItem[];
  /** Conteúdo da área-gatilho; sem ele aparece a caixa tracejada padrão. */
  children?: ReactNode;
  /** Diâmetro total do menu (px). */
  size?: number;
  /** Tamanho do ícone (px); a área clicável tem o dobro. */
  iconSize?: number;
  /** Largura radial da faixa principal (px). */
  bandWidth?: number;
  /** Espaço entre a faixa principal e o disco central (px). */
  innerGap?: number;
  /** Espaço entre o anel externo e a faixa principal (px). */
  outerGap?: number;
  /** Largura do anel externo (px). */
  ringWidth?: number;
  /** Chamado ao selecionar um item (recebe o item inteiro). */
  onSelect?: (item: RadialMenuItem) => void;
  /** Nome acessível do menu. */
  menuLabel?: string;
  className?: string;
}

const PALETTE = {
  light: {
    slice: '#f5f5f5',
    sliceActive: '#e5e5e5',
    sliceStroke: '#d4d4d4',
    icon: '#525252',
    iconActive: '#171717',
    disc: '#f5f5f5',
    discStroke: '#a3a3a3',
    dot: '#a3a3a3',
  },
  dark: {
    slice: '#262626',
    sliceActive: '#404040',
    sliceStroke: '#525252',
    icon: '#a3a3a3',
    iconActive: '#fafafa',
    disc: '#0a0a0a',
    discStroke: '#525252',
    dot: '#525252',
  },
} as const;

const SHADOW = '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
const LONG_PRESS_MS = 500;
const VIEWPORT_PAD = 8;

const f = (n: number) => Number(n.toFixed(3));

function polar(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [f(r * Math.cos(a)), f(r * Math.sin(a))];
}

// Fatia de rosca: arco externo horário, linha ao raio interno, arco interno anti-horário.
// Cada arco é dividido no ângulo médio, então cada metade tem ≤ 180° e o caso de 2 itens
// (meia-rosca) fica sem ambiguidade.
function slicePath(rOut: number, rIn: number, a0: number, a1: number): string {
  const am = (a0 + a1) / 2;
  const [x0, y0] = polar(rOut, a0);
  const [xm, ym] = polar(rOut, am);
  const [x1, y1] = polar(rOut, a1);
  let d = `M${x0} ${y0}A${rOut} ${rOut} 0 0 1 ${xm} ${ym}A${rOut} ${rOut} 0 0 1 ${x1} ${y1}`;
  if (rIn > 0) {
    const [ix1, iy1] = polar(rIn, a1);
    const [ixm, iym] = polar(rIn, am);
    const [ix0, iy0] = polar(rIn, a0);
    d += `L${ix1} ${iy1}A${rIn} ${rIn} 0 0 0 ${ixm} ${iym}A${rIn} ${rIn} 0 0 0 ${ix0} ${iy0}Z`;
  } else {
    d += 'L0 0Z';
  }
  return d;
}

// Item único: duas circunferências completas com preenchimento evenodd (furo no meio).
function ringPath(rOut: number, rIn: number): string {
  const circle = (r: number) => `M${r} 0A${r} ${r} 0 1 1 ${-r} 0A${r} ${r} 0 1 1 ${r} 0Z`;
  return rIn > 0 ? circle(rOut) + circle(rIn) : circle(rOut);
}

function detectDark(el: Element | null): boolean {
  const marked = el?.closest('.dark, .light');
  if (marked) return marked.classList.contains('dark');
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function RadialMenu({
  items,
  children,
  size = 240,
  iconSize = 18,
  bandWidth = 50,
  innerGap = 8,
  outerGap = 8,
  ringWidth = 12,
  onSelect,
  menuLabel = 'Radial menu',
  className,
}: RadialMenuProps) {
  const menuId = useId();
  const reduceMotion = useReducedMotion();
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const longPress = useRef<{ timer: number; x: number; y: number } | null>(null);
  const keyboardOpenAt = useRef(0);
  const typeBuffer = useRef('');
  const typeTimer = useRef(0);
  const wasOpen = useRef(false);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(-1);
  const [dark, setDark] = useState(false);

  // Raios derivados (nunca negativos).
  const R = size / 2;
  const ringOuter = R;
  const ringInner = Math.max(0, R - ringWidth);
  const bandOuter = Math.max(0, ringInner - outerGap);
  const bandInner = Math.max(0, bandOuter - bandWidth);
  const discR = Math.max(0, bandInner - innerGap);
  const iconR = (bandOuter + bandInner) / 2;
  const hit = iconSize * 2;
  const n = items.length;
  const sweep = n > 0 ? 360 / n : 360;
  const colors = dark ? PALETTE.dark : PALETTE.light;

  const openAt = useCallback(
    (x: number, y: number) => {
      // Mantém o círculo inteiro na janela visível quando possível.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const r = size / 2;
      const cx = vw >= size + VIEWPORT_PAD * 2 ? Math.min(Math.max(x, r + VIEWPORT_PAD), vw - r - VIEWPORT_PAD) : vw / 2;
      const cy = vh >= size + VIEWPORT_PAD * 2 ? Math.min(Math.max(y, r + VIEWPORT_PAD), vh - r - VIEWPORT_PAD) : vh / 2;
      setDark(detectDark(triggerRef.current));
      setPos({ x: cx, y: cy });
      setActive(-1);
      setOpen(true);
      // reaberto enquanto já aberto: o foco volta ao menu (nenhum item ativo)
      menuRef.current?.focus({ preventScroll: true });
    },
    [size],
  );

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
    typeBuffer.current = '';
  }, []);

  const select = useCallback(
    (item: RadialMenuItem) => {
      onSelect?.(item);
      close();
    },
    [onSelect, close],
  );

  const focusItem = useCallback((i: number) => {
    setActive(i);
    itemRefs.current[i]?.focus({ preventScroll: true });
  }, []);

  const openAtTriggerCenter = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) openAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [openAt]);

  // ---- gatilho ----
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current.timer);
    longPress.current = null;
  };

  const onContextMenu = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    cancelLongPress();
    // Já aberto pela tecla de menu (o navegador ainda dispara contextmenu em seguida).
    if (Date.now() - keyboardOpenAt.current < 800) return;
    if (e.clientX === 0 && e.clientY === 0) openAtTriggerCenter();
    else openAt(e.clientX, e.clientY);
  };

  const onTriggerKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
      e.preventDefault();
      keyboardOpenAt.current = Date.now();
      openAtTriggerCenter();
    }
  };

  const onTriggerPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'touch') return;
    cancelLongPress();
    const x = e.clientX;
    const y = e.clientY;
    longPress.current = {
      x,
      y,
      timer: window.setTimeout(() => {
        longPress.current = null;
        openAt(x, y);
      }, LONG_PRESS_MS),
    };
  };

  const onTriggerPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const lp = longPress.current;
    if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancelLongPress();
  };

  // ---- menu ----
  const typeahead = (char: string) => {
    window.clearTimeout(typeTimer.current);
    typeBuffer.current += char.toLowerCase();
    typeTimer.current = window.setTimeout(() => {
      typeBuffer.current = '';
    }, 500);
    const buf = typeBuffer.current;
    const repeated = buf.split('').every((c) => c === buf[0]);
    const search = repeated ? buf[0] : buf;
    // Letra repetida percorre os itens que começam com ela; palavra começa no item atual.
    const start = active < 0 ? 0 : repeated ? active + 1 : active;
    for (let k = 0; k < n; k++) {
      const idx = (start + k) % n;
      if (items[idx].label.toLowerCase().startsWith(search)) {
        focusItem(idx);
        return;
      }
    }
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!n && e.key !== 'Escape') return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusItem(active < 0 ? 0 : (active + 1) % n);
        return;
      case 'ArrowUp':
        e.preventDefault();
        focusItem(active < 0 ? n - 1 : (active - 1 + n) % n);
        return;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        return;
      case 'End':
        e.preventDefault();
        focusItem(n - 1);
        return;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      case 'Tab':
        e.preventDefault();
        close();
        return;
      case 'Enter':
        e.preventDefault();
        if (active >= 0) select(items[active]);
        return;
      case ' ':
        e.preventDefault();
        if (typeBuffer.current) typeahead(' ');
        else if (active >= 0) select(items[active]);
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          typeahead(e.key);
        }
    }
  };

  // Foco: vai para o menu ao abrir e volta ao gatilho ao fechar.
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      menuRef.current?.focus({ preventScroll: true });
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const ae = document.activeElement;
    if (!ae || ae === document.body || menuRef.current?.contains(ae)) {
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [open]);

  // Fecha ao clicar fora, ao redimensionar, rolar ou perder o foco da janela.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && menuRef.current?.contains(t)) return;
      // botão direito no gatilho apenas reposiciona (o contextmenu reabre no novo ponto)
      if (e.button === 2 && t && triggerRef.current?.contains(t)) return;
      close();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, close]);

  useEffect(
    () => () => {
      cancelLongPress();
      window.clearTimeout(typeTimer.current);
    },
    [],
  );

  const spring = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 1 };
  const hidden = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5 };
  const shown = reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 };

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="radial-menu"
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={menuLabel}
          aria-orientation="vertical"
          tabIndex={-1}
          onKeyDown={onMenuKeyDown}
          onContextMenu={(e) => e.preventDefault()}
          initial={hidden}
          animate={shown}
          exit={hidden}
          transition={reduceMotion ? { duration: 0.15 } : spring}
          style={{
            position: 'fixed',
            left: pos.x - R,
            top: pos.y - R,
            width: size,
            height: size,
            borderRadius: '50%',
            overflow: 'hidden',
            boxShadow: SHADOW,
            outline: 'none',
            zIndex: 2147483000,
            colorScheme: dark ? 'dark' : 'light',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <svg
            role="presentation"
            width={size}
            height={size}
            viewBox={`${-R} ${-R} ${size} ${size}`}
            style={{ display: 'block' }}
          >
            {items.map((item, i) => {
              const center = -90 + i * sweep;
              const a0 = center - sweep / 2;
              const a1 = center + sweep / 2;
              const isActive = i === active;
              const fill = isActive ? colors.sliceActive : colors.slice;
              const single = n === 1;
              const [ix, iy] = polar(iconR, center);
              const Icon = item.icon;
              return (
                <g
                  key={item.id}
                  role="presentation"
                  style={{ cursor: 'pointer' }}
                  onPointerMove={() => {
                    if (active !== i) focusItem(i);
                  }}
                  onClick={() => select(item)}
                >
                  <path
                    aria-hidden="true"
                    d={single ? ringPath(ringOuter, ringInner) : slicePath(ringOuter, ringInner, a0, a1)}
                    fillRule="evenodd"
                    fill={fill}
                    style={{ transition: 'fill 50ms ease-out' }}
                  />
                  <path
                    aria-hidden="true"
                    d={single ? ringPath(bandOuter, bandInner) : slicePath(bandOuter, bandInner, a0, a1)}
                    fillRule="evenodd"
                    fill={fill}
                    stroke={colors.sliceStroke}
                    strokeWidth={1}
                    style={{ transition: 'fill 50ms ease-out' }}
                  />
                  <foreignObject x={ix - hit / 2} y={iy - hit / 2} width={hit} height={hit} role="presentation">
                    <div
                      ref={(el) => {
                        itemRefs.current[i] = el;
                      }}
                      role="menuitem"
                      aria-label={item.label}
                      tabIndex={isActive ? 0 : -1}
                      onFocus={() => setActive(i)}
                      style={{
                        width: hit,
                        height: hit,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        outline: 'none',
                        color: isActive ? colors.iconActive : colors.icon,
                        transition: 'color 50ms ease-out',
                      }}
                    >
                      <Icon size={iconSize} strokeWidth={1.5} aria-hidden />
                    </div>
                  </foreignObject>
                </g>
              );
            })}
            {discR > 0 && (
              <circle
                aria-hidden="true"
                r={discR}
                fill={colors.disc}
                stroke={colors.discStroke}
                strokeWidth={1}
                opacity={0.5}
              />
            )}
            <circle aria-hidden="true" r={3} fill="none" stroke={colors.dot} strokeWidth={1} />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div
        ref={triggerRef}
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onContextMenu={onContextMenu}
        onKeyDown={onTriggerKeyDown}
        onPointerDown={onTriggerPointerDown}
        onPointerMove={onTriggerPointerMove}
        onPointerUp={cancelLongPress}
        onPointerCancel={cancelLongPress}
        onPointerLeave={cancelLongPress}
        className={className}
        style={{ userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none', outline: 'none' }}
      >
        {children ?? (
          <div
            style={{
              width: 320,
              height: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed color-mix(in srgb, currentColor 25%, transparent)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            Right-click here.
          </div>
        )}
      </div>
      {typeof document !== 'undefined' && createPortal(menu, document.body)}
    </>
  );
}

export default RadialMenu;
