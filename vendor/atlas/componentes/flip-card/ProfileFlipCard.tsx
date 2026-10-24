// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Github, Linkedin, Twitter } from 'lucide-react';

type Theme = 'light' | 'dark';

export interface ProfileFlipCardStats {
  following: number;
  followers: number;
  posts?: number | null;
}

export interface ProfileFlipCardLinks {
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export interface ProfileFlipCardProps {
  name: string;
  /** Usuário sem o "@". */
  username: string;
  /** URL da imagem ou nó React (ex.: SVG). */
  avatar: string | ReactNode;
  bio: string;
  stats: ProfileFlipCardStats;
  links?: ProfileFlipCardLinks;
  /** Ação opcional do botão "Follow". */
  onFollow?: () => void;
  followLabel?: string;
  /** Tema forçado; por padrão detecta pelo ancestral `.light`/`.dark`. */
  theme?: Theme | 'auto';
  className?: string;
}

const TOKENS: Record<Theme, Record<string, string>> = {
  light: {
    '--fc-bg': '#ffffff',
    '--fc-fg': '#0a0a0a',
    '--fc-muted': '#f5f5f5',
    '--fc-muted-fg': '#737373',
    '--fc-primary': '#0a0a0a',
    '--fc-primary-90': 'rgba(10,10,10,0.9)',
    '--fc-on-primary': '#fafafa',
    '--fc-border': '#e5e5e5',
    '--fc-face-border': 'rgba(10,10,10,0.2)',
  },
  dark: {
    '--fc-bg': '#0a0a0a',
    '--fc-fg': '#fafafa',
    '--fc-muted': '#262626',
    '--fc-muted-fg': '#a1a1a1',
    '--fc-primary': '#fafafa',
    '--fc-primary-90': 'rgba(250,250,250,0.9)',
    '--fc-on-primary': '#0a0a0a',
    '--fc-border': 'rgba(255,255,255,0.10)',
    '--fc-face-border': 'rgba(250,250,250,0.2)',
  },
};

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Tema pelo ancestral `.light`/`.dark` mais próximo; sem ele, preferência do sistema.
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

// Dispositivo sem hover (toque): alterna no toque em vez de virar no hover.
function useNoHover(): boolean {
  const [noHover, setNoHover] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(hover: none)');
    const read = () => setNoHover(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);
  return noHover;
}

const EASE_OUT = [0, 0, 0.58, 1] as const;

const SOCIALS = [
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'github', label: 'GitHub', Icon: Github },
  { key: 'twitter', label: 'Twitter', Icon: Twitter },
] as const;

export function ProfileFlipCard({
  name,
  username,
  avatar,
  bio,
  stats,
  links,
  onFollow,
  followLabel = 'Follow',
  theme = 'auto',
  className,
}: ProfileFlipCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const resolved = useStageTheme(rootRef, theme);
  const noHover = useNoHover();
  const reduced = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const [toggleFocused, setToggleFocused] = useState(false);

  const toggle = useCallback(() => setFlipped((f) => !f), []);

  const transition = { duration: 0.5, ease: EASE_OUT };
  // Movimento reduzido: troca por esmaecimento, sem giro.
  const frontAnim = reduced ? { rotateY: 0, opacity: flipped ? 0 : 1 } : { rotateY: flipped ? 180 : 0, opacity: 1 };
  const backAnim = reduced ? { rotateY: 0, opacity: flipped ? 1 : 0 } : { rotateY: flipped ? 0 : 180, opacity: 1 };

  const faceBase: CSSProperties = {
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    transformStyle: 'preserve-3d',
    border: '2px solid var(--fc-face-border)',
  };

  const hasPosts = typeof stats.posts === 'number' && Number.isFinite(stats.posts);
  const statItems: { value: number; label: string }[] = [
    { value: stats.following, label: 'Following' },
    { value: stats.followers, label: 'Followers' },
    ...(hasPosts ? [{ value: stats.posts as number, label: 'Posts' }] : []),
  ];

  return (
    <div
      ref={rootRef}
      className={
        'relative mx-auto mt-2 h-[240px] w-[160px] cursor-pointer select-none md:h-[320px] md:w-[240px] ' +
        (className ?? '')
      }
      style={{
        ...(TOKENS[resolved] as CSSProperties),
        perspective: '1000px',
        color: 'var(--fc-fg)',
        borderRadius: 8,
        outline: toggleFocused ? '2px solid var(--fc-muted-fg)' : undefined,
        outlineOffset: 3,
      }}
      onPointerEnter={(e) => {
        if (!noHover && e.pointerType !== 'touch') setFlipped(true);
      }}
      onPointerLeave={(e) => {
        if (!noHover && e.pointerType !== 'touch') setFlipped(false);
      }}
      onClick={(e) => {
        // Toque: cada toque alterna (cliques em links/botão do verso não contam).
        if (!noHover) return;
        if ((e.target as HTMLElement).closest('a, [data-fc-follow]')) return;
        toggle();
      }}
    >
      {/* Alternância acessível por teclado (Enter/Espaço) */}
      <button
        type="button"
        className="sr-only"
        aria-pressed={flipped}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        onFocus={() => setToggleFocused(true)}
        onBlur={() => setToggleFocused(false)}
      >
        {flipped ? `Mostrar frente do cartão de ${name}` : `Mostrar verso do cartão de ${name}`}
      </button>

      {/* Frente */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center rounded-[8px] px-4 py-6 text-center"
        style={{
          ...faceBase,
          background: 'linear-gradient(to bottom right, var(--fc-muted), var(--fc-bg), var(--fc-muted))',
        }}
        initial={false}
        animate={frontAnim}
        transition={transition}
        aria-hidden={flipped}
        inert={flipped}
      >
        <div
          className="mb-4 size-20 shrink-0 overflow-hidden rounded-full md:size-24"
          style={{ border: '2px solid var(--fc-border)' }}
        >
          {typeof avatar === 'string' ? (
            <img src={avatar} alt={name} className="size-full object-cover" draggable={false} />
          ) : (
            <div role="img" aria-label={name} className="size-full [&>*]:size-full">
              {avatar}
            </div>
          )}
        </div>
        <p className="m-0 text-[18px] font-bold leading-tight" style={{ color: 'var(--fc-fg)' }}>
          {name}
        </p>
        <p className="m-0 text-[14px]" style={{ color: 'var(--fc-muted-fg)' }}>
          @{username}
        </p>
      </motion.div>

      {/* Verso */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-between gap-4 rounded-[8px] px-4 py-6"
        style={{
          ...faceBase,
          background: 'linear-gradient(to top right, var(--fc-muted), var(--fc-bg), var(--fc-muted))',
        }}
        initial={false}
        animate={backAnim}
        transition={transition}
        aria-hidden={!flipped}
        inert={!flipped}
      >
        <p
          className="m-0 line-clamp-4 text-center text-[12px] leading-snug md:line-clamp-none md:text-[14px]"
          style={{ color: 'var(--fc-muted-fg)' }}
        >
          {bio}
        </p>

        <div className="flex w-full justify-between px-6">
          {statItems.map((s) => (
            <div key={s.label} className="flex flex-col items-start text-left">
              <span className="text-[16px] font-bold leading-tight" style={{ color: 'var(--fc-fg)' }}>
                {String(s.value)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--fc-muted-fg)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {links && SOCIALS.some((s) => links[s.key]) && (
          <div className="flex items-center justify-center gap-4">
            {SOCIALS.filter((s) => links[s.key]).map(({ key, label, Icon }) => (
              <a
                key={key}
                href={links[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex transition-transform duration-150 hover:scale-105"
                style={{ color: 'var(--fc-fg)' }}
              >
                <Icon size={20} strokeWidth={2} aria-hidden="true" />
              </a>
            ))}
          </div>
        )}

        <button
          type="button"
          data-fc-follow=""
          onClick={(e) => {
            e.stopPropagation();
            onFollow?.();
          }}
          className="inline-flex h-10 cursor-pointer items-center justify-center rounded-[10px] bg-[var(--fc-primary)] px-4 py-2 text-[14px] font-medium text-[var(--fc-on-primary)] transition-colors hover:bg-[var(--fc-primary-90)]"
        >
          {followLabel}
        </button>
      </motion.div>
    </div>
  );
}

export default ProfileFlipCard;
