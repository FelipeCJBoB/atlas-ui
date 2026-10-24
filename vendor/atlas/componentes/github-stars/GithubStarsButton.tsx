// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type Ref,
} from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useSpring, useTransform, type MotionValue } from 'motion/react';

export type GithubStarsVariant = 'default' | 'accent' | 'outline' | 'ghost';
export type GithubStarsSize = 'default' | 'sm' | 'lg';
export type GithubStarsScheme = 'auto' | 'light' | 'dark';

/* ---------- tokens do tema neutro ---------- */

const TOKENS = {
  light: { bg: '#ffffff', fg: '#0a0a0a', primary: '#0a0a0a', primaryFg: '#fafafa', accent: '#f5f5f5', accentFg: '#171717', border: '#e5e5e5', input: '#e5e5e5', ring: '#a1a1a1' },
  dark: { bg: '#0a0a0a', fg: '#fafafa', primary: '#fafafa', primaryFg: '#0a0a0a', accent: '#262626', accentFg: '#fafafa', border: 'rgba(255,255,255,0.10)', input: 'rgba(255,255,255,0.15)', ring: '#737373' },
} as const;

const YELLOW = '#f0b100';
const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const SHADOW_XS = '0 1px 2px 0 rgb(0 0 0 / 0.05)';

function variantLook(scheme: 'light' | 'dark', v: GithubStarsVariant, hover: boolean) {
  const t = TOKENS[scheme];
  const dark = scheme === 'dark';
  // Cinza da estrela-base: padrão contrasta com o fundo primário; as demais, com o fundo claro/escuro.
  const starOnPrimary = dark ? '#d4d4d4' : '#404040';
  const starOther = dark ? '#404040' : '#d4d4d4';
  switch (v) {
    case 'accent':
      return { background: hover ? mix(t.accent, 90) : t.accent, color: t.accentFg, border: 'transparent', shadow: true, star: starOther };
    case 'outline':
      return {
        background: hover ? (dark ? 'rgba(255,255,255,0.075)' : t.accent) : dark ? 'rgba(255,255,255,0.045)' : t.bg,
        color: t.fg,
        border: dark ? t.input : t.border,
        shadow: true,
        star: starOther,
      };
    case 'ghost':
      return { background: hover ? (dark ? mix(t.accent, 50) : t.accent) : 'transparent', color: 'inherit', border: 'transparent', shadow: false, star: starOther };
    default:
      return { background: hover ? mix(t.primary, 90) : t.primary, color: t.primaryFg, border: 'transparent', shadow: true, star: starOnPrimary };
  }
}

const SIZE_STYLE: Record<GithubStarsSize, CSSProperties> = {
  default: { height: 36, paddingInline: 16, paddingBlock: 8, gap: 8 },
  sm: { height: 32, paddingInline: 12, gap: 6 },
  lg: { height: 40, paddingInline: 24, gap: 8 },
};

/* ---------- tema automático ---------- */

function useScheme(pref: GithubStarsScheme, el: HTMLElement | null) {
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

/* ---------- ícones (SVG próprios) ---------- */

// Logotipo simplificado: disco cheio com a silhueta de um gato recortada (regra evenodd).
function GithubMark() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" aria-hidden="true" focusable="false" style={{ flexShrink: 0, display: 'block' }}>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 1a11 11 0 1 0 0 22a11 11 0 1 0 0-22z M7.3 5.6 L9.6 7.7 Q12 7.1 14.4 7.7 L16.7 5.6 Q17.5 7.9 17.1 9.9 Q18.2 11.2 18.2 13 Q18.2 16.6 14.2 17.3 Q14.6 18 14.6 19 L14.6 21.6 Q12 22.3 9.4 21.6 L9.4 19.6 Q7 20.1 6 18 Q7.4 18.3 8 19 Q8.8 19.3 9.4 18.9 L9.4 17.3 Q5.8 16.6 5.8 13 Q5.8 11.2 6.9 9.9 Q6.5 7.9 7.3 5.6 Z"
      />
    </svg>
  );
}

const STAR_PATH =
  'M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z';

function StarIcon({ color, style }: { color: string; style?: CSSProperties }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', ...style }}
    >
      <path d={STAR_PATH} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- contador em colunas (odômetro) ---------- */

const DIGIT_SPRING = { stiffness: 200, damping: 20, mass: 0.4 };

function DigitGlyph({ mv, n }: { mv: MotionValue<number>; n: number }) {
  // Algarismos em círculo: deslocamento relativo ao valor contínuo, sempre em (-5, 5].
  const y = useTransform(mv, (v) => {
    let o = (((n - v) % 10) + 10) % 10;
    if (o > 5) o -= 10;
    return `${o}em`;
  });
  return (
    <motion.span style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '1em', textAlign: 'center', y }}>{n}</motion.span>
  );
}

function DigitColumn({ digit, instant }: { digit: number; instant: boolean }) {
  const mv = useSpring(digit, DIGIT_SPRING);
  const target = useRef(digit);
  useEffect(() => {
    const cur = target.current;
    const curMod = ((cur % 10) + 10) % 10;
    let d = (digit - curMod + 10) % 10;
    if (d > 5) d -= 10; // caminho mais curto (9 → 0 = um passo à frente)
    target.current = cur + d;
    if (instant) mv.jump(target.current);
    else mv.set(target.current);
  }, [digit, instant, mv]);
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: '1ch', height: '1em', lineHeight: 1, overflow: 'hidden' }}>
      {Array.from({ length: 10 }, (_, n) => (
        <DigitGlyph key={n} mv={mv} n={n} />
      ))}
    </span>
  );
}

/* ---------- componente ---------- */

type SharedAttrs = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> &
  Pick<AnchorHTMLAttributes<HTMLAnchorElement>, 'target' | 'rel'>;

export interface GithubStarsButtonProps extends SharedAttrs {
  /** Total de estrelas (sem rede: sempre fornecido). */
  value: number;
  /** Usuário e repositório: com ambos, o componente vira link para o repositório. */
  username?: string;
  repo?: string;
  /** Atraso antes de iniciar a contagem (ms). */
  delay?: number;
  /** Só inicia quando visível na tela. */
  inView?: boolean;
  inViewMargin?: string;
  inViewOnce?: boolean;
  variant?: GithubStarsVariant;
  size?: GithubStarsSize;
  colorScheme?: GithubStarsScheme;
  hoverScale?: number;
  tapScale?: number;
  ref?: Ref<HTMLElement>;
}

const COUNT_SPRING = { stiffness: 90, damping: 50, mass: 1 };
const PRESS_SPRING = { type: 'spring', stiffness: 550, damping: 30 } as const;
const PARTICLES = 6;
const PARTICLE_STEP = 72; // graus, conforme a especificação
const PARTICLE_RADIUS = 30;

export function GithubStarsButton({
  value,
  username,
  repo,
  delay = 0,
  inView = false,
  inViewMargin = '0px',
  inViewOnce = true,
  variant = 'default',
  size = 'default',
  colorScheme = 'auto',
  hoverScale = 1.05,
  tapScale = 0.95,
  disabled,
  className,
  style,
  target,
  rel,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  ref,
  ...rest
}: GithubStarsButtonProps) {
  const total = Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
  const [el, setEl] = useState<HTMLElement | null>(null);
  const scheme = useScheme(colorScheme, el);
  const reduced = !!useReducedMotion();
  const [hover, setHover] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [visible, setVisible] = useState(!inView);
  const [started, setStarted] = useState(false);
  const [shown, setShown] = useState(0);
  const userRef = useRef(ref);
  userRef.current = ref;

  const setRefs = useCallback((node: HTMLElement | null) => {
    setEl(node);
    const r = userRef.current;
    if (typeof r === 'function') r(node);
    else if (r) (r as { current: HTMLElement | null }).current = node;
  }, []);

  // Visibilidade opcional na tela.
  useEffect(() => {
    if (!inView) {
      setVisible(true);
      return;
    }
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (inViewOnce) io.disconnect();
        } else if (!inViewOnce) setVisible(false);
      },
      { rootMargin: inViewMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [inView, inViewMargin, inViewOnce, el]);

  // Atraso antes de iniciar.
  useEffect(() => {
    if (!visible) return;
    if (delay <= 0) {
      setStarted(true);
      return;
    }
    const id = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(id);
  }, [visible, delay]);

  const count = useSpring(0, COUNT_SPRING);
  useMotionValueEvent(count, 'change', (v) => setShown(Math.round(v)));

  useEffect(() => {
    if (!started) return;
    if (reduced) {
      count.jump(total);
      setShown(total);
    } else count.set(total);
  }, [started, total, reduced, count]);

  // Total zero: estrela vazia e sem explosão.
  const done = started && total > 0 && shown >= total;
  const progress = total > 0 ? Math.min(100, (shown / total) * 100) : 0;
  const fill = total <= 0 ? 0 : done ? 100 : Math.max(0, progress - 10);

  const digits = String(total).length;
  const text = String(Math.min(shown, total)).padStart(digits, '0');

  const look = variantLook(scheme, variant, hover && !disabled);
  const ring = TOKENS[scheme].ring;
  const shadows: string[] = [];
  if (look.shadow) shadows.push(SHADOW_XS);
  if (focusVisible) shadows.push(`0 0 0 3px ${mix(ring, 50)}`);

  const boxStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontSize: 14,
    lineHeight: '20px',
    fontWeight: 500,
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
    userSelect: 'none',
    boxSizing: 'border-box',
    textDecoration: 'none',
    transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    ...SIZE_STYLE[size],
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' as const } : null),
    ...style,
  };

  const label = rest['aria-label'] ?? `${total.toLocaleString('pt-BR')} estrelas no GitHub${username && repo ? ` (${username}/${repo})` : ''}`;
  const anim = reduced || disabled ? {} : { whileHover: { scale: hoverScale }, whileTap: { scale: tapScale } };

  const content = (
    <>
      <GithubMark />
      <span aria-hidden="true" style={{ display: 'inline-flex', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {Array.from(text, (ch, i) => (
          <DigitColumn key={i} digit={Number(ch)} instant={reduced} />
        ))}
      </span>
      <span aria-hidden="true" style={{ position: 'relative', display: 'inline-block', width: 18, height: 18, flexShrink: 0 }}>
        <StarIcon color={look.star} />
        <StarIcon
          color={YELLOW}
          style={{ position: 'absolute', inset: 0, clipPath: `inset(${100 - fill}% 0 0 0)` }}
        />
        {done && !reduced &&
          Array.from({ length: PARTICLES }, (_, i) => {
            const a = (i * PARTICLE_STEP * Math.PI) / 180; // 0° à direita, sentido horário
            return (
              <motion.span
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: 4,
                  height: 4,
                  marginLeft: -2,
                  marginTop: -2,
                  borderRadius: '9999px',
                  background: YELLOW,
                  pointerEvents: 'none',
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{ x: Math.cos(a) * PARTICLE_RADIUS, y: Math.sin(a) * PARTICLE_RADIUS, scale: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
              />
            );
          })}
      </span>
    </>
  );

  const handlers = {
    onPointerEnter: (e: PointerEvent<HTMLElement>) => {
      (onPointerEnter as ((ev: PointerEvent<HTMLElement>) => void) | undefined)?.(e);
      setHover(true);
    },
    onPointerLeave: (e: PointerEvent<HTMLElement>) => {
      (onPointerLeave as ((ev: PointerEvent<HTMLElement>) => void) | undefined)?.(e);
      setHover(false);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      (onFocus as ((ev: FocusEvent<HTMLElement>) => void) | undefined)?.(e);
      let v = false;
      try {
        v = e.currentTarget.matches(':focus-visible');
      } catch {
        v = false;
      }
      setFocusVisible(v);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      (onBlur as ((ev: FocusEvent<HTMLElement>) => void) | undefined)?.(e);
      setFocusVisible(false);
    },
  };

  const common = {
    ...(rest as Record<string, unknown>),
    ...handlers,
    ...anim,
    ref: setRefs,
    className,
    style: boxStyle,
    transition: PRESS_SPRING,
    'aria-label': label,
    'data-variant': variant,
    'data-size': size,
  };

  if (username && repo) {
    return (
      <motion.a
        {...common}
        href={`https://github.com/${encodeURIComponent(username)}/${encodeURIComponent(repo)}`}
        target={target ?? '_blank'}
        rel={rel ?? 'noopener noreferrer'}
        aria-disabled={disabled || undefined}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button type="button" disabled={disabled} {...common}>
      {content}
    </motion.button>
  );
}

export default GithubStarsButton;
