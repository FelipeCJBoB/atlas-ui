// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  Children,
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  type RefObject,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { twMerge } from 'tailwind-merge';

export type LiquidButtonVariant = 'default' | 'destructive' | 'secondary' | 'ghost';
export type LiquidButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';
export type LiquidButtonScheme = 'light' | 'dark' | 'auto';

/** Tokens concretos (tema neutro). Podem ser sobrescritos via prop `palette`. */
export interface LiquidButtonPalette {
  rest: string; // fundo em repouso
  liquid: string; // cor do líquido
  text: string; // texto em repouso
  textFilled: string; // texto com líquido
  ring: string; // cor do anel de foco (borda)
  ringShadow: string; // sombra externa do anel (já com transparência)
}

const DESTRUCTIVE = '#e7000b';

const PALETTES: Record<'light' | 'dark', Record<LiquidButtonVariant, LiquidButtonPalette>> = {
  light: {
    default: { rest: '#f5f5f5', liquid: '#171717', text: '#171717', textFilled: '#fafafa', ring: '#a1a1a1', ringShadow: 'rgba(161, 161, 161, 0.5)' },
    // Correção: texto em repouso na cor destrutiva (branco sobre #f5f5f5 seria ilegível).
    destructive: { rest: '#f5f5f5', liquid: DESTRUCTIVE, text: DESTRUCTIVE, textFilled: '#ffffff', ring: '#a1a1a1', ringShadow: 'rgba(231, 0, 11, 0.2)' },
    // Correção: texto legível em repouso e líquido um tom acima do fundo para o efeito aparecer.
    secondary: { rest: '#f5f5f5', liquid: '#e5e5e5', text: '#171717', textFilled: '#171717', ring: '#a1a1a1', ringShadow: 'rgba(161, 161, 161, 0.5)' },
    ghost: { rest: 'transparent', liquid: '#171717', text: '#171717', textFilled: '#fafafa', ring: '#a1a1a1', ringShadow: 'rgba(161, 161, 161, 0.5)' },
  },
  dark: {
    default: { rest: '#262626', liquid: '#e5e5e5', text: '#e5e5e5', textFilled: '#171717', ring: '#737373', ringShadow: 'rgba(115, 115, 115, 0.5)' },
    destructive: { rest: '#262626', liquid: DESTRUCTIVE, text: '#ff6467', textFilled: '#ffffff', ring: '#737373', ringShadow: 'rgba(231, 0, 11, 0.4)' },
    secondary: { rest: '#262626', liquid: '#404040', text: '#fafafa', textFilled: '#fafafa', ring: '#737373', ringShadow: 'rgba(115, 115, 115, 0.5)' },
    ghost: { rest: 'transparent', liquid: '#e5e5e5', text: '#e5e5e5', textFilled: '#171717', ring: '#737373', ringShadow: 'rgba(115, 115, 115, 0.5)' },
  },
};

const INVALID_SHADOW = { light: 'rgba(231, 0, 11, 0.2)', dark: 'rgba(231, 0, 11, 0.4)' };

const BASE_CLASS =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[8px] border border-solid text-sm font-medium outline-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

const SIZE_CLASS: Record<LiquidButtonSize, string> = {
  default: 'h-9 px-4 py-2 has-[>svg]:px-3',
  sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
  lg: 'h-10 px-6 has-[>svg]:px-4',
  icon: 'size-9',
  'icon-sm': 'size-8',
  'icon-lg': 'size-10',
};

// Estrutura e tamanho também inline (fallback se o Tailwind não compilar estas classes).
const BASE_STYLE: CSSProperties = {
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
  cursor: 'pointer',
  userSelect: 'none',
  boxSizing: 'border-box',
};

const SIZE_STYLE: Record<LiquidButtonSize, CSSProperties> = {
  default: { height: 36, paddingInline: 16, paddingBlock: 8 },
  sm: { height: 32, paddingInline: 12, gap: 6 },
  lg: { height: 40, paddingInline: 24 },
  icon: { width: 36, height: 36, padding: 0 },
  'icon-sm': { width: 32, height: 32, padding: 0 },
  'icon-lg': { width: 40, height: 40, padding: 0 },
};

const SPRING = { type: 'spring', stiffness: 500, damping: 25 } as const;
const COLOR_TRANSITION = 'box-shadow 150ms ease, border-color 150ms ease, outline-color 150ms ease, fill 150ms ease, stroke 150ms ease';

export interface LiquidButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /** Duração-base de cada fase do líquido (também o atraso entre as fases). */
  duration?: string;
  /** Altura da faixa de líquido em repouso. */
  barHeight?: string;
  hoverScale?: number;
  tapScale?: number;
  /** Renderiza o único filho no lugar do <button>, mesclando classes, estilos e eventos. */
  asChild?: boolean;
  variant?: LiquidButtonVariant;
  size?: LiquidButtonSize;
  /** Tema dos tokens de cor; "auto" lê a classe dark/light do ancestral ou a preferência do sistema. */
  colorScheme?: LiquidButtonScheme;
  /** Sobrescreve tokens de cor da variante. */
  palette?: Partial<LiquidButtonPalette>;
  ref?: Ref<HTMLElement>;
}

/* ---------- padrão "como filho" ---------- */

type AnyProps = Record<string, unknown>;

function composeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const r of refs) {
      if (typeof r === 'function') r(node);
      else if (r && typeof r === 'object') (r as { current: T | null }).current = node;
    }
  };
}

const Slot = forwardRef<HTMLElement, AnyProps & { children?: unknown }>(function Slot({ children, ...slotProps }, ref) {
  const only = Children.only(children);
  if (!isValidElement(only)) return null;
  const child = only as ReactElement<AnyProps>;
  const childProps = child.props;
  const merged: AnyProps = { ...slotProps, ...childProps };
  for (const key of Object.keys(slotProps)) {
    const a = slotProps[key];
    const b = childProps[key];
    if (/^on[A-Z]/.test(key) && typeof a === 'function' && typeof b === 'function') {
      merged[key] = (...args: unknown[]) => {
        (b as (...x: unknown[]) => void)(...args);
        (a as (...x: unknown[]) => void)(...args);
      };
    }
  }
  merged.className = twMerge(slotProps.className as string, childProps.className as string);
  merged.style = { ...(slotProps.style as CSSProperties), ...(childProps.style as CSSProperties) };
  merged.ref = composeRefs(ref, childProps.ref as Ref<HTMLElement> | undefined);
  return cloneElement(child, merged);
});

const MotionSlot = motion.create(Slot);

/* ---------- tema automático ---------- */

function useResolvedScheme(scheme: LiquidButtonScheme, elRef: RefObject<HTMLElement | null>) {
  const [auto, setAuto] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    if (scheme !== 'auto') return;
    const el = elRef.current;
    if (!el) return;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const read = () => {
      const marked = el.closest('.dark, .light');
      setAuto((marked ? marked.classList.contains('dark') : !!mq?.matches) ? 'dark' : 'light');
    };
    read();
    const mo = new MutationObserver(read);
    for (let node = el.parentElement; node; node = node.parentElement) {
      mo.observe(node, { attributes: true, attributeFilter: ['class'] });
    }
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [scheme, elRef]);
  return scheme === 'auto' ? auto : scheme;
}

/* ---------- componente ---------- */

export function LiquidButton({
  duration = '0.3s',
  barHeight = '3px',
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  variant = 'default',
  size = 'default',
  colorScheme = 'auto',
  palette,
  className,
  style,
  disabled,
  children,
  ref,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  ...rest
}: LiquidButtonProps) {
  const innerRef = useRef<HTMLElement | null>(null);
  const scheme = useResolvedScheme(colorScheme, innerRef);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);

  const colors = { ...PALETTES[scheme][variant], ...palette };
  const invalid = rest['aria-invalid'] === true || rest['aria-invalid'] === 'true';

  // Desabilitado: solta estados presos.
  useEffect(() => {
    if (disabled) {
      setHovered(false);
      setPressed(false);
    }
  }, [disabled]);

  // Ativo = hover de ponteiro ou foco visível pelo teclado.
  const active = !disabled && (hovered || focusVisible);
  const T = reduced ? '0s' : duration;
  // O atraso de cada transição depende do estado: entrar = deslizar e depois subir; sair = descer e depois recuar.
  const delayX = active ? '0s' : T;
  const delayY = active ? T : '0s';

  const shadows = ['0 1px 2px 0 rgba(0, 0, 0, 0.05)'];
  if (focusVisible) shadows.push(`0 0 0 3px ${invalid ? INVALID_SHADOW[scheme] : colors.ringShadow}`);

  const liquidStyle: CSSProperties & Record<`--${string}`, string> = {
    ...BASE_STYLE,
    // Sem classe extra, o tamanho vem inline; com classe, as utilitárias (e a do usuário) mandam.
    ...(className ? null : SIZE_STYLE[size]),
    '--liquid-x': active ? '100%' : '200%',
    '--liquid-h': active ? '100%' : barHeight,
    backgroundColor: colors.rest,
    backgroundImage: `linear-gradient(${colors.liquid}, ${colors.liquid})`,
    backgroundRepeat: 'no-repeat',
    // Camada com o dobro da largura: 200% = fora à esquerda; 100% = cobrindo tudo.
    backgroundSize: '200% var(--liquid-h)',
    backgroundPosition: 'var(--liquid-x) 100%',
    color: active ? colors.textFilled : colors.text,
    borderColor: invalid ? DESTRUCTIVE : focusVisible ? colors.ring : 'transparent',
    boxShadow: shadows.join(', '),
    transition: [
      `background-position ${T} ease ${delayX}`,
      `background-size ${T} ease ${delayY}`,
      `color ${T} ease ${T}`,
      COLOR_TRANSITION,
    ].join(', '),
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' as const } : null),
    ...style,
  };

  const scale = reduced || disabled ? 1 : pressed ? tapScale : hovered ? hoverScale : 1;

  const handlers = {
    onPointerEnter: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(e);
      setHovered(true);
    },
    onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerLeave?.(e);
      setHovered(false);
      setPressed(false);
    },
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e);
      if (e.button === 0) setPressed(true);
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerUp?.(e);
      setPressed(false);
    },
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerCancel?.(e);
      setPressed(false);
    },
    onFocus: (e: FocusEvent<HTMLButtonElement>) => {
      onFocus?.(e);
      let visible = false;
      try {
        visible = e.currentTarget.matches(':focus-visible');
      } catch {
        visible = false;
      }
      setFocusVisible(visible);
    },
    onBlur: (e: FocusEvent<HTMLButtonElement>) => {
      onBlur?.(e);
      setFocusVisible(false);
      setPressed(false);
    },
    onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
      onKeyDown?.(e);
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) setPressed(true);
    },
    onKeyUp: (e: KeyboardEvent<HTMLButtonElement>) => {
      onKeyUp?.(e);
      if (e.key === ' ' || e.key === 'Enter') setPressed(false);
    },
  };

  const shared = {
    ...rest,
    ...handlers,
    ref: composeRefs(innerRef, ref),
    className: twMerge(BASE_CLASS, SIZE_CLASS[size], className),
    style: liquidStyle,
    initial: false as const,
    animate: { scale },
    transition: SPRING,
    'data-variant': variant,
    'data-size': size,
  };

  if (asChild) {
    return (
      <MotionSlot {...(shared as AnyProps)} aria-disabled={disabled || undefined}>
        {children}
      </MotionSlot>
    );
  }

  return (
    <motion.button type="button" disabled={disabled} {...(shared as AnyProps)}>
      {children}
    </motion.button>
  );
}

export default LiquidButton;
