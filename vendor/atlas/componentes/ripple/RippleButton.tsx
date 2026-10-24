// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Children,
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
} from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';

export type RippleVariant = 'default' | 'accent' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type RippleSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
export type RippleScheme = 'auto' | 'light' | 'dark';

/* ---------- tokens do tema neutro ---------- */

const TOKENS = {
  light: { bg: '#ffffff', fg: '#0a0a0a', primary: '#0a0a0a', primaryFg: '#fafafa', accent: '#f5f5f5', accentFg: '#171717', destructive: '#e7000b', border: '#e5e5e5', input: '#e5e5e5', ring: '#a1a1a1' },
  dark: { bg: '#0a0a0a', fg: '#fafafa', primary: '#fafafa', primaryFg: '#0a0a0a', accent: '#262626', accentFg: '#fafafa', destructive: '#ff6467', border: 'rgba(255,255,255,0.10)', input: 'rgba(255,255,255,0.15)', ring: '#737373' },
} as const;

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const SHADOW_XS = '0 1px 2px 0 rgb(0 0 0 / 0.05)';

function variantLook(scheme: 'light' | 'dark', v: RippleVariant, hover: boolean) {
  const t = TOKENS[scheme];
  const dark = scheme === 'dark';
  switch (v) {
    case 'accent':
      return { background: hover ? mix(t.accent, 90) : t.accent, color: t.accentFg, border: 'transparent', shadow: true, ripple: t.accentFg };
    case 'destructive':
      return { background: hover ? mix(t.destructive, 90) : dark ? mix(t.destructive, 60) : t.destructive, color: '#ffffff', border: 'transparent', shadow: true, ripple: '#fafafa' };
    case 'outline':
      return {
        background: hover ? (dark ? 'rgba(255,255,255,0.075)' : t.accent) : dark ? 'rgba(255,255,255,0.045)' : t.bg,
        color: t.fg,
        border: dark ? t.input : t.border,
        shadow: true,
        ripple: t.fg,
      };
    case 'secondary':
      return { background: hover ? mix(t.accent, 80) : t.accent, color: t.accentFg, border: 'transparent', shadow: true, ripple: t.accentFg };
    case 'ghost':
      return { background: hover ? (dark ? mix(t.accent, 50) : t.accent) : 'transparent', color: 'inherit', border: 'transparent', shadow: false, ripple: t.fg };
    case 'link':
      // Correção: a onda usa a cor do texto (em "texto sobre primária" ficaria invisível no tema claro).
      return { background: 'transparent', color: t.primary, border: 'transparent', shadow: false, ripple: t.fg };
    default:
      return { background: hover ? mix(t.primary, 90) : t.primary, color: t.primaryFg, border: 'transparent', shadow: true, ripple: t.primaryFg };
  }
}

const SIZE_STYLE: Record<RippleSize, { base: CSSProperties; withIcon?: CSSProperties }> = {
  default: { base: { height: 36, paddingInline: 16, paddingBlock: 8 }, withIcon: { paddingInline: 12 } },
  sm: { base: { height: 32, paddingInline: 12, gap: 6 }, withIcon: { paddingInline: 10 } },
  lg: { base: { height: 40, paddingInline: 24 }, withIcon: { paddingInline: 16 } },
  icon: { base: { width: 36, height: 36, padding: 0 } },
  'icon-sm': { base: { width: 32, height: 32, padding: 0 } },
  'icon-lg': { base: { width: 40, height: 40, padding: 0 } },
};

/* ---------- tema automático ---------- */

function useScheme(pref: RippleScheme, el: HTMLElement | null) {
  const [auto, setAuto] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (pref !== 'auto' || !el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.parentElement?.closest('.dark, .light');
      setAuto((marked ? marked.classList.contains('dark') : !!mq?.matches) ? 'dark' : 'light');
    };
    read();
    const mo = new MutationObserver(read);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [pref, el]);
  return pref === 'auto' ? auto : pref;
}

/* ---------- padrão "como filho" ---------- */

type AnyProps = Record<string, unknown>;

const Slot = forwardRef<HTMLElement, AnyProps & { children?: unknown }>(function Slot({ children, ...slotProps }, ref) {
  const only = Children.only(children);
  if (!isValidElement(only)) return null;
  const child = only as ReactElement<AnyProps>;
  const cp = child.props;
  const merged: AnyProps = { ...slotProps, ...cp };
  for (const key of Object.keys(slotProps)) {
    const a = slotProps[key];
    const b = cp[key];
    if (/^on[A-Z]/.test(key) && typeof a === 'function' && typeof b === 'function') {
      merged[key] = (...args: unknown[]) => {
        (b as (...x: unknown[]) => void)(...args);
        (a as (...x: unknown[]) => void)(...args);
      };
    }
  }
  merged.className = [slotProps.className, cp.className].filter(Boolean).join(' ') || undefined;
  merged.style = { ...(slotProps.style as CSSProperties), ...(cp.style as CSSProperties) };
  const childRef = cp.ref as Ref<HTMLElement> | undefined;
  merged.ref = (node: HTMLElement | null) => {
    for (const r of [ref, childRef]) {
      if (typeof r === 'function') r(node);
      else if (r) (r as { current: HTMLElement | null }).current = node;
    }
  };
  return cloneElement(child, merged);
});

const MotionSlot = motion.create(Slot);

/* ---------- contexto das ondas ---------- */

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface RippleCtxValue {
  ripples: Ripple[];
  scale: number;
  transition: Transition;
}

const RippleCtx = createContext<RippleCtxValue | null>(null);

/* ---------- botão ---------- */

export interface RippleButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: RippleVariant;
  size?: RippleSize;
  colorScheme?: RippleScheme;
  hoverScale?: number;
  tapScale?: number;
  /** Cor da onda; por padrão, a cor definida pela variante. */
  rippleColor?: string;
  /** Escala final da onda (20 px × escala). */
  rippleScale?: number;
  /** Transição da onda; a duração também define quando ela é removida. */
  rippleTransition?: { duration?: number; ease?: Transition['ease'] };
  asChild?: boolean;
  ref?: Ref<HTMLElement>;
}

const SPRING = { type: 'spring', stiffness: 550, damping: 30, mass: 1 } as const;

export function RippleButton({
  variant = 'default',
  size = 'default',
  colorScheme = 'auto',
  hoverScale = 1.05,
  tapScale = 0.95,
  rippleColor,
  rippleScale = 10,
  rippleTransition,
  asChild = false,
  disabled,
  className,
  style,
  children,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ref,
  ...rest
}: RippleButtonProps) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const scheme = useScheme(colorScheme, el);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [hasIcon, setHasIcon] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const userRef = useRef(ref);
  userRef.current = ref;

  const duration = rippleTransition?.duration ?? 0.6;
  const transition: Transition = { duration, ease: rippleTransition?.ease ?? 'easeOut' };

  const setRefs = useCallback((node: HTMLElement | null) => {
    setEl(node);
    const r = userRef.current;
    if (typeof r === 'function') r(node);
    else if (r) (r as { current: HTMLElement | null }).current = node;
  }, []);

  // Cancela os temporizadores pendentes no desmonte.
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);

  // Padding menor quando há um ícone como filho direto (equivale ao has-[>svg]).
  useLayoutEffect(() => {
    if (!el) return;
    let found = false;
    for (const c of Array.from(el.children)) if (c.tagName.toLowerCase() === 'svg') found = true;
    setHasIcon(found);
  });

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (!reduced) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Clique por teclado (detail 0) chega sem coordenadas: centraliza a onda.
      const keyboard = e.detail === 0 || (e.clientX === 0 && e.clientY === 0);
      const x = keyboard ? rect.width / 2 : e.clientX - rect.left;
      const y = keyboard ? rect.height / 2 : e.clientY - rect.top;
      const id = nextId.current++;
      setRipples((list) => [...list, { id, x, y }]);
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        setRipples((list) => list.filter((r) => r.id !== id));
      }, duration * 1000);
      timers.current.add(timer);
    }
    (onClick as ((ev: MouseEvent<HTMLElement>) => void) | undefined)?.(e);
  };

  const invalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true';
  const look = variantLook(scheme, variant, hover && !disabled);
  const t = TOKENS[scheme];
  const shadows: string[] = [];
  if (look.shadow) shadows.push(SHADOW_XS);
  if (focusVisible) shadows.push(`0 0 0 3px ${invalid ? mix(t.destructive, scheme === 'dark' ? 40 : 20) : mix(t.ring, 50)}`);
  else if (invalid) shadows.push(`0 0 0 3px ${mix(t.destructive, scheme === 'dark' ? 40 : 20)}`);

  const sz = SIZE_STYLE[size];
  const btnStyle: CSSProperties & Record<'--ripple-color', string> = {
    '--ripple-color': rippleColor ?? look.ripple,
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: invalid ? t.destructive : focusVisible ? t.ring : look.border,
    background: look.background,
    color: look.color,
    boxShadow: shadows.join(', ') || 'none',
    outline: 'none',
    cursor: disabled ? 'default' : 'pointer',
    userSelect: 'none',
    boxSizing: 'border-box',
    textDecoration: variant === 'link' && hover ? 'underline' : 'none',
    textUnderlineOffset: 4,
    transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    ...sz.base,
    ...(hasIcon ? sz.withIcon : null),
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' as const } : null),
    ...style,
  };

  const anim = reduced || disabled ? {} : { whileHover: { scale: hoverScale }, whileTap: { scale: tapScale } };

  const shared: AnyProps = {
    ...rest,
    ...anim,
    ref: setRefs,
    className,
    style: btnStyle,
    transition: SPRING,
    'data-variant': variant,
    'data-size': size,
    onClick: handleClick,
    onPointerEnter: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(e);
      setHover(true);
    },
    onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      setHover(false);
    },
    onFocus: (e: FocusEvent<HTMLButtonElement>) => {
      onFocus?.(e);
      let v = false;
      try {
        v = e.currentTarget.matches(':focus-visible');
      } catch {
        v = false;
      }
      setFocusVisible(v);
    },
    onBlur: (e: FocusEvent<HTMLButtonElement>) => {
      onBlur?.(e);
      setFocusVisible(false);
    },
  };

  return (
    <RippleCtx.Provider value={{ ripples, scale: rippleScale, transition }}>
      {asChild ? (
        <MotionSlot {...shared} aria-disabled={disabled || undefined}>
          {children}
        </MotionSlot>
      ) : (
        <motion.button type="button" disabled={disabled} {...shared}>
          {children}
        </motion.button>
      )}
    </RippleCtx.Provider>
  );
}

/* ---------- camada de ondas (colocar dentro do botão, depois do conteúdo) ---------- */

export interface RippleButtonRipplesProps {
  className?: string;
  style?: CSSProperties;
}

export function RippleButtonRipples({ className, style }: RippleButtonRipplesProps) {
  const ctx = useContext(RippleCtx);
  if (!ctx) return null;
  return (
    <>
      {ctx.ripples.map((r) => (
        <motion.span
          key={r.id}
          aria-hidden="true"
          className={className}
          style={{
            position: 'absolute',
            left: r.x - 10,
            top: r.y - 10,
            width: 20,
            height: 20,
            borderRadius: '9999px',
            background: 'var(--ripple-color)',
            pointerEvents: 'none',
            ...style,
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: ctx.scale, opacity: 0 }}
          transition={ctx.transition}
        />
      ))}
    </>
  );
}

RippleButton.Ripples = RippleButtonRipples;

export default RippleButton;
