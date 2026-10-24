// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Children,
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type MotionValue } from 'motion/react';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';
type Spring = { stiffness: number; damping: number };

interface TipData {
  key: string;
  el: HTMLElement;
  content: ReactNode;
  side: TooltipSide;
  sideOffset: number;
  align: TooltipAlign;
  alignOffset: number;
  arrow: boolean;
}

interface GroupCtx {
  tooltipId: string;
  currentKey: string | null;
  isOpen: () => boolean;
  show: (d: TipData, immediate?: boolean) => void;
  hide: (key: string) => void;
  closeNow: () => void;
}

const Group = createContext<GroupCtx | null>(null);
const DEFAULT_SPRING: Spring = { stiffness: 300, damping: 35 };
const MARGIN = 8;

// ---------------------------------------------------------------------------
// Posicionamento flutuante próprio: lado + inversão + deslizamento + seta.
// ---------------------------------------------------------------------------
interface Placement { side: TooltipSide; x: number; y: number; w: number; h: number; ax: number; ay: number }

const OPPOSITE: Record<TooltipSide, TooltipSide> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

function clamp(v: number, min: number, max: number) {
  return max < min ? min : Math.min(max, Math.max(min, v));
}

function place(r: DOMRect, w: number, h: number, d: TipData, vw: number, vh: number): Placement {
  const off = d.sideOffset;
  // Espaço que sobra (negativo = não cabe) em cada lado.
  const room = (s: TooltipSide) =>
    s === 'top' ? r.top - off - h - MARGIN
      : s === 'bottom' ? vh - MARGIN - (r.bottom + off + h)
        : s === 'left' ? r.left - off - w - MARGIN
          : vw - MARGIN - (r.right + off + w);
  let side = d.side;
  if (room(side) < 0 && room(OPPOSITE[side]) > room(side)) side = OPPOSITE[side];

  const alignPos = (start: number, size: number, own: number) =>
    d.align === 'start' ? start + d.alignOffset
      : d.align === 'end' ? start + size - own - d.alignOffset
        : start + size / 2 - own / 2 + d.alignOffset;

  let x: number, y: number, ax: number, ay: number;
  if (side === 'top' || side === 'bottom') {
    y = side === 'top' ? r.top - off - h : r.bottom + off;
    x = clamp(alignPos(r.left, r.width, w), MARGIN, vw - w - MARGIN);
    const edge = Math.min(14, w / 2);
    ax = clamp(r.left + r.width / 2 - x, edge, w - edge);
    ay = side === 'top' ? h + 2 : -2;
  } else {
    x = side === 'left' ? r.left - off - w : r.right + off;
    y = clamp(alignPos(r.top, r.height, h), MARGIN, vh - h - MARGIN);
    const edge = Math.min(14, h / 2);
    ay = clamp(r.top + r.height / 2 - y, edge, h - edge);
    ax = side === 'left' ? w + 2 : -2;
  }
  return { side, x, y, w, h, ax, ay };
}

function themeOf(el: HTMLElement) {
  const host = el.closest('.dark, .light');
  if (host) return host.classList.contains('dark');
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const ENTRY_OFFSET: Record<TooltipSide, { x: number; y: number }> = {
  top: { x: 0, y: 15 },
  bottom: { x: 0, y: -15 },
  left: { x: 15, y: 0 },
  right: { x: -15, y: 0 },
};
const ORIGIN: Record<TooltipSide, string> = { top: '50% 100%', bottom: '50% 0%', left: '100% 50%', right: '0% 50%' };
const ARROW_ROT: Record<TooltipSide, number> = { top: 0, right: 90, bottom: 180, left: -90 };

// ---------------------------------------------------------------------------
// Balão único do grupo
// ---------------------------------------------------------------------------
function Balloon({
  data,
  id,
  spring,
  reduced,
  floatingRef,
}: {
  data: TipData;
  id: string;
  spring: Spring;
  reduced: boolean;
  floatingRef: RefObject<HTMLDivElement | null>;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [placedSide, setPlacedSide] = useState<TooltipSide>(data.side);
  const sideRef = useRef(placedSide);

  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const ax = useMotionValue(0);
  const ay = useMotionValue(0);
  const arrowLeft = useTransform(ax, (v) => v - 6);
  const arrowTop = useTransform(ay, (v) => v - 3);

  useLayoutEffect(() => {
    const mvs: Array<[keyof Placement, MotionValue<number>]> = [['x', px], ['y', py], ['w', w], ['h', h], ['ax', ax], ['ay', ay]];
    let prev: Placement | null = null;
    let ctrls: Array<{ stop: () => void }> = [];
    let raf = 0;

    const compute = (): Placement | null => {
      const d = dataRef.current;
      const c = contentRef.current;
      if (!c || !d.el.isConnected) return null;
      return place(d.el.getBoundingClientRect(), c.offsetWidth, c.offsetHeight, d, window.innerWidth, window.innerHeight);
    };

    const apply = (t: Placement) => {
      const instant = !prev || reduced;
      if (prev && mvs.every(([k]) => Math.abs((prev as Placement)[k] as number - (t[k] as number)) < 0.5) && prev.side === t.side) return;
      prev = t;
      ctrls.forEach((c) => c.stop());
      ctrls = [];
      for (const [k, mv] of mvs) {
        const v = t[k] as number;
        if (instant) mv.jump(v);
        else ctrls.push(animate(mv, v, { type: 'spring', ...spring }));
      }
      if (t.side !== sideRef.current) { sideRef.current = t.side; setPlacedSide(t.side); }
    };

    const first = compute();
    if (first) apply(first);
    // Recalcula a cada quadro enquanto visível (gatilho do estado atual, mudanças de layout, novo conteúdo).
    const tick = () => {
      const t = compute();
      if (t) apply(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ctrls.forEach((c) => c.stop()); };
  }, [reduced, spring, px, py, w, h, ax, ay]);

  const dark = themeOf(data.el);
  const bg = dark ? '#fafafa' : '#0a0a0a';
  const fg = dark ? '#0a0a0a' : '#fafafa';
  const offset = ENTRY_OFFSET[placedSide];
  const hidden = reduced ? { opacity: 0 } : { opacity: 0, scale: 0, x: offset.x, y: offset.y };
  const initialOffset = ENTRY_OFFSET[data.side];
  const initial = reduced ? { opacity: 0 } : { opacity: 0, scale: 0, x: initialOffset.x, y: initialOffset.y };
  const transition = reduced ? { duration: 0.15 } : { type: 'spring' as const, ...spring };

  return (
    <motion.div
      ref={floatingRef}
      role="tooltip"
      id={id}
      style={{ position: 'fixed', left: 0, top: 0, x: px, y: py, zIndex: 50, pointerEvents: 'none' }}
    >
      <motion.div
        initial={initial}
        animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={hidden}
        transition={transition}
        style={{ position: 'relative', transformOrigin: ORIGIN[placedSide] }}
      >
        <motion.div style={{ position: 'relative', width: w, height: h, background: bg, color: fg, borderRadius: 8, overflow: 'hidden' }}>
          <div
            ref={contentRef}
            style={{
              position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
              width: 'max-content', maxWidth: 'min(18rem, calc(100vw - 16px))', boxSizing: 'border-box',
              padding: '6px 12px', fontSize: 12, lineHeight: '16px', textAlign: 'center',
              textWrap: 'balance',
            } as CSSProperties}
          >
            {data.content}
          </div>
        </motion.div>
        {data.arrow && (
          <motion.svg
            width={12}
            height={6}
            viewBox="0 0 12 6"
            aria-hidden="true"
            style={{ position: 'absolute', left: arrowLeft, top: arrowTop, rotate: ARROW_ROT[placedSide], overflow: 'visible', display: 'block' }}
          >
            {/* Triângulo apontando para baixo (lado de cima), com ponta arredondada. */}
            <path d="M0 -0.5 H12 L7.5 4.9 Q6 6.6 4.5 4.9 Z" fill={bg} />
          </motion.svg>
        )}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Provedor do grupo
// ---------------------------------------------------------------------------
export interface TooltipProviderProps {
  openDelay?: number;
  closeDelay?: number;
  transition?: Spring;
  id?: string;
  children?: ReactNode;
}

export function TooltipProvider({ openDelay = 0, closeDelay = 300, transition = DEFAULT_SPRING, id, children }: TooltipProviderProps) {
  const autoId = useId();
  const tooltipId = `atlas-tip-${(id ?? autoId).replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const reduced = !!useReducedMotion();
  const [current, setCurrent] = useState<TipData | null>(null);
  const currentRef = useRef(current);
  currentRef.current = current;
  const floatingRef = useRef<HTMLDivElement>(null);
  const openT = useRef<number | undefined>(undefined);
  const closeT = useRef<number | undefined>(undefined);
  const lastClosed = useRef(-Infinity);

  const clearTimers = () => { window.clearTimeout(openT.current); window.clearTimeout(closeT.current); };

  const closeNow = useCallback(() => {
    clearTimers();
    if (currentRef.current) lastClosed.current = performance.now();
    currentRef.current = null;
    setCurrent(null);
  }, []);

  const show = useCallback((d: TipData, immediate = false) => {
    clearTimers();
    const warm = performance.now() - lastClosed.current < closeDelay;
    const open = () => { currentRef.current = d; setCurrent(d); };
    if (immediate || currentRef.current || warm || openDelay <= 0) open();
    else openT.current = window.setTimeout(open, openDelay);
  }, [openDelay, closeDelay]);

  const hide = useCallback((key: string) => {
    window.clearTimeout(openT.current);
    const cur = currentRef.current;
    if (cur && cur.key !== key) return; // já trocou para outro gatilho
    window.clearTimeout(closeT.current);
    if (!cur) return;
    closeT.current = window.setTimeout(closeNow, closeDelay);
  }, [closeDelay, closeNow]);

  useEffect(() => () => clearTimers(), []);

  // Fechamento imediato: Escape, rolagem que move o gatilho, redimensionamento, toque fora.
  useEffect(() => {
    if (!current) return;
    const el = current.el;
    const start = el.getBoundingClientRect();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeNow(); };
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      if (Math.abs(r.left - start.left) > 0.5 || Math.abs(r.top - start.top) > 0.5) closeNow();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (t && (el.contains(t) || floatingRef.current?.contains(t))) return;
      closeNow();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', closeNow);
    document.addEventListener('pointerdown', onDown, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', closeNow);
      document.removeEventListener('pointerdown', onDown, true);
    };
  }, [current, closeNow]);

  const ctx = useMemo<GroupCtx>(() => ({
    tooltipId,
    currentKey: current?.key ?? null,
    isOpen: () => currentRef.current != null,
    show,
    hide,
    closeNow,
  }), [tooltipId, current, show, hide, closeNow]);

  return (
    <Group.Provider value={ctx}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {current && (
              <Balloon key={tooltipId} data={current} id={tooltipId} spring={transition} reduced={reduced} floatingRef={floatingRef} />
            )}
          </AnimatePresence>,
          document.body,
        )}
    </Group.Provider>
  );
}

// ---------------------------------------------------------------------------
// Gatilho: injeta eventos no próprio elemento filho (sem invólucro focável)
// ---------------------------------------------------------------------------
export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  sideOffset?: number;
  align?: TooltipAlign;
  alignOffset?: number;
  arrow?: boolean;
  children: ReactElement;
}

type ChildProps = {
  ref?: Ref<HTMLElement>;
  'aria-describedby'?: string;
  onPointerEnter?: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerDown?: (e: ReactPointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
};

export function Tooltip({ content, side = 'top', sideOffset = 10, align = 'center', alignOffset = 0, arrow = true, children }: TooltipProps) {
  const g = useContext(Group);
  if (!g) throw new Error('<Tooltip> precisa estar dentro de <TooltipProvider>.');
  const key = useId();
  const elRef = useRef<HTMLElement | null>(null);
  const ignoreFocus = useRef(false);
  const child = Children.only(children) as ReactElement<ChildProps>;
  const p = child.props;

  const data = (): TipData | null =>
    elRef.current ? { key, el: elRef.current, content, side, sideOffset, align, alignOffset, arrow } : null;
  const open = (immediate = false) => { const d = data(); if (d) g.show(d, immediate); };

  const setRef = (node: HTMLElement | null) => {
    elRef.current = node;
    const r = p.ref;
    if (typeof r === 'function') r(node);
    else if (r) (r as { current: HTMLElement | null }).current = node;
  };

  const active = g.currentKey === key;
  const describedBy = [p['aria-describedby'], active ? g.tooltipId : undefined].filter(Boolean).join(' ') || undefined;

  return cloneElement(child, {
    ref: setRef,
    'aria-describedby': describedBy,
    onPointerEnter: (e) => {
      p.onPointerEnter?.(e);
      if (e.pointerType !== 'touch') open();
    },
    onPointerLeave: (e) => {
      p.onPointerLeave?.(e);
      ignoreFocus.current = false;
      if (e.pointerType !== 'touch') g.hide(key);
    },
    onPointerDown: (e) => {
      p.onPointerDown?.(e);
      ignoreFocus.current = true; // o foco gerado por este clique não reabre o balão
      if (e.pointerType === 'touch' && !active) open(true);
      else g.closeNow();
    },
    onFocus: (e) => {
      p.onFocus?.(e);
      if (ignoreFocus.current) { ignoreFocus.current = false; return; }
      open();
    },
    onBlur: (e) => {
      p.onBlur?.(e);
      g.hide(key);
    },
  } as ChildProps);
}

const SharedTooltip = Object.assign(Tooltip, { Provider: TooltipProvider });
export { SharedTooltip };
export default SharedTooltip;
