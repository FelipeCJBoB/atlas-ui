// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';

export type IconBurstVariant = 'default' | 'accent' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type IconBurstSize = 'default' | 'xs' | 'sm' | 'lg';
export type IconBurstScheme = 'auto' | 'light' | 'dark';

/* ---------- tokens do tema neutro ---------- */

const TOKENS = {
  light: { bg: '#ffffff', fg: '#0a0a0a', primary: '#0a0a0a', primaryFg: '#fafafa', accent: '#f5f5f5', accentFg: '#171717', destructive: '#e7000b', border: '#e5e5e5', input: '#e5e5e5', ring: '#a1a1a1' },
  dark: { bg: '#0a0a0a', fg: '#fafafa', primary: '#fafafa', primaryFg: '#0a0a0a', accent: '#262626', accentFg: '#fafafa', destructive: '#ff6467', border: 'rgba(255,255,255,0.10)', input: 'rgba(255,255,255,0.15)', ring: '#737373' },
} as const;

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const SHADOW_XS = '0 1px 2px 0 rgb(0 0 0 / 0.05)';

function variantLook(scheme: 'light' | 'dark', v: IconBurstVariant, hover: boolean) {
  const t = TOKENS[scheme];
  const dark = scheme === 'dark';
  switch (v) {
    case 'accent':
      return { background: hover ? mix(t.accent, 90) : t.accent, color: t.accentFg, border: 'transparent', shadow: true };
    case 'destructive':
      return { background: hover ? mix(t.destructive, 90) : dark ? mix(t.destructive, 60) : t.destructive, color: '#ffffff', border: 'transparent', shadow: true };
    case 'outline':
      return {
        background: hover ? (dark ? 'rgba(255,255,255,0.075)' : t.accent) : dark ? 'rgba(255,255,255,0.045)' : t.bg,
        color: t.fg,
        border: dark ? t.input : t.border,
        shadow: true,
      };
    case 'secondary':
      return { background: hover ? mix(t.accent, 80) : t.accent, color: t.accentFg, border: 'transparent', shadow: true };
    case 'ghost':
      return { background: hover ? (dark ? mix(t.accent, 50) : t.accent) : 'transparent', color: 'inherit', border: 'transparent', shadow: false };
    case 'link':
      return { background: 'transparent', color: t.primary, border: 'transparent', shadow: false };
    default:
      return { background: hover ? mix(t.primary, 90) : t.primary, color: t.primaryFg, border: 'transparent', shadow: true };
  }
}

const SIZES: Record<IconBurstSize, { box: number; icon: number }> = {
  default: { box: 36, icon: 16 },
  xs: { box: 28, icon: 14 },
  sm: { box: 32, icon: 16 },
  lg: { box: 40, icon: 16 },
};

/* ---------- tema automático (classe dark/light do ancestral ou preferência do sistema) ---------- */

function useScheme(pref: IconBurstScheme, el: HTMLElement | null) {
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

/* ---------- componente ---------- */

export interface IconBurstButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /** Ícone exibido (alternativa a `children`). */
  icon?: ReactNode;
  variant?: IconBurstVariant;
  size?: IconBurstSize;
  colorScheme?: IconBurstScheme;
  /** Constantes da explosão. */
  particleCount?: number;
  particleRadius?: number;
  particleSpread?: number;
  particleDuration?: number;
  particleStagger?: number;
  particleSize?: number;
  particleColor?: string;
  hoverScale?: number;
  tapScale?: number;
  ref?: Ref<HTMLButtonElement>;
}

const SPRING = { type: 'spring', stiffness: 550, damping: 30, mass: 1 } as const;

export function IconBurstButton({
  icon,
  children,
  variant = 'default',
  size = 'default',
  colorScheme = 'auto',
  particleCount = 6,
  particleRadius = 30,
  particleSpread = 360,
  particleDuration = 0.8,
  particleStagger = 0.05,
  particleSize = 4,
  particleColor = '#737373',
  hoverScale = 1.05,
  tapScale = 0.95,
  disabled,
  className,
  style,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ref,
  ...rest
}: IconBurstButtonProps) {
  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const scheme = useScheme(colorScheme, el);
  const reduced = useReducedMotion();
  const [hover, setHover] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [burst, setBurst] = useState(0);
  const userRef = useRef(ref);
  userRef.current = ref;

  const setRefs = useCallback((node: HTMLButtonElement | null) => {
    setEl(node);
    const r = userRef.current;
    if (typeof r === 'function') r(node);
    else if (r) (r as { current: HTMLButtonElement | null }).current = node;
  }, []);

  const look = variantLook(scheme, variant, hover && !disabled);
  const dims = SIZES[size];
  const ring = TOKENS[scheme].ring;
  const shadows: string[] = [];
  if (look.shadow) shadows.push(SHADOW_XS);
  if (focusVisible) shadows.push(`0 0 0 3px ${mix(ring, 50)}`);

  const btnStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: dims.box,
    height: dims.box,
    padding: 0,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: focusVisible ? ring : look.border,
    background: look.background,
    color: look.color,
    boxShadow: shadows.join(', ') || 'none',
    outline: 'none',
    overflow: 'visible',
    cursor: disabled ? 'default' : 'pointer',
    boxSizing: 'border-box',
    textDecoration: variant === 'link' && hover ? 'underline' : 'none',
    transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : null),
    ...style,
  };

  // Passo angular: abertura completa (360°) distribui em 360/N para não sobrepor a primeira e a última.
  const full = particleSpread >= 360;
  const step = particleCount > 1 ? particleSpread / (full ? particleCount : particleCount - 1) : 0;

  const scale = reduced || disabled ? undefined : { hover: hoverScale, tap: tapScale };

  return (
    <motion.button
      type="button"
      {...rest}
      ref={setRefs}
      disabled={disabled}
      className={className}
      style={btnStyle}
      whileHover={scale ? { scale: scale.hover } : undefined}
      whileTap={scale ? { scale: scale.tap } : undefined}
      transition={SPRING}
      data-variant={variant}
      data-size={size}
      onPointerEnter={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e);
        setHover(true);
      }}
      onPointerLeave={(e: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(e);
        setHover(false);
      }}
      onFocus={(e: FocusEvent<HTMLButtonElement>) => {
        onFocus?.(e);
        let v = false;
        try {
          v = e.currentTarget.matches(':focus-visible');
        } catch {
          v = false;
        }
        setFocusVisible(v);
      }}
      onBlur={(e: FocusEvent<HTMLButtonElement>) => {
        onBlur?.(e);
        setFocusVisible(false);
      }}
      onClick={(e: MouseEvent<HTMLButtonElement>) => {
        // Reinicia a explosão (nova chave remonta as partículas) e depois repassa o clique.
        if (!reduced) setBurst((b) => b + 1);
        onClick?.(e);
      }}
    >
      <span
        aria-hidden="true"
        style={{ display: 'inline-flex', width: dims.icon, height: dims.icon, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}
        className="[&>svg]:h-full [&>svg]:w-full"
      >
        {icon ?? children}
      </span>
      {burst > 0 && (
        <span key={burst} aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {Array.from({ length: particleCount }, (_, i) => {
            const a = (i * step * Math.PI) / 180; // 0° à direita, sentido horário (y para baixo)
            return (
              <motion.span
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: particleSize,
                  height: particleSize,
                  marginLeft: -particleSize / 2,
                  marginTop: -particleSize / 2,
                  borderRadius: '9999px',
                  background: particleColor,
                  pointerEvents: 'none',
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: Math.cos(a) * particleRadius, y: Math.sin(a) * particleRadius, scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: particleDuration, ease: 'easeOut', delay: i * particleStagger }}
              />
            );
          })}
        </span>
      )}
    </motion.button>
  );
}

export default IconBurstButton;
