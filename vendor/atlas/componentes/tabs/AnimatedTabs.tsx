// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

type Spring = { stiffness: number; damping: number };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/** Detecta o tema pelo ancestral `.dark`/`.light` mais próximo, com fallback para prefers-color-scheme. */
export function useStageDark(ref: RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const compute = () => {
      const host = el.closest('.dark, .light');
      setDark(host ? host.classList.contains('dark') : mq.matches);
    };
    compute();
    const mo = new MutationObserver(compute);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq.addEventListener('change', compute);
    return () => { mo.disconnect(); mq.removeEventListener('change', compute); };
  }, [ref]);
  return dark;
}

interface TabsCtx {
  baseId: string;
  active: string | undefined;
  select: (v: string) => void;
  register: (v: string, disabled: boolean) => void;
  dark: boolean;
  reduced: boolean;
  pillSpring: Spring;
  stripSpring: Spring;
  blur: number;
}

// Padrões estáveis (evitam reiniciar efeitos a cada render).
const PILL_SPRING: Spring = { stiffness: 200, damping: 25 };
const STRIP_SPRING: Spring = { stiffness: 300, damping: 30 };

const Ctx = createContext<TabsCtx | null>(null);

function useTabs() {
  const c = useContext(Ctx);
  if (!c) throw new Error('Componentes de abas devem ficar dentro de <Tabs>.');
  return c;
}

const safe = (v: string) => v.replace(/[^a-zA-Z0-9_-]/g, '_');
const triggerId = (base: string, v: string) => `${base}-tab-${safe(v)}`;
const panelId = (base: string, v: string) => `${base}-panel-${safe(v)}`;

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  pillSpring?: Spring;
  stripSpring?: Spring;
  blur?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  pillSpring = PILL_SPRING,
  stripSpring = STRIP_SPRING,
  blur = 4,
  className,
  style,
  children,
}: TabsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useStageDark(rootRef);
  const reduced = !!useReducedMotion();
  const rawId = useId();
  const baseId = `atlas-tabs-${safe(rawId)}`;

  const [internal, setInternal] = useState<string | undefined>(defaultValue);
  const internalRef = useRef(internal);
  internalRef.current = internal;
  const controlled = value !== undefined;
  const active = controlled ? value : internal;

  const select = useCallback(
    (v: string) => {
      if (!controlled) setInternal(v);
      onValueChange?.(v);
    },
    [controlled, onValueChange],
  );

  // Sem aba inicial: a primeira aba registrada (habilitada) vira a ativa.
  const register = useCallback(
    (v: string, disabled: boolean) => {
      if (controlled || disabled || internalRef.current !== undefined) return;
      internalRef.current = v;
      setInternal(v);
    },
    [controlled],
  );

  const ctx = useMemo<TabsCtx>(
    () => ({ baseId, active, select, register, dark, reduced, pillSpring, stripSpring, blur }),
    [baseId, active, select, register, dark, reduced, pillSpring, stripSpring, blur],
  );

  return (
    <Ctx.Provider value={ctx}>
      <div ref={rootRef} className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export interface TabsListProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function TabsList({ className, style, children }: TabsListProps) {
  const { dark } = useTabs();
  const ref = useRef<HTMLDivElement>(null);

  // Setas, Home e End com foco "roving" e ativação automática.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = ref.current;
    if (!list) return;
    const tabs = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'));
    if (!tabs.length) return;
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    let n: number;
    switch (e.key) {
      case 'ArrowRight': n = i < 0 ? 0 : (i + 1) % tabs.length; break;
      case 'ArrowLeft': n = i < 0 ? tabs.length - 1 : (i - 1 + tabs.length) % tabs.length; break;
      case 'Home': n = 0; break;
      case 'End': n = tabs.length - 1; break;
      default: return;
    }
    e.preventDefault();
    tabs[n].focus();
    tabs[n].click();
  };

  return (
    <div
      ref={ref}
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={onKeyDown}
      className={className}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', width: 'fit-content', height: 36,
        padding: 3, borderRadius: 10, boxSizing: 'border-box', background: dark ? '#262626' : '#f5f5f5', ...style,
      }}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function TabsTrigger({ value, disabled = false, className, style, children }: TabsTriggerProps) {
  const { baseId, active, select, register, dark, reduced, pillSpring } = useTabs();
  const isActive = active === value;

  useLayoutEffect(() => { register(value, disabled); }, [register, value, disabled]);

  const color = isActive ? (dark ? '#fafafa' : '#0a0a0a') : dark ? '#a1a1a1' : '#737373';

  return (
    <button
      type="button"
      role="tab"
      id={triggerId(baseId, value)}
      aria-selected={isActive}
      aria-controls={panelId(baseId, value)}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => select(value)}
      className={cx(
        'outline-none focus-visible:ring-[3px] focus-visible:ring-[#a1a1a1]/50 focus-visible:outline-1 focus-visible:outline-[#a1a1a1]',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        className,
      )}
      style={{
        position: 'relative', flex: '1 1 0%', height: 'calc(100% - 1px)', padding: '4px 8px', borderRadius: 8,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, whiteSpace: 'nowrap',
        fontSize: 14, fontWeight: 500, lineHeight: '20px', background: 'transparent', border: 0, cursor: 'pointer',
        color, transition: 'color 500ms ease-in-out',
        opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : undefined,
        ...style,
      }}
    >
      {isActive && (
        <motion.span
          layoutId={`${baseId}-pill`}
          aria-hidden="true"
          transition={reduced ? { duration: 0 } : { type: 'spring', ...pillSpring }}
          style={{
            position: 'absolute', inset: 0, zIndex: 0, borderRadius: 8, boxSizing: 'border-box',
            background: dark ? 'rgba(255,255,255,0.045)' : '#ffffff',
            border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
          }}
        />
      )}
      <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}>{children}</span>
    </button>
  );
}

export interface TabsContentsProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function TabsContents({ className, style, children }: TabsContentsProps) {
  const { active, reduced, stripSpring } = useTabs();
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<TabsContentProps>[];
  // Indexa pelo valor do painel, não pela ordem das abas.
  const idx = Math.max(0, items.findIndex((c) => c.props.value === active));

  const outerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const height = useMotionValue(0);
  const [measured, setMeasured] = useState(false);
  const measuredRef = useRef(false);
  const lastTarget = useRef(-1);

  useLayoutEffect(() => {
    const slot = slotRefs.current[idx];
    const outer = outerRef.current;
    if (!slot) return;
    let ctrl: { stop: () => void } | null = null;
    const apply = () => {
      const dpr = window.devicePixelRatio || 1;
      const h = Math.round(slot.getBoundingClientRect().height * dpr) / dpr;
      if (Math.abs(h - lastTarget.current) < 0.01) return;
      lastTarget.current = h;
      if (!measuredRef.current || reduced) {
        height.jump(h);
        measuredRef.current = true;
        setMeasured(true);
      } else {
        ctrl = animate(height, h, { type: 'spring', stiffness: stripSpring.stiffness, damping: stripSpring.damping, bounce: 0 });
      }
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(slot);
    if (outer) ro.observe(outer);
    return () => { ro.disconnect(); ctrl?.stop(); };
  }, [idx, reduced, stripSpring.stiffness, stripSpring.damping, height]);

  return (
    <div className={className} style={style}>
      <motion.div ref={outerRef} style={{ overflow: 'hidden', height: measured ? height : 'auto' }}>
        <motion.div
          initial={false}
          animate={{ x: `${-idx * 100}%` }}
          transition={reduced ? { duration: 0 } : { type: 'spring', ...stripSpring, bounce: 0 }}
          style={{ display: 'flex', alignItems: 'flex-start', margin: '0 -4px' }}
        >
          {items.map((child, i) => (
            <div
              key={child.props.value}
              ref={(el) => { slotRefs.current[i] = el; }}
              style={{ flex: '0 0 100%', minWidth: 0, padding: '0 4px', boxSizing: 'border-box' }}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export interface TabsContentProps {
  value: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function TabsContent({ value, className, style, children }: TabsContentProps) {
  const { baseId, active, reduced, blur } = useTabs();
  const isActive = active === value;
  const target = isActive || reduced ? 0 : blur;
  const blurMv = useMotionValue(target);
  const filter = useTransform(blurMv, (v) => (v > 0.01 ? `blur(${v}px)` : 'none'));

  useLayoutEffect(() => {
    if (reduced) { blurMv.jump(target); return; }
    const ctrl = animate(blurMv, target, { type: 'spring', stiffness: 200, damping: 25 });
    return () => ctrl.stop();
  }, [target, reduced, blurMv]);

  return (
    <motion.div
      role="tabpanel"
      id={panelId(baseId, value)}
      aria-labelledby={triggerId(baseId, value)}
      tabIndex={isActive ? 0 : -1}
      inert={!isActive}
      className={cx('outline-none', className)}
      style={{ outline: 'none', filter, ...style }}
    >
      {children}
    </motion.div>
  );
}

const AnimatedTabs = Object.assign(Tabs, {
  List: TabsList,
  Trigger: TabsTrigger,
  Contents: TabsContents,
  Content: TabsContent,
});

export { AnimatedTabs };
export default AnimatedTabs;
