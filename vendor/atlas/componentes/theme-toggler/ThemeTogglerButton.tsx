// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type FocusEvent,
  type MouseEvent,
  type PointerEvent,
  type Ref,
  type RefObject,
} from 'react';
import { flushSync } from 'react-dom';
import { Monitor, Moon, Sun } from 'lucide-react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type RevealDirection = 'ltr' | 'rtl' | 'ttb' | 'btt';
export type ThemeTogglerVariant = 'default' | 'accent' | 'outline' | 'ghost';
export type ThemeTogglerSize = 'default' | 'xs' | 'sm' | 'lg';

/* ---------- tokens do tema neutro ---------- */

const TOKENS = {
  light: { bg: '#ffffff', fg: '#0a0a0a', primary: '#0a0a0a', primaryFg: '#fafafa', accent: '#f5f5f5', accentFg: '#171717', border: '#e5e5e5', input: '#e5e5e5', ring: '#a1a1a1' },
  dark: { bg: '#0a0a0a', fg: '#fafafa', primary: '#fafafa', primaryFg: '#0a0a0a', accent: '#262626', accentFg: '#fafafa', border: 'rgba(255,255,255,0.10)', input: 'rgba(255,255,255,0.15)', ring: '#737373' },
} as const;

const mix = (c: string, pct: number) => `color-mix(in srgb, ${c} ${pct}%, transparent)`;
const SHADOW_XS = '0 1px 2px 0 rgb(0 0 0 / 0.05)';

function variantLook(scheme: ResolvedTheme, v: ThemeTogglerVariant, hover: boolean) {
  const t = TOKENS[scheme];
  const dark = scheme === 'dark';
  switch (v) {
    case 'accent':
      return { background: hover ? mix(t.accent, 90) : t.accent, color: t.accentFg, border: 'transparent', shadow: true };
    case 'outline':
      return {
        background: hover ? (dark ? 'rgba(255,255,255,0.075)' : t.accent) : dark ? 'rgba(255,255,255,0.045)' : t.bg,
        color: t.fg,
        border: dark ? t.input : t.border,
        shadow: true,
      };
    case 'ghost':
      return { background: hover ? (dark ? mix(t.accent, 50) : t.accent) : 'transparent', color: 'inherit', border: 'transparent', shadow: false };
    default:
      return { background: hover ? mix(t.primary, 90) : t.primary, color: t.primaryFg, border: 'transparent', shadow: true };
  }
}

const SIZES: Record<ThemeTogglerSize, { box: number; icon: number }> = {
  default: { box: 36, icon: 16 },
  xs: { box: 28, icon: 14 },
  sm: { box: 32, icon: 16 },
  lg: { box: 40, icon: 16 },
};

// Recorte inicial (imagem nova escondida) por direção; o final é sempre inset(0).
const CLIP_FROM: Record<RevealDirection, string> = {
  ltr: 'inset(0 100% 0 0)',
  rtl: 'inset(0 0 0 100%)',
  ttb: 'inset(0 0 100% 0)',
  btt: 'inset(100% 0 0 0)',
};

const LABEL: Record<ThemeMode, string> = { light: 'claro', dark: 'escuro', system: 'do sistema' };

/* ---------- utilidades ---------- */

const canUseDOM = typeof window !== 'undefined' && typeof document !== 'undefined';

function systemDark() {
  return canUseDOM && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

function resolveMode(m: ThemeMode): ResolvedTheme {
  return m === 'system' ? (systemDark() ? 'dark' : 'light') : m;
}

function useSystemDark() {
  const [dark, setDark] = useState(false); // padrão seguro antes de conhecer o sistema
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const read = () => setDark(mq.matches);
    read();
    mq.addEventListener?.('change', read);
    return () => mq.removeEventListener?.('change', read);
  }, []);
  return dark;
}

function applyThemeClass(el: HTMLElement | null, theme: ResolvedTheme) {
  if (!el) return;
  el.classList.toggle('dark', theme === 'dark');
  el.classList.toggle('light', theme === 'light');
}

// Regra global que desliga as animações padrão das imagens da transição (cortina nítida).
const VT_STYLE_ID = 'atlas-theme-toggler-vt';
let vtStyleUsers = 0;
function retainVtStyle() {
  vtStyleUsers++;
  if (document.getElementById(VT_STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = VT_STYLE_ID;
  s.textContent =
    '::view-transition-old(root),::view-transition-new(root){animation:none;mix-blend-mode:normal;}';
  document.head.appendChild(s);
}
function releaseVtStyle() {
  vtStyleUsers = Math.max(0, vtStyleUsers - 1);
  if (vtStyleUsers === 0) document.getElementById(VT_STYLE_ID)?.remove();
}

type ViewTransitionLike = { ready: Promise<void>; finished: Promise<void>; skipTransition?: () => void };
type DocWithVT = Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };

/* ---------- armazenamento de tema padrão (estado local + localStorage + sistema) ---------- */

function readStored(key: string): ThemeMode {
  if (!canUseDOM) return 'system';
  try {
    const v = window.localStorage.getItem(key);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    /* armazenamento indisponível */
  }
  return 'system';
}

function useLocalThemeStore(key: string) {
  const [theme, setMode] = useState<ThemeMode>(() => readStored(key));
  const sysDark = useSystemDark();
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (sysDark ? 'dark' : 'light') : theme;
  const setTheme = useCallback(
    (m: ThemeMode) => {
      setMode(m);
      try {
        window.localStorage.setItem(key, m);
      } catch {
        /* ignora */
      }
    },
    [key],
  );
  return { theme, resolvedTheme, setTheme };
}

/* ---------- tema do próprio botão (classe do ancestral) ---------- */

function useButtonScheme(el: HTMLElement | null) {
  const [scheme, setScheme] = useState<ResolvedTheme>('light');
  const read = useCallback(() => {
    if (!el) return;
    const marked = el.parentElement?.closest('.dark, .light');
    setScheme((marked ? marked.classList.contains('dark') : systemDark()) ? 'dark' : 'light');
  }, [el]);
  useEffect(() => {
    if (!el) return;
    read();
    const mo = new MutationObserver(read);
    for (let n = el.parentElement; n; n = n.parentElement) mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    mq?.addEventListener?.('change', read);
    return () => {
      mo.disconnect();
      mq?.removeEventListener?.('change', read);
    };
  }, [el, read]);
  return [scheme, read] as const;
}

/* ---------- componente ---------- */

export interface ThemeTogglerButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  /** Ordem do ciclo de modos. */
  modes?: ThemeMode[];
  direction?: RevealDirection;
  /** Aviso imediato da troca (antes da cortina). */
  onImmediateChange?: (mode: ThemeMode) => void;
  variant?: ThemeTogglerVariant;
  size?: ThemeTogglerSize;
  /** Armazenamento externo de tema: informe os três para controlar de fora. */
  theme?: ThemeMode;
  resolvedTheme?: ResolvedTheme;
  setTheme?: (mode: ThemeMode) => void;
  /** Elemento que recebe a classe dark/light (padrão: raiz do documento). */
  target?: HTMLElement | null | RefObject<HTMLElement | null>;
  /** Chave do armazenamento local (só no armazenamento padrão). */
  storageKey?: string;
  duration?: number;
  easing?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function ThemeTogglerButton({
  modes = ['light', 'dark', 'system'],
  direction = 'ltr',
  onImmediateChange,
  variant = 'default',
  size = 'default',
  theme: extTheme,
  resolvedTheme: extResolved,
  setTheme: extSetTheme,
  target,
  storageKey = 'theme',
  duration = 700,
  easing = 'ease-in-out',
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
}: ThemeTogglerButtonProps) {
  const external = typeof extSetTheme === 'function';
  const local = useLocalThemeStore(storageKey);
  const store = external
    ? {
        theme: extTheme ?? 'system',
        resolvedTheme: extResolved ?? resolveMode(extTheme ?? 'system'),
        setTheme: extSetTheme,
      }
    : local;

  const [el, setEl] = useState<HTMLButtonElement | null>(null);
  const [scheme, readScheme] = useButtonScheme(el);
  const [hover, setHover] = useState(false);
  const [focusVisible, setFocusVisible] = useState(false);
  const [shown, setShown] = useState<ThemeMode>(store.theme);
  const busy = useRef(false);
  const currentVT = useRef<ViewTransitionLike | null>(null);
  const userRef = useRef(ref);
  userRef.current = ref;

  const setRefs = useCallback((node: HTMLButtonElement | null) => {
    setEl(node);
    const r = userRef.current;
    if (typeof r === 'function') r(node);
    else if (r) (r as { current: HTMLButtonElement | null }).current = node;
  }, []);

  const getTarget = useCallback((): HTMLElement | null => {
    if (!canUseDOM) return null;
    if (target === undefined) return document.documentElement;
    if (target && 'current' in target) return target.current;
    return target ?? null;
  }, [target]);

  // Sincroniza o ícone com o armazenamento quando o tema muda por outro meio.
  useEffect(() => {
    if (!busy.current) setShown(store.theme);
  }, [store.theme]);

  // Armazenamento padrão: mantém a classe aplicada no alvo.
  useLayoutEffect(() => {
    if (external) return;
    applyThemeClass(getTarget(), local.resolvedTheme);
  }, [external, local.resolvedTheme, getTarget]);

  useEffect(() => {
    retainVtStyle();
    return () => {
      releaseVtStyle();
      currentVT.current?.skipTransition?.();
    };
  }, []);

  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (busy.current) return; // ignora cliques durante a cortina
    const list = modes.length ? modes : (['light', 'dark'] as ThemeMode[]);
    const idx = list.indexOf(shown);
    const next = idx === -1 ? list[0] : list[(idx + 1) % list.length];
    const nextResolved = resolveMode(next);

    flushSync(() => setShown(next));
    onImmediateChange?.(next);

    // Mesmo tema já visível: só grava a escolha.
    if (nextResolved === store.resolvedTheme) {
      store.setTheme(next);
      return;
    }

    const doc = document as DocWithVT;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tgt = getTarget();
    if (typeof doc.startViewTransition !== 'function' || reduced) {
      applyThemeClass(tgt, nextResolved);
      store.setTheme(next);
      return;
    }

    busy.current = true;
    const apply = () =>
      // Aplica o tema de forma síncrona e força o render antes da captura da imagem nova.
      flushSync(() => {
        applyThemeClass(tgt, nextResolved);
        readScheme();
      });
    // Rede de segurança: se a página não renderiza (aba oculta, etc.), a transição pode ficar
    // pendente; após o prazo, aplica o tema direto e libera o botão.
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<'timeout'>((res) => {
      watchdog = setTimeout(() => res('timeout'), duration + 1500);
    });
    try {
      const vt = doc.startViewTransition(apply);
      currentVT.current = vt;
      const run = (async () => {
        await vt.ready;
        const anim = document.documentElement.animate(
          { clipPath: [CLIP_FROM[direction], 'inset(0 0 0 0)'] },
          { duration, easing, pseudoElement: '::view-transition-new(root)' },
        );
        await Promise.race([anim.finished, vt.finished]);
        await vt.finished;
      })().catch(() => undefined);
      if ((await Promise.race([run, timeout])) === 'timeout') {
        vt.skipTransition?.();
        applyThemeClass(tgt, nextResolved);
        readScheme();
      }
    } catch {
      applyThemeClass(tgt, nextResolved);
    } finally {
      clearTimeout(watchdog);
      currentVT.current = null;
      busy.current = false;
      store.setTheme(next); // persiste ao terminar
    }
  };

  const sysDark = useSystemDark();
  const iconMode: ThemeMode = modes.includes('system')
    ? shown
    : shown === 'system'
      ? sysDark
        ? 'dark'
        : 'light'
      : shown;
  const Icon = iconMode === 'system' ? Monitor : iconMode === 'dark' ? Moon : Sun;

  const list = modes.length ? modes : (['light', 'dark'] as ThemeMode[]);
  const idx = list.indexOf(shown);
  const upcoming = idx === -1 ? list[0] : list[(idx + 1) % list.length];

  const look = variantLook(scheme, variant, hover && !disabled);
  const dims = SIZES[size];
  const ring = TOKENS[scheme].ring;
  const shadows: string[] = [];
  if (look.shadow) shadows.push(SHADOW_XS);
  if (focusVisible) shadows.push(`0 0 0 3px ${mix(ring, 50)}`);

  const btnStyle: CSSProperties = {
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
    cursor: disabled ? 'default' : 'pointer',
    boxSizing: 'border-box',
    transition: 'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    ...(disabled ? { opacity: 0.5, pointerEvents: 'none' } : null),
    ...style,
  };

  return (
    <button
      type="button"
      aria-label={`Mudar para tema ${LABEL[upcoming]}`}
      title={`Mudar para tema ${LABEL[upcoming]}`}
      {...rest}
      ref={setRefs}
      disabled={disabled}
      className={className}
      style={btnStyle}
      data-variant={variant}
      data-size={size}
      data-mode={shown}
      onClick={handleClick}
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
    >
      <Icon size={dims.icon} strokeWidth={2} aria-hidden="true" focusable="false" />
    </button>
  );
}

export default ThemeTogglerButton;
