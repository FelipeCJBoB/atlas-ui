// Atlas — autoria própria (reescrita em sala limpa a partir de especificação funcional).
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";

export interface PresenceUser {
  id: string;
  name: string;
  initials: string;
  online: boolean;
  /** Imagem opcional; sem ela, gera-se um avatar procedural. */
  image?: string;
  /** Matiz-base (0–360) do gradiente procedural; padrão derivado do id. */
  hue?: number;
}

export interface UserPresenceAvatarProps {
  users?: PresenceUser[];
  onStatusChange?: (id: string, online: boolean) => void;
  avatarSize?: number;
  overlap?: number;
  className?: string;
}

export const DEFAULT_USERS: PresenceUser[] = [
  { id: "ana", name: "Ana Lima", initials: "AL", online: true, hue: 340 },
  { id: "bruno", name: "Bruno Reis", initials: "BR", online: true, hue: 210 },
  { id: "caio", name: "Caio Nunes", initials: "CN", online: true, hue: 150 },
  { id: "dora", name: "Dora Melo", initials: "DM", online: false, hue: 30 },
  { id: "eva", name: "Eva Rocha", initials: "ER", online: false, hue: 270 },
  { id: "fabio", name: "Fábio Luz", initials: "FL", online: false, hue: 185 },
];

function useStageDark(ref: React.RefObject<HTMLElement | null>) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const host = ref.current?.closest(".dark, .light") as HTMLElement | null;
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

function hueOf(u: PresenceUser) {
  if (typeof u.hue === "number") return u.hue;
  let h = 0;
  for (const c of u.id) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

const AVATAR_SPRING = { type: "spring" as const, stiffness: 200, damping: 25 };
const PILL_SPRING = { type: "spring" as const, stiffness: 150, damping: 20 };
const TIP_SPRING = { type: "spring" as const, stiffness: 300, damping: 35 };

/* ---------------- Avatar ---------------- */

function AvatarFace({ user, size, muted, mutedFg }: { user: PresenceUser; size: number; muted: string; mutedFg: string }) {
  const [broken, setBroken] = useState(false);
  const h = hueOf(user);
  if (user.image && !broken) {
    return (
      <img
        src={user.image}
        alt=""
        draggable={false}
        onError={() => setBroken(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    );
  }
  // Com imagem quebrada: fallback atenuado; sem imagem: gradiente procedural.
  const fallback = !!user.image;
  return (
    <span
      aria-hidden
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: fallback
          ? muted
          : `linear-gradient(135deg, hsl(${h} 80% 62%), hsl(${(h + 55) % 360} 72% 42%))`,
        color: fallback ? mutedFg : "#ffffff",
        fontWeight: 600,
        fontSize: Math.round(size * 0.4),
        letterSpacing: "0.01em",
        userSelect: "none",
      }}
    >
      {user.initials}
    </span>
  );
}

/* ---------------- Tooltip ---------------- */

interface TipState {
  el: HTMLElement;
  text: string;
  key: string;
}

function Tooltip({ tip, id, dark, instant }: { tip: TipState | null; id: string; dark: boolean; instant: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0, below: false, arrowX: 0, slide: false });
  const prevTip = useRef<TipState | null>(null);
  const slideRef = useRef(false);

  useLayoutEffect(() => {
    if (!tip) {
      prevTip.current = null;
      return;
    }
    // Primeiro posicionamento sem deslizar; entre alvos (ou após mover o alvo), desliza com mola.
    if (tip !== prevTip.current) {
      slideRef.current = prevTip.current !== null;
      prevTip.current = tip;
    }
    const box = boxRef.current;
    const w = box?.offsetWidth || tip.text.length * 7 + 24;
    const h = box?.offsetHeight || 28;
    if (w !== dims.w || h !== dims.h) setDims({ w, h });
    const r = tip.el.getBoundingClientRect();
    const vw = window.innerWidth;
    const gap = 10;
    const m = 8;
    let y = r.top - gap - h;
    let below = false;
    if (y < m) {
      y = r.bottom + gap;
      below = true;
    }
    const cx = r.left + r.width / 2;
    const x = Math.min(Math.max(cx - w / 2, m), Math.max(m, vw - w - m));
    const arrowX = Math.min(Math.max(cx - x, 10), w - 10);
    setPos({ x, y, below, arrowX, slide: slideRef.current });
  }, [tip, dims.w, dims.h]);

  const slide = pos.slide && !instant;

  const bg = dark ? "#fafafa" : "#171717";
  const fg = dark ? "#171717" : "#fafafa";
  const dy = pos.below ? -15 : 15;

  return createPortal(
    <AnimatePresence>
      {tip && (
        <motion.div
          key="tip"
          style={{ position: "fixed", left: 0, top: 0, zIndex: 50, pointerEvents: "none" }}
          initial={{ x: pos.x, y: pos.y }}
          animate={{ x: pos.x, y: pos.y }}
          transition={slide ? TIP_SPRING : { duration: 0 }}
        >
          <motion.div
            ref={boxRef}
            id={id}
            role="tooltip"
            initial={instant ? { opacity: 0 } : { opacity: 0, scale: 0, y: dy }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={instant ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0, y: dy }}
            transition={instant ? { duration: 0 } : TIP_SPRING}
            style={{
              position: "relative",
              background: bg,
              color: fg,
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              lineHeight: "16px",
              maxWidth: 220,
              textWrap: "balance" as never,
              whiteSpace: "normal",
              transformOrigin: `${pos.arrowX}px ${pos.below ? "0%" : "100%"}`,
              fontFamily: "inherit",
            }}
          >
            {tip.text}
            <svg
              width={12}
              height={6}
              viewBox="0 0 12 6"
              aria-hidden
              style={{
                position: "absolute",
                left: pos.arrowX - 6,
                [pos.below ? "top" : "bottom"]: -6,
                transform: pos.below ? "rotate(180deg)" : undefined,
                display: "block",
              }}
            >
              <path d="M0 0h12L7.1 5.2a1.5 1.5 0 0 1-2.2 0z" fill={bg} />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------------- Componente ---------------- */

export function UserPresenceAvatar({
  users: initialUsers = DEFAULT_USERS,
  onStatusChange,
  avatarSize = 48,
  overlap = 12,
  className = "",
}: UserPresenceAvatarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dark = useStageDark(rootRef);
  const reduce = !!useReducedMotion();
  const tipId = useId();

  const [users, setUsers] = useState<PresenceUser[]>(initialUsers);
  const [lowered, setLowered] = useState<"online" | "offline" | null>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const zTimer = useRef<number | undefined>(undefined);

  useEffect(() => setUsers(initialUsers), [initialUsers]);

  const pillBg = dark ? "#404040" : "#d4d4d4";
  const muted = dark ? "#262626" : "#f5f5f5";
  const mutedFg = dark ? "#a3a3a3" : "#525252";

  const toggle = useCallback(
    (id: string) => {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      const moved = { ...u, online: !u.online };
      // A pílula de origem desce de camada por 500 ms: o avatar em trânsito passa por cima dela.
      setLowered(u.online ? "online" : "offline");
      window.clearTimeout(zTimer.current);
      zTimer.current = window.setTimeout(() => setLowered(null), 500);
      setUsers([...users.filter((x) => x.id !== id), moved]);
      onStatusChange?.(id, moved.online);
    },
    [users, onStatusChange],
  );

  const openTip = (el: HTMLElement, u: PresenceUser) => {
    window.clearTimeout(closeTimer.current);
    setTip({ el, text: u.name, key: u.id });
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setTip(null), 300);
  };
  const closeNow = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setTip(null);
  }, []);

  // Esc, rolagem e redimensionamento fecham o balão na hora.
  useEffect(() => {
    if (!tip) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeNow();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", closeNow, true);
    window.addEventListener("resize", closeNow);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", closeNow, true);
      window.removeEventListener("resize", closeNow);
    };
  }, [tip, closeNow]);

  // Após a troca, o balão segue o avatar na nova posição (o elemento é o mesmo).
  useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip((cur) => (cur ? { ...cur } : cur)), reduce ? 0 : 650);
    return () => window.clearTimeout(t);
  }, [users]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      window.clearTimeout(closeTimer.current);
      window.clearTimeout(zTimer.current);
    },
    [],
  );

  const groups: { key: "online" | "offline"; label: string; list: PresenceUser[] }[] = [
    { key: "online", label: "Online", list: users.filter((u) => u.online) },
    { key: "offline", label: "Offline", list: users.filter((u) => !u.online) },
  ];

  const none = { duration: 0 };

  return (
    <div ref={rootRef} className={`flex flex-wrap items-center justify-center ${className}`} style={{ gap: 20 }}>
      <LayoutGroup>
        {groups.map(
          (g) =>
            g.list.length > 0 && (
              <motion.div
                key={g.key}
                layout
                role="group"
                aria-label={g.label}
                transition={reduce ? none : PILL_SPRING}
                style={{
                  position: "relative",
                  zIndex: lowered === g.key ? 5 : 10,
                  background: pillBg,
                  padding: 2,
                  borderRadius: 9999,
                }}
              >
                <div className="flex items-center" style={{ height: avatarSize }}>
                  {g.list.map((u, i) => (
                    <motion.button
                      key={u.id}
                      layoutId={`presence-${u.id}`}
                      type="button"
                      aria-label={`${u.name}, ${u.online ? "online" : "offline"} — alternar status`}
                      aria-pressed={u.online}
                      aria-describedby={tip?.key === u.id ? tipId : undefined}
                      onClick={() => toggle(u.id)}
                      onPointerEnter={(e) => openTip(e.currentTarget, u)}
                      onPointerLeave={scheduleClose}
                      onFocus={(e) => openTip(e.currentTarget, u)}
                      onBlur={scheduleClose}
                      initial={false}
                      animate={{ filter: u.online ? "grayscale(0)" : "grayscale(1)", scale: 1 }}
                      transition={reduce ? none : AVATAR_SPRING}
                      className="relative block shrink-0 cursor-pointer appearance-none overflow-hidden p-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-0"
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        marginLeft: i === 0 ? 0 : -overlap,
                        borderRadius: 9999,
                        border: `3px solid ${pillBg}`,
                        boxSizing: "border-box",
                        background: muted,
                        ["--tw-ring-color" as string]: dark ? "#a3a3a3" : "#525252",
                      }}
                    >
                      <AvatarFace user={u} size={avatarSize} muted={muted} mutedFg={mutedFg} />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ),
        )}
      </LayoutGroup>
      <Tooltip tip={tip} id={tipId} dark={dark} instant={reduce} />
    </div>
  );
}

export default UserPresenceAvatar;
