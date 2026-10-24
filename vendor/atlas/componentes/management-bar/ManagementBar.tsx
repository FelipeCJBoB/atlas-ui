// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type RefObject,
} from 'react';
import { motion, useReducedMotion, useSpring, useTransform, type MotionValue, type Transition } from 'motion/react';
import { Ban, ChevronLeft, ChevronRight, Command, IdCard, X } from 'lucide-react';

type Theme = 'light' | 'dark';

export interface ManagementAction {
  id: string;
  label: string;
  icon: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' }>;
  colors: { light: { bg: string; fg: string }; dark: { bg: string; fg: string } };
  onClick?: () => void;
}

export interface ManagementBarProps {
  totalPages?: number;
  /** Página controlada (1..total). */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  actions?: ManagementAction[];
  primaryPrefix?: string;
  primaryTarget?: string;
  onPrimary?: () => void;
  /** Letra exibida no selo (com ⌘). O atalho só é escutado quando há `onPrimary`. */
  shortcutKey?: string;
  theme?: Theme | 'auto';
  className?: string;
}

export const DEFAULT_ACTIONS: ManagementAction[] = [
  {
    id: 'blacklist',
    label: 'Blacklist',
    icon: Ban,
    colors: {
      light: { bg: 'rgba(229,229,229,0.6)', fg: '#525252' },
      dark: { bg: 'rgba(82,82,82,0.8)', fg: '#e5e5e5' },
    },
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: X,
    colors: {
      light: { bg: 'rgba(255,201,201,0.6)', fg: '#e7000b' },
      dark: { bg: 'rgba(159,7,18,0.8)', fg: '#ffa2a2' },
    },
  },
  {
    id: 'hire',
    label: 'Hire',
    icon: IdCard,
    colors: {
      light: { bg: 'rgba(185,248,207,0.6)', fg: '#00a63e' },
      dark: { bg: 'rgba(1,102,48,0.8)', fg: '#7bf1a8' },
    },
  },
];

const TOKENS: Record<Theme, Record<string, string>> = {
  light: {
    '--mb-bg': '#ffffff',
    '--mb-fg': '#0a0a0a',
    '--mb-muted': '#737373',
    '--mb-border': '#e5e5e5',
    '--mb-cta': '#00bba7',
    '--mb-cta-hover': '#009689',
  },
  dark: {
    '--mb-bg': '#0a0a0a',
    '--mb-fg': '#fafafa',
    '--mb-muted': '#a1a1a1',
    '--mb-border': 'rgba(255,255,255,0.10)',
    '--mb-cta': 'rgba(0,150,137,0.8)',
    '--mb-cta-hover': '#005f5a',
  },
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useStageTheme(ref: RefObject<HTMLElement | null>, forced: Theme | 'auto'): Theme {
  const [theme, setTheme] = useState<Theme>(forced === 'auto' ? 'dark' : forced);
  useIsoLayoutEffect(() => {
    if (forced !== 'auto') {
      setTheme(forced);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const read = () => {
      const stage = el.closest('.light, .dark');
      setTheme(stage ? (stage.classList.contains('dark') ? 'dark' : 'light') : mq.matches ? 'dark' : 'light');
    };
    read();
    const mo = new MutationObserver(read);
    for (let n: HTMLElement | null = el.parentElement; n; n = n.parentElement) {
      mo.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
    mq.addEventListener('change', read);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', read);
    };
  }, [ref, forced]);
  return theme;
}

/* ---------- Número rolante ---------- */

const DIGIT_SPRING = { stiffness: 200, damping: 20, mass: 0.4 };

function DigitFace({ value, digit }: { value: MotionValue<number>; digit: number }) {
  // Deslocamento circular mais curto entre este algarismo e o valor contínuo da coluna.
  const y = useTransform(value, (v) => {
    let off = (((digit - v) % 10) + 10) % 10;
    if (off > 5) off -= 10;
    return `${off * 100}%`;
  });
  return (
    <motion.span className="absolute inset-0 flex items-center justify-center" style={{ y }}>
      {digit}
    </motion.span>
  );
}

function DigitColumn({ digit, instant }: { digit: number; instant: boolean }) {
  const spring = useSpring(0, DIGIT_SPRING);
  // Alvo acumulado: avança pelo caminho mais curto do círculo 0–9.
  const target = useRef(0);
  useEffect(() => {
    const cur = ((target.current % 10) + 10) % 10;
    let diff = (((digit - cur) % 10) + 10) % 10;
    if (diff > 5) diff -= 10;
    target.current += diff;
    if (instant) spring.jump(target.current);
    else spring.set(target.current);
  }, [digit, instant, spring]);
  return (
    <span className="relative block overflow-hidden" style={{ width: '1ch', height: '1.25em' }}>
      {Array.from({ length: 10 }, (_, d) => (
        <DigitFace key={d} value={spring} digit={d} />
      ))}
    </span>
  );
}

function RollingNumber({ value, instant }: { value: number; instant: boolean }) {
  const digits = String(Math.max(0, Math.floor(value))).split('').map(Number);
  // Chave pela posição a partir da direita: um dígito novo surge à esquerda.
  return (
    <span className="flex items-center tabular-nums" aria-hidden="true">
      {digits.map((d, i) => (
        <DigitColumn key={digits.length - i} digit={d} instant={instant} />
      ))}
    </span>
  );
}

/* ---------- Botão de ação expansível ---------- */

function ActionButton({ action, theme, reduced }: { action: ManagementAction; theme: Theme; reduced: boolean }) {
  const c = action.colors[theme];
  const Icon = action.icon;
  const t = (stiffness: number, damping: number, delay = 0): Transition =>
    reduced ? { duration: 0 } : { type: 'spring', stiffness, damping, delay };

  const buttonVariants = {
    rest: { maxWidth: 40, scale: 1, transition: { maxWidth: t(250, 25), scale: t(250, 25) } },
    // Atraso só na abertura; o fechamento é imediato.
    hover: { maxWidth: 140, transition: { maxWidth: t(200, 35, reduced ? 0 : 0.15) } },
    tap: { maxWidth: 140, scale: 0.95, transition: { scale: t(250, 25), maxWidth: t(200, 35) } },
  };
  const labelVariants = {
    rest: { opacity: 0, x: 4, transition: t(200, 25), transitionEnd: { visibility: 'hidden' as const } },
    hover: { opacity: 1, x: 0, visibility: 'visible' as const, transition: t(200, 25) },
    tap: { opacity: 1, x: 0, visibility: 'visible' as const, transition: t(200, 25) },
  };

  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileFocus="hover"
      whileTap="tap"
      variants={buttonVariants}
      className="flex h-10 shrink-0 cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap rounded-[10px] border-0 px-[10px] py-2 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mb-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mb-bg)]"
      style={{ background: c.bg, color: c.fg, maxWidth: 40 }}
    >
      <Icon size={20} className="shrink-0" aria-hidden="true" />
      <motion.span variants={labelVariants} style={{ opacity: 0, x: 4, visibility: 'hidden' }}>
        {action.label}
      </motion.span>
    </motion.button>
  );
}

/* ---------- Barra ---------- */

export function ManagementBar({
  totalPages = 10,
  page: pageProp,
  defaultPage = 1,
  onPageChange,
  actions = DEFAULT_ACTIONS,
  primaryPrefix = 'Move to:',
  primaryTarget = 'Interview I',
  onPrimary,
  shortcutKey = 'E',
  theme = 'auto',
  className,
}: ManagementBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const resolved = useStageTheme(rootRef, theme);
  const reduced = !!useReducedMotion();
  const [inner, setInner] = useState(defaultPage);
  const page = Math.min(Math.max(pageProp ?? inner, 1), totalPages);

  const go = (p: number) => {
    const next = Math.min(Math.max(p, 1), totalPages);
    if (next === page) return;
    if (pageProp === undefined) setInner(next);
    onPageChange?.(next);
  };

  // Atalho ⌘/Ctrl + tecla: só ativo quando há ação.
  const primaryRef = useRef(onPrimary);
  primaryRef.current = onPrimary;
  const hasPrimary = !!onPrimary;
  useEffect(() => {
    if (!hasPrimary) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === shortcutKey.toLowerCase()) {
        e.preventDefault();
        primaryRef.current?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasPrimary, shortcutKey]);

  const arrowCls =
    'inline-flex cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-1 text-[var(--mb-muted)] transition-colors duration-150 hover:text-[var(--mb-fg)] disabled:cursor-default disabled:opacity-30 disabled:hover:text-[var(--mb-muted)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mb-muted)]';
  const divider = 'mx-3 h-6 w-px shrink-0 rounded-full bg-[var(--mb-border)]';

  return (
    <div
      ref={rootRef}
      className={'@container flex w-full justify-center ' + (className ?? '')}
      style={TOKENS[resolved] as CSSProperties}
    >
      <div
        className="flex w-fit flex-col items-center gap-2 rounded-2xl border border-solid border-[var(--mb-border)] bg-[var(--mb-bg)] p-2 @lg:grid @lg:grid-cols-[auto_auto_auto] @lg:gap-x-0 @lg:gap-y-2 @xl:flex @xl:flex-row @xl:gap-0"
        style={{
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          color: 'var(--mb-fg)',
        }}
      >
        {/* Paginação */}
        <div className="flex h-10 items-center justify-self-center">
          <button type="button" className={arrowCls} aria-label="Página anterior" disabled={page <= 1} onClick={() => go(page - 1)}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div className="mx-2 flex items-center gap-1 text-center text-[14px] tabular-nums">
            <span className="flex items-center" style={{ color: 'var(--mb-fg)' }}>
              <RollingNumber value={page} instant={reduced} />
            </span>
            <span style={{ color: 'var(--mb-muted)' }} aria-hidden="true">
              / {totalPages}
            </span>
            <span className="sr-only" aria-live="polite">
              Página {page} de {totalPages}
            </span>
          </div>
          <button type="button" className={arrowCls} aria-label="Próxima página" disabled={page >= totalPages} onClick={() => go(page + 1)}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <span className={'hidden @lg:block ' + divider} aria-hidden="true" />

        {/* Ações */}
        <div className="flex flex-wrap items-center justify-center gap-2 justify-self-center sm:flex-nowrap">
          {actions.map((a) => (
            <ActionButton key={a.id} action={a} theme={resolved} reduced={reduced} />
          ))}
        </div>

        <span className={'hidden @xl:block ' + divider} aria-hidden="true" />

        {/* Chamada principal */}
        <motion.button
          type="button"
          onClick={onPrimary}
          whileTap={{ scale: 0.975 }}
          transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 550, damping: 30 }}
          aria-keyshortcuts={hasPrimary ? `Meta+${shortcutKey} Control+${shortcutKey}` : undefined}
          className="flex h-10 w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-[10px] border-0 bg-[var(--mb-cta)] px-3 py-2 text-[14px] text-white transition-colors duration-300 hover:bg-[var(--mb-cta-hover)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--mb-muted)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mb-bg)] @lg:col-span-3 @xl:w-auto"
        >
          <span className="mr-1" style={{ color: '#e5e5e5' }}>
            {primaryPrefix}
          </span>
          {primaryTarget}
          <span className="mx-3 h-5 w-px rounded-full bg-white/40" aria-hidden="true" />
          <span className="-mr-1 flex items-center gap-1 rounded-md bg-white/20 px-1.5 py-0.5" aria-hidden="true">
            <Command size={14} />
            {shortcutKey}
          </span>
        </motion.button>
      </div>
    </div>
  );
}

export default ManagementBar;
