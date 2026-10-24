// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type ShareButtonSize = "default" | "sm" | "md" | "lg";
export type ShareIconPosition = "before" | "after" | "none";
export type SharePlatform = "github" | "x" | "facebook";

export interface ShareButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  children: ReactNode;
  size?: ShareButtonSize;
  iconPosition?: ShareIconPosition;
  onIconClick?: (platform: SharePlatform, event: ReactMouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const SIZES: Record<ShareButtonSize, { h: number; w: number; px: number; r: number; icon: number }> = {
  default: { h: 40, w: 112, px: 16, r: 9, icon: 16 },
  sm: { h: 36, w: 96, px: 12, r: 6, icon: 16 },
  md: { h: 40, w: 112, px: 16, r: 9, icon: 20 },
  lg: { h: 44, w: 128, px: 32, r: 9, icon: 28 },
};

/** Tema do palco: classe dark/light do ancestral mais próximo, senão prefers-color-scheme. */
function useStageDark(ref: React.RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const host = el?.closest(".dark, .light") as HTMLElement | null;
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const read = () => setDark(host ? host.classList.contains("dark") : !!mq?.matches);
    read();
    const mo = host ? new MutationObserver(read) : null;
    mo?.observe(host!, { attributes: true, attributeFilter: ["class"] });
    mq?.addEventListener?.("change", read);
    return () => {
      mo?.disconnect();
      mq?.removeEventListener?.("change", read);
    };
  }, [ref]);
  return dark;
}

const svgBase = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
};

/** Três círculos ligados em forma de "<". */
function ShareGlyph({ size }: { size: number }) {
  return (
    <svg {...svgBase} width={size} height={size}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5 15.4 6.5M8.6 13.5l6.8 4" />
    </svg>
  );
}

/** Gato-polvo: cabeça com orelhas e tentáculos curvos (desenho próprio). */
function CatGlyph({ size }: { size: number }) {
  return (
    <svg {...svgBase} width={size} height={size}>
      <path d="M6 9.5V4.5l3.2 2.6a8 8 0 0 1 5.6 0L18 4.5v5a6.5 6.5 0 0 1-3.2 5.6" />
      <path d="M6 9.5a6.5 6.5 0 0 0 3.2 5.6" />
      <path d="M9.2 15.1c-.6 1.4-.6 3 .2 4.9M14.8 15.1c.6 1.4.6 3-.2 4.9M12 15.8V21" />
      <path d="M9.2 18c-1.8.4-3.3-.2-4.2-1.6" />
    </svg>
  );
}

/** "X" estilizado: diagonal dupla + diagonal partida (não é um sinal de fechar). */
function XGlyph({ size }: { size: number }) {
  return (
    <svg {...svgBase} width={size} height={size}>
      <path d="M4 4h4.2L20 20h-4.2z" />
      <path d="M20 4l-6.6 7.4M10.6 12.6 4 20" />
    </svg>
  );
}

/** "f" minúsculo em traço. */
function FGlyph({ size }: { size: number }) {
  return (
    <svg {...svgBase} width={size} height={size}>
      <path d="M16 3h-2.5A3.5 3.5 0 0 0 10 6.5V21M6.5 10H15" />
    </svg>
  );
}

const PLATFORMS: { id: SharePlatform; label: string; Glyph: (p: { size: number }) => ReactNode }[] = [
  { id: "github", label: "Compartilhar no GitHub", Glyph: CatGlyph },
  { id: "x", label: "Compartilhar no X", Glyph: XGlyph },
  { id: "facebook", label: "Compartilhar no Facebook", Glyph: FGlyph },
];

export function ShareButton({
  children,
  size = "default",
  iconPosition = "none",
  onIconClick,
  className = "",
  disabled,
  onClick,
  style,
  ...rest
}: ShareButtonProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dark = useStageDark(wrapRef);
  const reduce = useReducedMotion();
  const s = SIZES[size] ?? SIZES.default;

  const [hovered, setHovered] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const swallowClick = useRef(false);
  const open = !disabled && (hovered || focusOpen || touchOpen);

  // Toque: o primeiro toque abre; toque fora fecha.
  useEffect(() => {
    if (!touchOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setTouchOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [touchOpen]);

  const handleIcon = useCallback(
    (platform: SharePlatform, e: ReactMouseEvent<HTMLButtonElement>) => {
      onIconClick?.(platform, e);
      // Mantém o contrato original: o clique no ícone também aciona a ação do botão.
      onClick?.(e);
    },
    [onIconClick, onClick],
  );

  const bg = dark ? "229,229,229" : "23,23,23";
  const fg = dark ? "#171717" : "#fafafa";
  const ring = dark ? "rgba(115,115,115,.5)" : "rgba(163,163,163,.5)";

  const D = 24;
  const fade = { duration: 0.3 };
  const contentMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: -D }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -D } };
  const barMotion = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: D }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: D } };

  return (
    <div
      ref={wrapRef}
      className={`group relative inline-flex shrink-0 items-center justify-center overflow-hidden whitespace-nowrap font-medium transition-all duration-150 ${className}`}
      style={{
        height: s.h,
        minWidth: s.w,
        width: s.w,
        borderRadius: s.r,
        fontSize: 14,
        color: fg,
        background: `rgba(${bg},${hovered && !disabled ? 0.9 : 1})`,
        boxShadow: focusOpen ? `0 0 0 3px ${ring}` : undefined,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : undefined,
        cursor: "pointer",
        ...style,
      }}
      onPointerEnter={(e) => e.pointerType !== "touch" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType !== "touch" && setHovered(false)}
      onPointerDown={(e) => {
        if (e.pointerType === "touch" && !open) {
          setTouchOpen(true);
          swallowClick.current = true;
        }
      }}
      onFocus={(e) => {
        if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocusOpen(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setFocusOpen(false);
          setTouchOpen(false);
        }
      }}
    >
      {/* Botão principal: nome acessível = conteúdo; cobre a área inteira. */}
      <button
        type="button"
        {...rest}
        disabled={disabled}
        className="absolute inset-0 cursor-pointer appearance-none border-0 bg-transparent p-0 outline-none"
        style={{ borderRadius: s.r, color: "inherit" }}
        onClick={(e) => {
          if (swallowClick.current) {
            swallowClick.current = false;
            return;
          }
          onClick?.(e);
        }}
      >
        <span className="sr-only" style={srOnly}>
          {children}
        </span>
      </button>

      <AnimatePresence mode="wait" initial={false}>
        {!open ? (
          <motion.span
            key="content"
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ gap: 8, paddingInline: s.px, paddingBlock: 8 }}
            transition={fade}
            {...contentMotion}
          >
            {iconPosition === "before" && <ShareGlyph size={16} />}
            <span>{children}</span>
            {iconPosition === "after" && <ShareGlyph size={16} />}
          </motion.span>
        ) : (
          <motion.div
            key="icons"
            role="group"
            aria-label="Redes para compartilhar"
            className="absolute inset-0 flex items-center justify-center"
            style={{ gap: 12 }}
            transition={fade}
            {...barMotion}
          >
            {PLATFORMS.map(({ id, label, Glyph }, i) => (
              <motion.button
                key={id}
                type="button"
                aria-label={label}
                className="m-0 flex cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 outline-none focus-visible:ring-2"
                style={{ color: "inherit", borderRadius: 8, ["--tw-ring-color" as string]: ring }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: D }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                transition={
                  reduce
                    ? { duration: 0.2, delay: i * 0.1 }
                    : { type: "spring", duration: 0.5, bounce: 0.4, delay: i * 0.1 }
                }
                onClick={(e) => handleIcon(id, e)}
              >
                <motion.span
                  className="flex items-center justify-center"
                  style={{ paddingBlock: 12, borderRadius: 8 }}
                  whileHover={reduce ? undefined : { y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Glyph size={s.icon} />
                </motion.span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

export default ShareButton;
