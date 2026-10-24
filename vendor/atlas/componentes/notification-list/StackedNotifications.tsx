// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { motion, useReducedMotion, type Transition } from 'motion/react';
import { ArrowUpRight, RotateCcw } from 'lucide-react';

type Theme = 'light' | 'dark';

export interface NotificationItem {
  id?: string | number;
  title: string;
  subtitle: string;
  time: string;
  /** Contador opcional (só aparece quando informado). */
  count?: number;
}

export interface StackedNotificationsProps {
  notifications?: NotificationItem[];
  /** Número do selo; por padrão, a quantidade de notificações. */
  badgeCount?: number;
  footerLabel?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
  /** Faixa visível (px) de cada cartão empilhado. */
  peek?: number;
  /** Redução de largura por nível de empilhamento (0,05 = 5%). */
  shrinkStep?: number;
  theme?: Theme | 'auto';
  className?: string;
}

export const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, title: 'NPM Install Complete', subtitle: '1,227 packages added!', time: 'just now', count: 2 },
  { id: 2, title: 'Build Succeeded', subtitle: 'Build finished in 12.34s', time: '1m 11s' },
  { id: 3, title: 'Lint Passed', subtitle: 'No problems found', time: '5m' },
];

// Altura de cada cartão: 8 + 20 + 16 + 8 px (fixa, para não depender de medição).
const CARD_HEIGHT = 52;
const EXPANDED_GAP = 4;

const TOKENS: Record<Theme, Record<string, string>> = {
  light: {
    '--nl-panel': '#e5e5e5',
    '--nl-card': '#f5f5f5',
    '--nl-title': '#0a0a0a',
    '--nl-count': '#737373',
    '--nl-footer': '#525252',
  },
  dark: {
    '--nl-panel': '#171717',
    '--nl-card': '#262626',
    '--nl-title': '#fafafa',
    '--nl-count': '#d4d4d4',
    '--nl-footer': '#d4d4d4',
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

export function StackedNotifications({
  notifications = DEFAULT_NOTIFICATIONS,
  badgeCount,
  footerLabel = 'Notifications',
  viewAllLabel = 'View all',
  onViewAll,
  peek = 8,
  shrinkStep = 0.05,
  theme = 'auto',
  className,
}: StackedNotificationsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const resolved = useStageTheme(rootRef, theme);
  const reduced = !!useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const expanded = hovered || focused || tapped;
  const state = expanded ? 'expanded' : 'collapsed';

  const cardSpring: Transition = reduced ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 26, mass: 1 };
  const textTween: Transition = reduced ? { duration: 0 } : { duration: 0.22, ease: 'easeInOut' };
  const total = notifications.length;

  const cardVariants = {
    collapsed: (i: number) => ({
      marginTop: i === 0 ? 0 : -(CARD_HEIGHT - peek),
      scaleX: Math.max(0, 1 - i * shrinkStep),
      transition: cardSpring,
    }),
    expanded: (i: number) => ({
      marginTop: i === 0 ? 0 : EXPANDED_GAP,
      scaleX: 1,
      transition: cardSpring,
    }),
  };
  const labelVariants = {
    collapsed: { opacity: 1, y: 0, transition: textTween },
    expanded: { opacity: 0, y: -16, transition: textTween },
  };
  const viewAllVariants = {
    collapsed: { opacity: 0, y: 16, transition: textTween },
    expanded: { opacity: 1, y: 0, transition: textTween },
  };

  return (
    <motion.div
      ref={rootRef}
      className={'flex w-[320px] max-w-full flex-col gap-3 rounded-3xl p-3 ' + (className ?? '')}
      style={{
        ...(TOKENS[resolved] as CSSProperties),
        background: 'var(--nl-panel)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      }}
      initial={false}
      animate={state}
      onPointerEnter={(e) => {
        if (e.pointerType !== 'touch') setHovered(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== 'touch') setHovered(false);
      }}
      onPointerUp={(e) => {
        // Toque: alterna, já que não há hover.
        if (e.pointerType === 'touch' && !(e.target as HTMLElement).closest('button')) setTapped((t) => !t);
      }}
      onFocus={(e) => {
        // Só foco por teclado expande (clique de mouse não prende o painel aberto).
        if ((e.target as HTMLElement).matches?.(':focus-visible')) setFocused(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <ul className="m-0 flex list-none flex-col p-0" aria-label={footerLabel}>
        {notifications.map((n, i) => (
          <motion.li
            key={n.id ?? i}
            custom={i}
            variants={cardVariants}
            className="relative rounded-[14px] px-4 py-2 shadow-sm transition-shadow duration-200 hover:shadow-lg"
            style={{ background: 'var(--nl-card)', zIndex: total - i, originX: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <p className="m-0 text-[14px] font-medium leading-5" style={{ color: 'var(--nl-title)' }}>
                {n.title}
              </p>
              {typeof n.count === 'number' && (
                <span
                  className="flex items-center gap-0.5 text-[12px] font-medium leading-4"
                  style={{ color: 'var(--nl-count)' }}
                >
                  <RotateCcw size={12} aria-hidden="true" />
                  <span>{n.count}</span>
                </span>
              )}
            </div>
            <p className="m-0 text-[12px] font-medium leading-4" style={{ color: '#737373' }}>
              {n.time}
              {' • '}
              {n.subtitle}
            </p>
          </motion.li>
        ))}
      </ul>

      <div className="flex items-center gap-2">
        <span
          className="flex size-5 items-center justify-center rounded-full text-[12px] font-medium text-white"
          style={{ background: '#a1a1a1' }}
        >
          {badgeCount ?? total}
        </span>
        <span className="grid text-[14px] font-medium" style={{ color: 'var(--nl-footer)' }}>
          <motion.span
            className="[grid-area:1/1]"
            variants={labelVariants}
            style={{ pointerEvents: expanded ? 'none' : 'auto' }}
            aria-hidden={expanded}
          >
            {footerLabel}
          </motion.span>
          <motion.button
            type="button"
            onClick={onViewAll}
            className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left font-medium select-none [grid-area:1/1] [color:inherit] [font-size:inherit] outline-none focus-visible:underline"
            variants={viewAllVariants}
            style={{ pointerEvents: expanded ? 'auto' : 'none' }}
          >
            {viewAllLabel}
            <ArrowUpRight size={16} aria-hidden="true" />
          </motion.button>
        </span>
      </div>
    </motion.div>
  );
}

export default StackedNotifications;
